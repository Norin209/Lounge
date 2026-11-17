import type { EarningsMonth } from './import-workbook';
import type { ExpenseMonth, SalaryMonthDetail } from '../expenses/expense-source';

export function financeSummary(revenue?: EarningsMonth, expenses?: ExpenseMonth, payroll?: SalaryMonthDetail, sourcesReady = true) {
  const key = revenue?.key ?? expenses?.key ?? payroll?.key;
  if (expenses?.key !== key) expenses = undefined;
  if (payroll?.key !== key) payroll = undefined;
  const revenueCents = revenue?.totalCents ?? null;
  const expenseCents = expenses ? Math.round(expenses.expenses.reduce((sum, row) => sum + row.total, 0) * 100) : null;
  const payrollCents = payroll ? Math.round(payroll.finalTotal * 100) : null;
  const hasDailyExpenses = expenses?.hasExpenseSheet === true;
  const missing: string[] = [];
  if (!revenue) missing.push('Sales report missing');
  if (!hasDailyExpenses) missing.push('Daily expenses missing');
  if (!payroll) missing.push('Payroll missing');
  // Use recorded costs for provisional balances, while retaining missing-source notes.
  // A failed or pending source request must not look like an empty expense month.
  const afterExpenseCents = revenueCents !== null && sourcesReady
    ? revenueCents - (expenseCents ?? 0)
    : null;
  return { revenueCents, expenseCents, payrollCents, afterExpenseCents, missing };
}
