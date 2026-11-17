import { read, SSF, utils } from 'xlsx';

export type Cell = string | number | boolean | null;
export type ImportSheet = { name: string; rows: Cell[][]; date1904: boolean };
export type SheetMapping = {
  enabled: boolean;
  headerRow: number;
  dateColumn: number;
  amountColumn: number;
  fallbackMonth: string;
};
export type EarningsDay = { date: string; amountCents: number; rowCount: number };
export type EarningsMonth = {
  key: string;
  totalCents: number;
  undatedCents: number;
  rowCount: number;
  days: EarningsDay[];
  sheets: string[];
};
export type ImportPreview = { months: EarningsMonth[]; errors: string[]; skippedTotals: number };

const normalize = (value: unknown) => String(value ?? '').trim().toLowerCase().replace(/[_\s]+/g, ' ');
const dateLabels = ['date', 'sale date', 'sales date', 'invoice date', 'payment date', 'created at', 'month', 'period', 'កាលបរិច្ឆេទ', 'ថ្ងៃខែឆ្នាំ'];
const amountLabels = ['net sales', 'net amount', 'sales revenue', 'total revenue', 'revenue', 'payment', 'paid amount', 'total amount', 'grand total', 'amount', 'total', 'sales', 'earnings', 'ចំណូល', 'ប្រាក់ចំណូល', 'សរុប', 'main outlet'];
const totalLabel = /^(grand\s*total|sub\s*total|total(?:\s+(?:sales|revenue|amount))?|សរុប(?:រួម)?)\s*:?$/i;
const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

export function monthFromText(value: unknown): string | null {
  const text = normalize(value);
  let match = text.match(/^(\d{4})[-/](\d{1,2})$/);
  if (match && Number(match[2]) >= 1 && Number(match[2]) <= 12) return `${match[1]}-${match[2].padStart(2, '0')}`;
  match = text.match(/^(\d{1,2})[-/](\d{4})$/);
  if (match && Number(match[1]) >= 1 && Number(match[1]) <= 12) return `${match[2]}-${match[1].padStart(2, '0')}`;
  match = text.match(/^([a-z]+)[\s_-]*(\d{4})$/);
  if (match) {
    const month = monthNames.findIndex((name) => name === match![1] || name.slice(0, 3) === match![1] || (name === 'september' && match![1] === 'sept')) + 1;
    if (month) return `${match[2]}-${String(month).padStart(2, '0')}`;
  }
  return null;
}

function calendarDate(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (year < 1900 || year > 2200 || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) throw new Error('invalid calendar date');
  return date.toISOString().slice(0, 10);
}

function period(value: Cell | undefined, fallback: string | null, date1904: boolean): { month: string; date: string | null } {
  if (value === undefined || value === null || String(value).trim() === '') throw new Error('missing date or month');
  const raw = String(value).trim();
  const monthly = monthFromText(raw);
  if (monthly) return { month: monthly, date: null };
  let date: string;
  if (typeof value === 'number' || /^\d+(\.\d+)?$/.test(raw)) {
    const numeric = Number(value);
    if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 31) {
      if (!fallback) throw new Error('day numbers need a report month');
      date = calendarDate(Number(fallback.slice(0, 4)), Number(fallback.slice(5)), numeric);
    } else {
      const parsed = SSF.parse_date_code(numeric, { date1904 });
      if (!parsed) throw new Error('invalid Excel date');
      date = calendarDate(parsed.y, parsed.m, parsed.d);
    }
  } else {
    const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T].*)?$/);
    const local = raw.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})(?:\s.*)?$/);
    if (iso && /[T ].*(?:Z|[+-]\d\d:\d\d)$/.test(raw)) {
      const parsed = new Date(raw);
      if (!Number.isFinite(parsed.getTime())) throw new Error('invalid date');
      date = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Phnom_Penh' }).format(parsed);
    } else if (iso) date = calendarDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));
    else if (local) date = calendarDate(Number(local[3]), Number(local[2]), Number(local[1]));
    else throw new Error('date must be DD-MM-YYYY, YYYY-MM-DD, or a month');
  }
  return { month: date.slice(0, 7), date };
}

export function moneyCents(value: Cell | undefined): number {
  if (value === undefined || value === null || typeof value === 'boolean' || String(value).trim() === '') throw new Error('missing earnings amount');
  let text = String(value).trim();
  if (/KHR|៛|€|£/i.test(text)) throw new Error('choose a USD amount column');
  const negative = /^\(.*\)$/.test(text);
  text = text.replace(/USD|US\$|\$|,|\s|[()]/gi, '');
  if (!/^-?\d+(?:\.\d+)?$/.test(text)) throw new Error('invalid earnings amount');
  const signed = text.startsWith('-');
  if (negative && signed) throw new Error('invalid earnings amount');
  const [whole, decimals = ''] = text.replace(/^-/, '').split('.');
  const magnitude = Number(whole) * 100 + Number(decimals.padEnd(2, '0').slice(0, 2)) + (Number(decimals[2] ?? '0') >= 5 ? 1 : 0);
  const cents = magnitude * (negative || signed ? -1 : 1);
  if (!Number.isSafeInteger(cents) || Math.abs(cents) > 1e12) throw new Error('earnings amount is too large');
  return cents;
}

