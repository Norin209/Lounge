import { createSign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { NextResponse } from 'next/server';
import {
  type ExpenseData,
} from '@/app/admin/expenses/expense-source';
import { parseSalaryWorkbook } from './salary-workbook';
import { parseMonth, sheetMonth } from './expense-workbook';

export const dynamic = 'force-dynamic';

const spreadsheetId =
  process.env.GOOGLE_SHEETS_SPREADSHEET_ID ??
  '1t2QwHPsTOUuxf8bgo_mc4zozpQb6kphLvqSI6U1Plkw';

const salaryFileId =
  process.env.GOOGLE_DRIVE_SALARY_FILE_ID ??
  '1slVoQaPLB1CZ19fFgyr9E70Zjv1O-7mi';

type GoogleCredentials = {
  client_email: string;
  private_key: string;
};

type SheetMetadata = {
  properties?: { title?: string };
};

type SpreadsheetMetadata = {
  properties?: { title?: string };
  sheets?: SheetMetadata[];
};

type ValueRange = {
  range?: string;
  values?: unknown[][];
};

function base64Url(value: string | Buffer) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function credentials(): GoogleCredentials {
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (credentialsPath) {
    return JSON.parse(
      readFileSync(credentialsPath, 'utf8')
    ) as GoogleCredentials;
  }

  const encoded = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64;

  if (encoded) {
    return JSON.parse(
      Buffer.from(encoded, 'base64').toString('utf8')
    ) as GoogleCredentials;
  }

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(
    /\\n/g,
    '\n'
  );

  if (!clientEmail || !privateKey) {
    throw new Error(
      'Google Sheets credentials have not been configured.'
    );
  }

  return { client_email: clientEmail, private_key: privateKey };
}

async function accessToken() {
  const serviceAccount = credentials();
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = base64Url(
    JSON.stringify({ alg: 'RS256', typ: 'JWT' })
  );
  const claims = base64Url(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: [
        'https://www.googleapis.com/auth/spreadsheets.readonly',
        'https://www.googleapis.com/auth/drive.readonly',
      ].join(' '),
      aud: 'https://oauth2.googleapis.com/token',
      iat: issuedAt,
      exp: issuedAt + 3600,
    })
  );
  const unsignedToken = `${header}.${claims}`;
  const signature = createSign('RSA-SHA256')
    .update(unsignedToken)
    .sign(serviceAccount.private_key);
  const assertion = `${unsignedToken}.${base64Url(signature)}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Google authentication failed (${response.status}).`);
  }

  const result = (await response.json()) as { access_token?: string };
  if (!result.access_token) {
    throw new Error('Google authentication returned no access token.');
  }

  return result.access_token;
}

async function googleGet<T>(path: string, token: string): Promise<T> {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}${path}`,
    {
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Google Sheets request failed (${response.status}): ${details.slice(0, 250)}`
    );
  }

  return response.json() as Promise<T>;
}

async function downloadSalaryWorkbook(token: string) {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${salaryFileId}?alt=media`,
    {
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    throw new Error(
      `Salary workbook download failed (${response.status}).`
    );
  }

  return response.arrayBuffer();
}

async function readExpenses(): Promise<ExpenseData> {
  const token = await accessToken();
  const [metadata, salaryWorkbook] = await Promise.all([
    googleGet<SpreadsheetMetadata>(
      '?fields=properties.title,sheets.properties.title',
      token
    ),
    downloadSalaryWorkbook(token),
  ]);
  const titles = (metadata.sheets ?? [])
    .map((sheet) => sheet.properties?.title ?? '')
    .filter((title) => sheetMonth(title));

  if (titles.length === 0) {
    throw new Error('No monthly tabs such as July-2026 were found.');
  }

  const query = new URLSearchParams({
    valueRenderOption: 'UNFORMATTED_VALUE',
    dateTimeRenderOption: 'SERIAL_NUMBER',
  });
  titles.forEach((title) => query.append('ranges', `'${title.replaceAll("'", "''")}'!A:ZZ`));
  const values = await googleGet<{ valueRanges?: ValueRange[] }>(
    `/values:batchGet?${query.toString()}`,
    token
  );
  const expenseMonths = titles
    .map((title, index) =>
      ({ ...parseMonth(title, values.valueRanges?.[index]?.values ?? []), hasExpenseSheet: true })
    );
  const monthsByKey = new Map(
    expenseMonths.map((month) => [month.key, month])
  );

  const salaryMonths = parseSalaryWorkbook(salaryWorkbook);

  for (const salary of salaryMonths) {
    const month = monthsByKey.get(salary.key) ?? {
      key: salary.key,
      label: salary.label,
      expenses: [],
      hasExpenseSheet: false,
      warnings: [],
    };
    month.warnings = [...(month.warnings ?? []), ...salary.warnings];

    month.expenses.push({
      id: `${salary.key}-salaries`,
      date: salary.date,
      category: 'Salaries',
      description: 'Monthly salary payments',
      quantity: salary.employeeCount,
      unitPrice:
        salary.employeeCount === 0
          ? 0
          : salary.finalTotal / salary.employeeCount,
      total: salary.finalTotal,
    });
    month.expenses.sort((a, b) => b.date.localeCompare(a.date));
    monthsByKey.set(salary.key, month);
  }

  const months = [...monthsByKey.values()].sort((a, b) =>
    b.key.localeCompare(a.key)
  );

  return {
    source: `${metadata.properties?.title ?? 'Google Sheets'} + live salaries`,
    months,
    salaryMonths,
  };
}

export async function GET() {
  try {
    return NextResponse.json(await readExpenses(), {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error) {
    console.error('Unable to load live expenses:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to load live expenses.',
      },
      { status: 500 }
    );
  }
}
