export const expenseCategories = [
  'Salon',
  'Coffee',
  'Car Wash',
  'Utilities',
  'Advertisement',
  'Salaries',
  'Other',
] as const;

export type ExpenseCategory =
  (typeof expenseCategories)[number];

export type ExpenseRecord = {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type ExpenseMonth = {
  key: string;
  label: string;
  expenses: ExpenseRecord[];
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

export type SalaryMonthDetail = {
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

export type ExpenseData = {
  source: string;
  months: ExpenseMonth[];
  salaryMonths: SalaryMonthDetail[];
};
