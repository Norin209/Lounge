'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { collection, doc, onSnapshot, serverTimestamp, writeBatch } from 'firebase/firestore';
import { auth, db } from '../../_utils/firebase';
import type { EarningsMonth, ImportSheet, SheetMapping } from './import-workbook';
import type { ExpenseData } from '../expenses/expense-source';
import ExpensePanel from '../expenses/ExpensePanel';
import { financeSummary } from './finance-summary';
import styles from './earnings.module.css';
import controls from '../expenses/select-controls.module.css';
import fields from './earnings-controls.module.css';

type SavedMonth = EarningsMonth & { sourceFile: string; savedAt?: { toDate: () => Date } };
type Importer = typeof import('./import-workbook');
const money = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
const monthLabel = (key: string) => new Date(`${key}-01T00:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const currentMonth = () => new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', timeZone: 'Asia/Phnom_Penh' }).format(new Date());

function SelectControl({ value, options, onChange, disabled = false }: {
  value: string | number;
  options: { value: string | number; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return <span className={`${controls.selectControl} ${fields.selectControl}`} data-disabled={disabled || undefined}>
    <span className={controls.selectedValue} aria-hidden="true">{options.find((option) => String(option.value) === String(value))?.label ?? 'Choose an option'}</span>
    <select className={`${controls.nativeSelect} ${fields.nativeSelect}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, WebkitAppearance: 'none', appearance: 'none', margin: 0, border: 0 }} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  </span>;
}

