import type {
  ExpenseCategory,
  ExpenseMonth,
  ExpenseRecord,
} from '@/app/admin/expenses/expense-source';

const categories = ['Salon', 'Coffee', 'Car Wash', 'Utilities', 'Advertisement', 'Other'] as const;
const normalize = (value: unknown) => String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

function categoryOf(value: unknown): ExpenseCategory | undefined {
  const label = normalize(value);
  if (label === 'advertisment' || label === 'advertisements') return 'Advertisement';
  return categories.find((category) => normalize(category) === label);
}

export function sheetMonth(title: string) {
  const match = title.trim().match(/^([A-Za-z]+)[\s_-]+(\d{4})$/);
  if (!match) return null;
  const month = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
    .findIndex((name) => name === match[1].toLowerCase() || name.slice(0, 3) === match[1].toLowerCase() || (name === 'september' && match[1].toLowerCase() === 'sept')) + 1;
  return month ? { year: Number(match[2]), month } : null;
}

function expenseDate(value: unknown, year: number, month: number): string | null {
  if (value === '' || value === undefined || value === null) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  let date: Date;
  if (typeof value === 'number' || /^\d+(\.\d+)?$/.test(raw)) {
    const number = Number(value);
    date = number >= 1 && number <= 31
      ? new Date(Date.UTC(year, month - 1, number))
      : new Date(Date.UTC(1899, 11, 30) + number * 86_400_000);
  } else {
    const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    const local = raw.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/);
    if (iso) date = new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])));
    else if (local) date = new Date(Date.UTC(Number(local[3]), Number(local[2]) - 1, Number(local[1])));
    else throw new Error(`Unrecognized expense date: ${raw}`);
  }
  if (!Number.isFinite(date.getTime())) throw new Error(`Invalid expense date: ${raw}`);
  return date.toISOString().slice(0, 10);
}

function amount(value: unknown, location: string, optional = false) {
  if (value === '' || value === undefined || value === null) {
    if (optional) return 0;
    throw new Error(`Missing expense amount at ${location}.`);
  }
  const result = typeof value === 'number' ? value : Number(String(value).replace(/[$,\s]/g, ''));
  if (!Number.isFinite(result)) throw new Error(`Invalid expense amount at ${location}.`);
  return result;
}