export function readEarningsWorkbook(data: ArrayBuffer): ImportSheet[] {
  const workbook = read(data, { type: 'array', raw: true, cellDates: false, sheetRows: 50_002 });
  const result = workbook.SheetNames.map((name) => {
    const sheet = workbook.Sheets[name];
    const fullRange = sheet['!fullref'] ?? sheet['!ref'];
    if (fullRange && utils.decode_range(fullRange).e.c > 499) throw new Error('A worksheet exceeds 500 columns. Export a sales report with fewer columns.');
    if (fullRange && utils.decode_range(fullRange).e.r > 50_000) throw new Error('A worksheet exceeds 50,000 rows. Export a shorter date range.');
    const rows = utils.sheet_to_json<Cell[]>(sheet, { header: 1, defval: '', raw: true, blankrows: true, range: 0 });
    for (const reference of Object.keys(sheet)) {
      if (reference.startsWith('!') || sheet[reference]?.t !== 'e') continue;
      const cell = utils.decode_cell(reference);
      if (rows[cell.r]) rows[cell.r][cell.c] = sheet[reference].w || '#ERROR!';
    }
    return { name, rows, date1904: Boolean(workbook.Workbook?.WBProps?.date1904) };
  }).filter((sheet) => sheet.rows.some((row) => row.some((cell) => String(cell ?? '').trim())));
  if (!result.length) throw new Error('This workbook has no data.');
  return result;
}

export function suggestMapping(sheet: ImportSheet, fallbackMonth: string): SheetMapping {
  let headerRow = sheet.rows.findIndex((row) => row.some((cell) => String(cell ?? '').trim()));
  let best = 0;
  sheet.rows.slice(0, 100).forEach((row, index) => {
    const labels = row.map(normalize);
    const score = Number(labels.some((label) => dateLabels.includes(label))) * 2 + Number(labels.some((label) => amountLabels.includes(label))) * 2;
    if (score > best) { best = score; headerRow = index; }
  });
  const labels = (sheet.rows[headerRow] ?? []).map(normalize);
  const dateColumn = labels.findIndex((label) => dateLabels.includes(label));
  const amountLabel = amountLabels.find((label) => labels.includes(label));
  return { enabled: false, headerRow: Math.max(headerRow, 0), dateColumn, amountColumn: amountLabel ? labels.indexOf(amountLabel) : -1, fallbackMonth: monthFromText(sheet.name) ?? fallbackMonth };
}

export function previewImport(sheets: ImportSheet[], mappings: SheetMapping[]): ImportPreview {
  const months = new Map<string, EarningsMonth>();
  const errors: string[] = [];
  const monthSources = new Map<string, Set<string>>();
  let skippedTotals = 0;
  sheets.forEach((sheet, sheetIndex) => {
    const mapping = mappings[sheetIndex];
    if (!mapping?.enabled) return;
    if (mapping.amountColumn < 0) { errors.push(`${sheet.name}: choose the earnings amount column.`); return; }
    if (mapping.dateColumn === mapping.amountColumn) { errors.push(`${sheet.name}: date and earnings must use different columns.`); return; }
    const fallback = monthFromText(mapping.fallbackMonth);
    if (mapping.dateColumn < 0 && !fallback) { errors.push(`${sheet.name}: choose a report month or a date column.`); return; }
    let rowsImported = 0;
    sheet.rows.slice(mapping.headerRow + 1).forEach((row, offset) => {
      if (!row.some((cell) => String(cell ?? '').trim())) return;
      const labels = row.map(normalize);
      if (labels.some((label, index) => index !== mapping.amountColumn && totalLabel.test(label))) { skippedTotals++; return; }
      // Some exports repeat table headings between pages.
      if (normalize(row[mapping.amountColumn]) === normalize(sheet.rows[mapping.headerRow]?.[mapping.amountColumn])) return;
      try {
        const amountCents = moneyCents(row[mapping.amountColumn]);
        const when = mapping.dateColumn < 0 ? { month: fallback!, date: null } : period(row[mapping.dateColumn], fallback, sheet.date1904);
        const month = months.get(when.month) ?? { key: when.month, totalCents: 0, undatedCents: 0, rowCount: 0, days: [], sheets: [] };
        month.totalCents += amountCents;
        month.rowCount++;
        if (when.date) {
          const day = month.days.find((item) => item.date === when.date);
          if (day) { day.amountCents += amountCents; day.rowCount++; }
          else month.days.push({ date: when.date, amountCents, rowCount: 1 });
        } else month.undatedCents += amountCents;
        if (!month.sheets.includes(sheet.name)) month.sheets.push(sheet.name);
        months.set(when.month, month);
        const sources = monthSources.get(when.month) ?? new Set<string>();
        sources.add(sheet.name); monthSources.set(when.month, sources);
        rowsImported++;
      } catch (error) {
        if (errors.length < 30) errors.push(`${sheet.name}, row ${mapping.headerRow + offset + 2}: ${error instanceof Error ? error.message : 'cannot read this row'}.`);
      }
    });
    if (!rowsImported) errors.push(`${sheet.name}: no earnings rows were found. Check the header and column choices.`);
  });
  for (const [month, sources] of monthSources) {
    if (sources.size > 1) errors.push(`${month} appears in more than one selected worksheet. Select one worksheet for that month to avoid counting it twice.`);
  }
  for (const month of months.values()) month.days.sort((a, b) => a.date.localeCompare(b.date));
  if (months.size > 120) errors.push('Import up to 120 months at a time.');
  return { months: [...months.values()].sort((a, b) => b.key.localeCompare(a.key)), errors, skippedTotals };
}