export default function EarningsPanel() {
  const [savedMonths, setSavedMonths] = useState<SavedMonth[]>([]);
  const [expenseData, setExpenseData] = useState<ExpenseData | null>(null);
  const [expenseLoading, setExpenseLoading] = useState(true);
  const [expenseError, setExpenseError] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [showExpenses, setShowExpenses] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [fileName, setFileName] = useState('');
  const [sheets, setSheets] = useState<ImportSheet[]>([]);
  const [mappings, setMappings] = useState<SheetMapping[]>([]);
  const [importer, setImporter] = useState<Importer | null>(null);
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const readVersion = useRef(0);

  useEffect(() => onSnapshot(collection(db, 'earningsMonths'), (snapshot) => {
    const months = snapshot.docs.map((item) => ({ ...item.data(), key: item.id } as SavedMonth)).sort((a, b) => b.key.localeCompare(a.key));
    setSavedMonths(months);
    setLoading(false); setLoadError('');
  }, () => {
    setLoading(false); setLoadError('Unable to load saved earnings. Check your connection and your admin account’s access.');
  }), []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch('/api/expenses', { cache: 'no-store' });
        const result = await response.json();
        if (!response.ok || !Array.isArray(result.months) || !Array.isArray(result.salaryMonths)) throw new Error(result.error || 'Unable to load expenses.');
        if (active) { setExpenseData(result as ExpenseData); setExpenseError(''); }
      } catch (cause) {
        if (active) setExpenseError(cause instanceof Error ? cause.message : 'Unable to load expenses.');
      } finally { if (active) setExpenseLoading(false); }
    };
    void load();
    const timer = window.setInterval(load, 60_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  const monthKeys = [...new Set([...savedMonths.map((month) => month.key), ...(expenseData?.months ?? []).map((month) => month.key)])].sort((a, b) => b.localeCompare(a));
  const activeMonth = monthKeys.includes(selectedMonth) ? selectedMonth : monthKeys[0] ?? '';
  const monthOptions = monthKeys.map((key) => ({ value: key, label: monthLabel(key) }));
  const preview = useMemo(() => importer ? importer.previewImport(sheets, mappings) : { months: [], errors: [], skippedTotals: 0 }, [importer, sheets, mappings]);
  const selected = savedMonths.find((month) => month.key === activeMonth);
  const expenseMonth = expenseData?.months.find((month) => month.key === activeMonth);
  const payrollMonth = expenseData?.salaryMonths.find((month) => month.key === activeMonth);
  const summary = financeSummary(loadError ? undefined : selected, expenseError ? undefined : expenseMonth, expenseError ? undefined : payrollMonth, !loading && !loadError && !expenseLoading && !expenseError);
  const replacing = preview.months.filter((month) => savedMonths.some((saved) => saved.key === month.key));
  const previewTotal = preview.months.reduce((sum, month) => sum + month.totalCents, 0);

  const updateMapping = (index: number, patch: Partial<SheetMapping>) => {
    setMappings((current) => current.map((mapping, i) => i === index ? { ...mapping, ...patch } : mapping));
    setConfirmReplace(false); setError('');
  };

  async function openFile(file: File) {
    const version = ++readVersion.current;
    setError(''); setMessage(''); setSheets([]); setMappings([]); setConfirmReplace(false); setFileName('');
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) { setError('Choose an Excel workbook (.xlsx or .xls) or a CSV report.'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('Choose a file smaller than 10 MB. Export a shorter date range if needed.'); return; }
    setReading(true); setShowImport(true);
    try {
      const reader = await import('./import-workbook');
      const content = reader.readEarningsWorkbook(await file.arrayBuffer());
      if (version !== readVersion.current) return;
      const suggested = content.map((sheet) => reader.suggestMapping(sheet, currentMonth()));
      // Start with one sheet so an overview and its detail cannot be counted together.
      const first = suggested.findIndex((mapping) => mapping.amountColumn >= 0);
      suggested[Math.max(first, 0)].enabled = true;
      setImporter(reader); setSheets(content); setMappings(suggested); setFileName(file.name);
    } catch (cause) {
      if (version === readVersion.current) setError(cause instanceof Error ? cause.message : 'Unable to read this file. Try exporting it as .xlsx.');
    } finally { if (version === readVersion.current) setReading(false); }
  }

  async function saveImport() {
    if (!preview.months.length || preview.errors.length || (replacing.length && !confirmReplace)) return;
    if (!auth.currentUser) { setError('Please sign in again before saving earnings.'); return; }
    setSaving(true); setError('');
    try {
      const batch = writeBatch(db);
      for (const month of preview.months) batch.set(doc(db, 'earningsMonths', month.key), {
        ...month, sourceFile: fileName, currency: 'USD', timeZone: 'Asia/Phnom_Penh',
        savedAt: serverTimestamp(), importedBy: auth.currentUser.uid,
      });
      await batch.commit();
      setSelectedMonth(preview.months[0].key);
      setMessage(`Saved ${preview.months.length} ${preview.months.length === 1 ? 'month' : 'months'} of earnings (${money(previewTotal)}).`);
      setSheets([]); setMappings([]); setFileName(''); setConfirmReplace(false);
      if (fileInput.current) fileInput.current.value = '';
    } catch {
      setError('The import was not saved. Check your connection and whether your admin account has permission to save earnings.');
    } finally { setSaving(false); }
  }

  return (
    <div className={`${styles.page} ${fields.surface}`}>
      <header className={styles.header}>
        <div><p className={styles.eyebrow}>FINANCE</p><h1>Finance</h1><p className={styles.subtitle}>Sales, expenses and salary payments in one place. All amounts are in USD.</p></div>
        <label className={styles.monthPicker}>View month
          <SelectControl value={activeMonth} onChange={setSelectedMonth} disabled={!monthOptions.length} options={monthOptions.length ? monthOptions : [{ value: '', label: 'Loading months…' }]} />
        </label>
      </header>

      {loadError && <p className={styles.error} role="alert">{loadError}</p>}
      {message && <p className={styles.success} role="status">{message}</p>}

      {expenseError && <p className={styles.error} role="alert">Expense data unavailable: {expenseError}</p>}
      <div className={styles.metrics}>
        <div className={styles.card}><span>Sales revenue</span><strong>{summary.revenueCents !== null ? money(summary.revenueCents) : '—'}</strong><small>{summary.revenueCents !== null ? 'Reported sales before recorded expenses' : loading ? 'Loading sales…' : 'Upload a sales report for this month'}</small></div>
        <div className={styles.card}><span>Recorded expenses</span><strong>{summary.expenseCents !== null ? money(summary.expenseCents) : '—'}</strong><small>{expenseLoading ? 'Loading expenses…' : expenseMonth?.hasExpenseSheet ? 'Includes salary payments' : expenseMonth ? 'Salary payments only; daily expenses missing' : 'No expenses recorded for this month'}</small></div>
        <div className={`${styles.card} ${summary.afterExpenseCents !== null && summary.afterExpenseCents < 0 ? styles.negativeCard : styles.balanceCard}`}><span>After recorded expenses</span><strong>{summary.afterExpenseCents !== null ? money(summary.afterExpenseCents) : '—'}</strong><small>{summary.afterExpenseCents !== null ? summary.missing.length ? 'Provisional: subtracts recorded expenses only' : 'Sales revenue minus recorded expenses' : loading || expenseLoading ? 'Loading finance data…' : loadError || expenseError ? 'Unavailable until finance data can be loaded' : 'Upload a sales report to calculate'}</small></div>
        <div className={styles.card}><span>Salary payments</span><strong>{summary.payrollCents !== null ? money(summary.payrollCents) : '—'}</strong><small>Included in expenses; not deducted again</small></div>
      </div>
      {activeMonth && !expenseLoading && !loading && !!summary.missing.length && <p className={styles.notice}><strong>{monthLabel(activeMonth)} has incomplete data.</strong> {summary.missing.join(' · ')}. {summary.revenueCents !== null ? 'The after-expense amount is provisional and subtracts recorded expenses only.' : 'Upload a sales report to calculate the after-expense amount.'}</p>}

      <section className={styles.panel} aria-labelledby="overview-title">
        <div className={styles.sectionHeading}><div><h2 id="overview-title">Monthly overview</h2><p>Compare the same month across sales and expenses. Select a month to see its details below.</p></div></div>
        <div className={`${styles.tableScroll} ${styles.overviewTable}`}><table><thead><tr><th>Month</th><th>Sales revenue</th><th>Expenses</th><th>After expenses</th><th>Data coverage</th></tr></thead><tbody>{monthKeys.length ? monthKeys.map((key) => {
          const value = financeSummary(loadError ? undefined : savedMonths.find((month) => month.key === key), expenseError ? undefined : expenseData?.months.find((month) => month.key === key), expenseError ? undefined : expenseData?.salaryMonths.find((month) => month.key === key), !loading && !loadError && !expenseLoading && !expenseError);
          return <tr key={key} className={key === activeMonth ? styles.selectedRow : undefined}><td data-label="Month"><button type="button" className={styles.monthLink} aria-pressed={key === activeMonth} onClick={() => setSelectedMonth(key)}>{monthLabel(key)}</button></td><td data-label="Sales revenue">{value.revenueCents !== null ? money(value.revenueCents) : '—'}</td><td data-label="Expenses">{value.expenseCents !== null ? money(value.expenseCents) : '—'}</td><td data-label="After expenses" className={styles.amount}>{value.afterExpenseCents !== null ? money(value.afterExpenseCents) : '—'}</td><td data-label="Data coverage"><span className={value.missing.length ? styles.partialBadge : styles.readyBadge}>{loading || expenseLoading ? 'Loading…' : value.missing.length ? value.missing.join(' · ') : 'Sales + expenses + payroll'}</span></td></tr>;
        }) : <tr><td colSpan={5} className={styles.empty}>{loading || expenseLoading ? 'Loading finance data…' : 'Import a sales report to begin.'}</td></tr>}</tbody></table></div>
      </section>

      <details className={styles.details} open={showExpenses} onToggle={(event) => setShowExpenses(event.currentTarget.open)}>
        <summary><span>Expenses &amp; payroll</span><small>{summary.expenseCents !== null ? money(summary.expenseCents) : activeMonth ? monthLabel(activeMonth) : 'Loading…'}</small></summary>
        {showExpenses && expenseData && !expenseError ? <ExpensePanel key={activeMonth} data={expenseData} monthKey={activeMonth} /> : <p className={styles.help}>{expenseLoading ? 'Loading expenses…' : expenseError || 'No expense data is available.'}</p>}
      </details>

      <details className={styles.details} open={showImport} onToggle={(event) => setShowImport(event.currentTarget.open)}>
        <summary><span>Import sales report</span><small>Excel or CSV · one or several months</small></summary>
      <section className={styles.panel} aria-labelledby="upload-title">
        <div className={styles.sectionHeading}><div><h2 id="upload-title">Upload an earnings report</h2><p>Use the full report for each month. Each import replaces saved earnings for the months it contains.</p></div></div>
        <div className={`${styles.dropZone} ${dragging ? styles.dragging : ''}`} onDragOver={(event) => { event.preventDefault(); if (!saving && !reading) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); if (!saving && !reading && event.dataTransfer.files[0]) void openFile(event.dataTransfer.files[0]); }}>
          <div className={styles.fileIcon} aria-hidden="true">XLS</div>
          <h3>{reading ? 'Reading your workbook…' : fileName || 'Drop your Excel file here'}</h3>
          <p>.xlsx, .xls or .csv · up to 10 MB · one or multiple months</p>
          <button type="button" className={styles.button} disabled={reading || saving} onClick={() => fileInput.current?.click()}>{fileName ? 'Choose another file' : 'Choose file'}</button>
          <input ref={fileInput} type="file" accept=".xlsx,.xls,.csv" className={styles.hiddenInput} aria-label="Choose an earnings report" disabled={reading || saving} onChange={(event) => { const file = event.target.files?.[0]; if (file) void openFile(file); event.target.value = ''; }} />
        </div>
        {error && <p className={styles.error} role="alert">{error}</p>}

        {!!sheets.length && <div className={styles.mappingArea}>
          <h3>Check the worksheets and columns</h3><p className={styles.help}>Choose the sales amount you want to track, such as Net Sales or Paid Amount. Dates use day–month–year. Select additional worksheets for other months.</p>
          {sheets.map((sheet, index) => {
            const mapping = mappings[index];
            const headers = sheet.rows[mapping.headerRow] ?? [];
            const width = Math.max(headers.length, ...sheet.rows.slice(mapping.headerRow + 1, mapping.headerRow + 5).map((row) => row.length));
            const columns = Array.from({ length: width }, (_, column) => ({ value: column, label: `${column + 1}. ${String(headers[column] ?? '').trim() || 'Unnamed column'}` }));
            return <fieldset className={styles.sheet} key={sheet.name} disabled={saving}>
              <label className={styles.sheetCheck}><input type="checkbox" checked={mapping.enabled} onChange={(event) => updateMapping(index, { enabled: event.target.checked })} /><strong>{sheet.name}</strong><span>{Math.max(0, sheet.rows.length - mapping.headerRow - 1).toLocaleString()} rows below header</span></label>
              {mapping.enabled && <>
                <div className={styles.mappingGrid}>
                  <label>Header row<input type="number" min={1} max={sheet.rows.length} value={mapping.headerRow + 1} onChange={(event) => { const row = Math.min(sheet.rows.length - 1, Math.max(0, Number(event.target.value) - 1)); const suggestion = importer!.suggestMapping({ ...sheet, rows: [sheet.rows[row]] }, mapping.fallbackMonth); updateMapping(index, { headerRow: row, dateColumn: suggestion.dateColumn, amountColumn: suggestion.amountColumn }); }} /></label>
                  <label>Date or month column<SelectControl value={mapping.dateColumn} onChange={(value) => updateMapping(index, { dateColumn: Number(value) })} options={[{ value: -1, label: 'No date column: use report month' }, ...columns]} /></label>
                  <label>Earnings amount (USD)<SelectControl value={mapping.amountColumn} onChange={(value) => updateMapping(index, { amountColumn: Number(value) })} options={[{ value: -1, label: 'Choose the earnings column' }, ...columns]} /></label>
                  <label>Report month<input type="month" value={mapping.fallbackMonth} disabled={mapping.dateColumn >= 0 && sheet.rows.slice(mapping.headerRow + 1).every((row) => !row[mapping.dateColumn] || !/^\d{1,2}$/.test(String(row[mapping.dateColumn]).trim()))} onChange={(event) => updateMapping(index, { fallbackMonth: event.target.value })} /><small>Only needed without full dates or months in the report.</small></label>
                </div>
                <div className={styles.tableScroll}><table><caption>First five rows from {sheet.name}</caption><thead><tr>{columns.map((column) => <th key={column.value}>{column.label}</th>)}</tr></thead><tbody>{sheet.rows.slice(mapping.headerRow + 1, mapping.headerRow + 6).map((row, r) => <tr key={r}>{columns.map((column) => <td key={column.value}>{String(row[column.value] ?? '')}</td>)}</tr>)}</tbody></table></div>
              </>}
            </fieldset>;
          })}

          {!!preview.errors.length && <div className={styles.error} role="alert"><strong>Check these rows before saving</strong><ul>{preview.errors.map((issue, index) => <li key={index}>{issue}</li>)}</ul></div>}
          {!!preview.months.length && <>
            <h3 className={styles.previewTitle}>Import preview</h3>
            <div className={styles.tableScroll}><table><thead><tr><th>Month</th><th>Rows</th><th>Recorded days</th><th>New earnings</th><th>Currently saved</th></tr></thead><tbody>{preview.months.map((month) => <tr key={month.key}><td>{monthLabel(month.key)}</td><td>{month.rowCount}</td><td>{month.days.length || 'Month total only'}</td><td className={styles.amount}>{money(month.totalCents)}</td><td>{savedMonths.some((saved) => saved.key === month.key) ? money(savedMonths.find((saved) => saved.key === month.key)!.totalCents) : 'New month'}</td></tr>)}</tbody></table></div>
            <p className={styles.help}>{preview.skippedTotals} summary rows excluded. Month-only amounts appear in monthly totals, without an invented daily breakdown.</p>
            {!!replacing.length && <label className={styles.replaceCheck}><input type="checkbox" checked={confirmReplace} onChange={(event) => setConfirmReplace(event.target.checked)} disabled={saving} />Replace saved earnings for {replacing.map((month) => monthLabel(month.key)).join(', ')} with this report.</label>}
          </>}
          <div className={styles.saveBar}><span>{preview.months.length} months · {money(previewTotal)}</span><button type="button" className={styles.button} onClick={() => void saveImport()} disabled={saving || loading || !!loadError || !preview.months.length || !!preview.errors.length || (!!replacing.length && !confirmReplace)}>{saving ? 'Saving…' : 'Save earnings'}</button></div>
        </div>}
      </section>

      </details>

      <section className={styles.panel} aria-labelledby="daily-title"><div className={styles.sectionHeading}><div><h2 id="daily-title">Sales detail</h2><p>{selected ? `${monthLabel(selected.key)} · ${selected.sourceFile}` : 'Your imported daily sales will appear here.'}</p></div></div>
        {!!selected?.undatedCents && <p className={styles.notice}>{money(selected.undatedCents)} is recorded at month level. Upload dated rows to see a daily breakdown for that amount.</p>}
        <div className={styles.tableScroll}><table><thead><tr><th>Date</th><th>Imported rows</th><th>Earnings (USD)</th></tr></thead><tbody>{selected?.days.length ? [...selected.days].reverse().map((day) => <tr key={day.date}><td>{new Date(`${day.date}T00:00:00Z`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })}</td><td>{day.rowCount}</td><td className={styles.amount}>{money(day.amountCents)}</td></tr>) : <tr><td colSpan={3} className={styles.empty}>{loading ? 'Loading saved earnings…' : selected ? 'This report contains month totals only.' : 'No sales report for this month. Open Import sales report to upload one.'}</td></tr>}</tbody>{selected && <tfoot><tr><th colSpan={2}>Month total{selected.undatedCents !== 0 ? ' (including month-only amounts)' : ''}</th><th className={styles.amount}>{money(selected.totalCents)}</th></tr></tfoot>}</table></div>
      </section>
    </div>
  );
}