export function parseMonth(title: string, rows: unknown[][]): ExpenseMonth {
  const month = sheetMonth(title);
  if (!month) throw new Error(`Unsupported expense tab name: ${title}`);
  const key = `${month.year}-${String(month.month).padStart(2, '0')}`;
  const expenses: ExpenseRecord[] = [];
  const warnings: string[] = [];
  const controls = new Map<ExpenseCategory, number>();
  const tableHeader = rows.findIndex((row) => {
    const labels = row.map(normalize);
    return ['date', 'category', 'item name', 'total amount'].every((label) => labels.includes(label));
  });

  function add(row: unknown[], rowIndex: number, category: ExpenseCategory, columns: { description: number; quantity: number; unitPrice: number; total: number }, date: string | null) {
    const description = String(row[columns.description] ?? '').trim();
    if (!description && (row[columns.total] === '' || row[columns.total] === undefined)) return;
    if (row[columns.total] === '' || row[columns.total] === undefined || row[columns.total] === null) {
      warnings.push(`${title}, row ${rowIndex + 1}: an item has no total amount and has been excluded until the source is completed.`);
      return;
    }
    if (!date) throw new Error(`${title}, row ${rowIndex + 1}: expense has no date.`);
    expenses.push({
      id: `${key}-${category.toLowerCase().replaceAll(' ', '-')}-${rowIndex + 1}`,
      date,
      category,
      description: description || 'Expense without item name',
      quantity: amount(row[columns.quantity], `${title}, row ${rowIndex + 1}`, true),
      unitPrice: amount(row[columns.unitPrice], `${title}, row ${rowIndex + 1}`, true),
      total: amount(row[columns.total], `${title}, row ${rowIndex + 1}`),
    });
  }

  if (tableHeader >= 0) {
    const labels = rows[tableHeader].map(normalize);
    // Use the first Category header; later columns contain a separate summary.
    const dateColumn = labels.indexOf('date');
    const categoryColumn = labels.indexOf('category');
    const columns = {
      description: labels.indexOf('item name'),
      quantity: labels.indexOf('qty'),
      unitPrice: labels.indexOf('unit price'),
      total: labels.indexOf('total amount'),
    };
    let currentDate: string | null = null;
    for (let i = tableHeader + 1; i < rows.length; i++) {
      const row = rows[i];
      const categoryText = String(row[categoryColumn] ?? '').trim();
      if (!categoryText && !String(row[columns.description] ?? '').trim()) continue;
      const category = categoryOf(categoryText);
      if (!category) throw new Error(`${title}, row ${i + 1}: unknown expense category "${categoryText}".`);
      currentDate = expenseDate(row[dateColumn], month.year, month.month) ?? currentDate;
      add(row, i, category, columns, currentDate);
    }
    for (const row of rows.slice(0, tableHeader)) {
      row.forEach((value, i) => {
        const category = categoryOf(value);
        if (category && typeof row[i + 1] === 'number') controls.set(category, row[i + 1] as number);
      });
    }
  } else {
    const headerRow = rows.findIndex((row) => row.some((value) => normalize(value) === 'line total') && row.some((value) => normalize(value) === 'item name'));
    if (headerRow < 0) throw new Error(`Expense columns were not found in ${title}.`);
    const labels = rows[headerRow].map(normalize);
    const categoryRow = rows[headerRow - 1] ?? [];
    const found = new Set<ExpenseCategory>();
    for (let i = 0; i < labels.length; i++) {
      if (labels[i] !== 'item name') continue;
      const category = categoryOf(categoryRow[i - 1]);
      if (!category) throw new Error(`Unknown expense block in ${title}, column ${i + 1}.`);
      found.add(category);
      const columns = { description: i, quantity: i + 1, unitPrice: i + 2, total: i + 3 };
      if (labels[columns.total] !== 'line total') throw new Error(`Expense columns changed in ${title} (${category}).`);
      let currentDate: string | null = null;
      for (let r = headerRow + 1; r < rows.length; r++) {
        currentDate = expenseDate(rows[r][i - 2], month.year, month.month) ?? currentDate;
        // Old sheets pre-fill blank lines with zero formulas.
        if (!String(rows[r][i] ?? '').trim()) {
          if (amount(rows[r][columns.total], `${title}, row ${r + 1}`, true) !== 0) {
            add(rows[r], r, category, columns, currentDate);
          }
          continue;
        }
        add(rows[r], r, category, columns, currentDate);
      }
      const control = rows.slice(0, headerRow - 1).map((row) => row[columns.total]).find((value) => typeof value === 'number');
      if (typeof control === 'number') controls.set(category, control);
    }
    if (found.size !== categories.length) throw new Error(`Some expense category blocks are missing in ${title}.`);
  }

  for (const [category, expected] of controls) {
    const actual = expenses.filter((expense) => expense.category === category).reduce((sum, expense) => sum + expense.total, 0);
    if (Math.abs(actual - expected) > 0.01) warnings.push(`${title}: ${category} rows total ${actual.toFixed(2)}, but the sheet summary shows ${expected.toFixed(2)}.`);
  }
  const outsideMonth = expenses.filter((expense) => !expense.date.startsWith(key)).length;
  if (outsideMonth) warnings.push(`${title}: ${outsideMonth} expense dates are outside this month in the source sheet. Original dates have been preserved.`);
  expenses.sort((a, b) => b.date.localeCompare(a.date));
  return {
    key,
    label: new Date(Date.UTC(month.year, month.month - 1, 1)).toLocaleDateString('en-AU', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
    expenses,
    warnings,
  };
}
