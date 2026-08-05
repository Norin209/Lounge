import { strFromU8, unzipSync } from 'fflate';

export type SalaryMonth = {
  key: string;
  label: string;
  date: string;
  total: number;
  baseTotal: number;
  adjustedTotal: number;
  commissionTotal: number;
  overtimeTotal: number;
  paybackTotal: number;
  extraRewardTotal: number;
  borrowTotal: number;
  deductionTotal: number;
  finalTotal: number;
  employeeCount: number;
  employees: SalaryEmployee[];
};

export type SalaryEmployee = {
  id: string;
  name: string;
  role: string;
  baseSalary: number;
  adjustedSalary: number;
  commission: number;
  overtime: number;
  extraReward: number;
  grossSalary: number;
  borrow: number;
  deduction: number;
  finalSalary: number;
};

const monthNumbers: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

function decodeXml(value: string) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number(code))
    );
}

function attribute(tag: string, name: string) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return tag.match(new RegExp(`\\b${escapedName}="([^"]*)"`))?.[1];
}

function xmlText(value: string) {
  return decodeXml(value.replace(/<[^>]+>/g, ''));
}

function columnIndex(reference: string) {
  const letters = reference.match(/^[A-Z]+/)?.[0] ?? '';
  return [...letters].reduce(
    (total, letter) => total * 26 + letter.charCodeAt(0) - 64,
    0
  ) - 1;
}

function rowIndex(reference: string) {
  return Number(reference.match(/\d+$/)?.[0] ?? 0);
}

function sheetMonth(title: string) {
  const match = title.trim().match(/^([A-Za-z]+)[\s_-]+(\d{4})$/);
  if (!match) return null;

  const month = monthNumbers[match[1].toLowerCase()];
  if (!month) return null;

  return { year: Number(match[2]), month };
}

function readSharedStrings(files: Record<string, Uint8Array>) {
  const file = files['xl/sharedStrings.xml'];
  if (!file) return [];

  const xml = strFromU8(file);
  return [...xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map(
    (match) =>
      [...match[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
        .map((text) => xmlText(text[1]))
        .join('')
  );
}

function readCells(
  file: Uint8Array,
  sharedStrings: string[]
) {
  const rows = new Map<number, Map<number, string | number>>();
  const xml = strFromU8(file);

  for (const match of xml.matchAll(
    /<c\b([^>]*\br="([A-P]\d+)"[^>]*)(?<!\/)>([\s\S]*?)<\/c>/g
  )) {
    const reference = match[2];

    const type = attribute(match[1], 't');
    const valueXml = match[3].match(/<v>([\s\S]*?)<\/v>/)?.[1];
    let value: string | number = '';

    if (type === 's' && valueXml !== undefined) {
      value = sharedStrings[Number(valueXml)] ?? '';
    } else if (type === 'inlineStr') {
      value = [...match[3].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
        .map((text) => xmlText(text[1]))
        .join('');
    } else if (valueXml !== undefined) {
      const decoded = decodeXml(valueXml);
      const numeric = Number(decoded);
      value = decoded !== '' && Number.isFinite(numeric) ? numeric : decoded;
    }

    const row = rowIndex(reference);
    const columns = rows.get(row) ?? new Map<number, string | number>();
    columns.set(columnIndex(reference), value);
    rows.set(row, columns);
  }

  return rows;
}

function numberValue(value: unknown) {
  if (typeof value === 'number') return value;
  const numeric = Number(String(value ?? '').replace(/[$,\s]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
}

function rounded(value: unknown) {
  return Math.round(numberValue(value) * 100) / 100;
}

function parseSalaryMonth(
  title: string,
  rows: Map<number, Map<number, string | number>>
): SalaryMonth {
  const month = sheetMonth(title);
  if (!month) throw new Error(`Unsupported salary tab: ${title}`);

  const header = [...rows.entries()]
    .filter(([row]) => row <= 15)
    .find(([, columns]) => {
      const labels = [...columns.values()].map((value) =>
        String(value).trim().toLowerCase()
      );
      return labels.includes('name') && labels.includes('total salary');
    });

  if (!header) {
    throw new Error(`Salary columns were not found in ${title}.`);
  }

  const [headerRow, columns] = header;
  const nameColumn = [...columns].find(
    ([, value]) => String(value).trim().toLowerCase() === 'name'
  )?.[0];
  const columnNamed = (label: string) =>
    [...columns].find(
      ([, value]) => String(value).trim().toLowerCase() === label
    )?.[0];
  const roleColumn = columnNamed('role');
  const salaryColumns = [...columns]
    .filter(
      ([column, value]) =>
        String(value).trim().toLowerCase() === 'salary' &&
        roleColumn !== undefined &&
        column > roleColumn
    )
    .map(([column]) => column);
  const commissionColumn = columnNamed('commission');
  const overtimeColumn = columnNamed('ot');
  const paybackColumn = [...columns].find(([, value]) => {
    const label = String(value).trim().toLowerCase();
    return label === 'payback' || label === 'return saleries';
  })?.[0];
  const extraRewardColumn = columnNamed('extra reward');
  const grossSalaryColumn = columnNamed('total salary');
  const borrowColumn = columnNamed('borrow');
  const deductionColumn = [...columns].find(([, value]) =>
    String(value).trim().toLowerCase().startsWith('agreement')
  )?.[0];
  const sortedSalaryColumns = [...salaryColumns].sort((a, b) => a - b);
  const baseSalaryColumn = sortedSalaryColumns[0];
  const adjustedSalaryColumn = sortedSalaryColumns[1] ?? baseSalaryColumn;
  const finalSalaryColumn = Math.max(...salaryColumns);

  if (
    nameColumn === undefined ||
    roleColumn === undefined ||
    grossSalaryColumn === undefined ||
    !Number.isFinite(baseSalaryColumn) ||
    !Number.isFinite(finalSalaryColumn)
  ) {
    throw new Error(`Final salary column was not found in ${title}.`);
  }

  const employees: SalaryEmployee[] = [];

  for (const [row, values] of rows) {
    if (row <= headerRow) continue;

    const employeeNumber = numberValue(values.get(nameColumn - 1));
    const name = String(values.get(nameColumn) ?? '').trim();
    if (employeeNumber <= 0 || !name) continue;

    const employee: SalaryEmployee = {
      id: `${title.toLowerCase()}-${row}`,
      name,
      role: String(values.get(roleColumn) ?? '').trim() || '—',
      baseSalary: rounded(values.get(baseSalaryColumn)),
      adjustedSalary: rounded(values.get(adjustedSalaryColumn)),
      commission: rounded(values.get(commissionColumn ?? -1)),
      overtime: rounded(values.get(overtimeColumn ?? -1)),
      extraReward: rounded(values.get(extraRewardColumn ?? -1)),
      grossSalary: rounded(values.get(grossSalaryColumn)),
      borrow: rounded(values.get(borrowColumn ?? -1)),
      deduction: rounded(values.get(deductionColumn ?? -1)),
      finalSalary: rounded(values.get(finalSalaryColumn)),
    };

    employees.push(employee);
  }

  const summary = [...rows.entries()]
    .filter(([row]) => row > headerRow)
    .find(([, values]) => {
      const hasNoEmployee = !String(values.get(nameColumn) ?? '').trim();
      const gross = values.get(grossSalaryColumn);
      const final = values.get(finalSalaryColumn);
      return (
        hasNoEmployee &&
        typeof gross === 'number' &&
        typeof final === 'number' &&
        gross > 0
      );
    })?.[1];

  if (!summary) {
    throw new Error(`Salary summary row was not found in ${title}.`);
  }

  const baseTotal = rounded(summary.get(baseSalaryColumn));
  const adjustedTotal = rounded(summary.get(adjustedSalaryColumn));
  const commissionTotal = rounded(summary.get(commissionColumn ?? -1));
  const overtimeTotal = rounded(summary.get(overtimeColumn ?? -1));
  const paybackTotal = rounded(summary.get(paybackColumn ?? -1));
  const extraRewardTotal = rounded(summary.get(extraRewardColumn ?? -1));
  const grossTotal = rounded(summary.get(grossSalaryColumn));
  const borrowTotal = rounded(summary.get(borrowColumn ?? -1));
  const deductionTotal = rounded(summary.get(deductionColumn ?? -1));
  const finalTotal = rounded(summary.get(finalSalaryColumn));

  const monthDate = new Date(Date.UTC(month.year, month.month - 1, 1));
  const finalDay = new Date(Date.UTC(month.year, month.month, 0));

  return {
    key: `${month.year}-${String(month.month).padStart(2, '0')}`,
    label: monthDate.toLocaleDateString('en-AU', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }),
    date: finalDay.toISOString().slice(0, 10),
    total: grossTotal,
    baseTotal,
    adjustedTotal,
    commissionTotal,
    overtimeTotal,
    paybackTotal,
    extraRewardTotal,
    borrowTotal,
    deductionTotal,
    finalTotal,
    employeeCount: employees.length,
    employees: [...employees].sort((a, b) =>
      b.finalSalary - a.finalSalary
    ),
  };
}

export function parseSalaryWorkbook(workbook: ArrayBuffer) {
  const files = unzipSync(new Uint8Array(workbook));
  const workbookFile = files['xl/workbook.xml'];
  const relationshipsFile = files['xl/_rels/workbook.xml.rels'];

  if (!workbookFile || !relationshipsFile) {
    throw new Error('The salary workbook is not a valid Excel file.');
  }

  const workbookXml = strFromU8(workbookFile);
  const relationshipsXml = strFromU8(relationshipsFile);
  const relationships = new Map<string, string>();

  for (const match of relationshipsXml.matchAll(/<Relationship\b([^>]*)\/?\s*>/g)) {
    const id = attribute(match[1], 'Id');
    const target = attribute(match[1], 'Target');
    if (id && target) relationships.set(id, target);
  }

  const sheets: Array<{ title: string; path: string }> = [];
  for (const match of workbookXml.matchAll(/<sheet\b([^>]*)\/?\s*>/g)) {
    const title = decodeXml(attribute(match[1], 'name') ?? '');
    const relationshipId = attribute(match[1], 'r:id');
    const target = relationshipId
      ? relationships.get(relationshipId)
      : undefined;
    if (!title || !target || !sheetMonth(title)) continue;

    const normalizedTarget = target.replace(/^\//, '');
    sheets.push({
      title,
      path: normalizedTarget.startsWith('xl/')
        ? normalizedTarget
        : `xl/${normalizedTarget}`,
    });
  }

  const sharedStrings = readSharedStrings(files);
  return sheets
    .map(({ title, path }) => {
      const file = files[path];
      if (!file) throw new Error(`Missing worksheet data for ${title}.`);
      return parseSalaryMonth(title, readCells(file, sharedStrings));
    })
    .sort((a, b) => b.key.localeCompare(a.key));
}
