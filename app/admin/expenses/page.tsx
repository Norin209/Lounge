'use client';

import { useEffect, useState } from 'react';
import styles from './expenses.module.css';
import controls from './select-controls.module.css';
import {
  expenseCategories,
  type ExpenseData,
  type ExpenseMonth,
  type SalaryMonthDetail,
} from './expense-source';

const categoryOptions = [
  'All Categories',
  ...expenseCategories,
];

const money = (amount: number) =>
  new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount);

const dateFormatter = new Intl.DateTimeFormat(
  'en-AU',
  {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }
);

const formatExpenseDate = (date: string) =>
  dateFormatter.format(
    new Date(`${date}T00:00:00Z`)
  );

export default function ExpensesPage() {
  const [expenseMonths, setExpenseMonths] =
    useState<ExpenseMonth[]>([]);

  const [salaryMonths, setSalaryMonths] =
    useState<SalaryMonthDetail[]>([]);

  const [sourceName, setSourceName] =
    useState('Google Sheets');

  const [loadError, setLoadError] =
    useState('');

  const [isLoading, setIsLoading] =
    useState(true);

  const [selectedMonth, setSelectedMonth] =
    useState('');

  const [selectedCategory, setSelectedCategory] =
    useState('All Categories');

  const [search, setSearch] =
    useState('');

  const [salarySearch, setSalarySearch] =
    useState('');

  const [showAllExpenses, setShowAllExpenses] =
    useState(false);

  const monthOptions = expenseMonths.map(
    (month) => month.label
  );

  useEffect(() => {
    let active = true;

    const loadExpenses = async () => {
      try {
        const response = await fetch('/api/expenses', {
          cache: 'no-store',
        });
        const result = (await response.json()) as
          | ExpenseData
          | { error?: string };

        if (!response.ok || !('months' in result)) {
          throw new Error(
            'error' in result && result.error
              ? result.error
              : 'Unable to load live expenses.'
          );
        }

        if (!active) return;
        setExpenseMonths(result.months);
        setSalaryMonths(result.salaryMonths ?? []);
        setSourceName(result.source);
        setSelectedMonth((current) =>
          result.months.some((month) => month.label === current)
            ? current
            : result.months[0]?.label ?? ''
        );
        setLoadError('');
      } catch (error) {
        if (!active) return;
        setLoadError(
          error instanceof Error
            ? error.message
            : 'Unable to load live expenses.'
        );
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void loadExpenses();
    const refreshTimer = window.setInterval(
      loadExpenses,
      60_000
    );

    return () => {
      active = false;
      window.clearInterval(refreshTimer);
    };
  }, []);

  const selectedMonthData =
    expenseMonths.find(
      (month) => month.label === selectedMonth
    ) ?? expenseMonths[0];

  const monthExpenses =
    selectedMonthData?.expenses ?? [];

  const totalExpense = monthExpenses.reduce(
    (total, expense) => total + expense.total,
    0
  );

  const categories = expenseCategories
    .map((name) => {
      const amount = monthExpenses.reduce(
        (total, expense) =>
          expense.category === name
            ? total + expense.total
            : total,
        0
      );

      return {
        name,
        amount,
        percentage:
          totalExpense === 0
            ? 0
            : Math.round(
                (amount / totalExpense) * 1000
              ) / 10,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  const weeks = Array.from(
    { length: 5 },
    (_, index) => {
      const weekNumber = index + 1;
      const amount = monthExpenses.reduce(
        (total, expense) => {
          const day = Number(
            expense.date.slice(-2)
          );
          const expenseWeek = Math.min(
            Math.floor((day - 1) / 7) + 1,
            5
          );

          return expenseWeek === weekNumber
            ? total + expense.total
            : total;
        },
        0
      );

      return {
        name: `Week ${weekNumber}`,
        amount,
      };
    }
  );

  const biggestCategory = categories[0];

  const advertisement = categories.find(
    (category) =>
      category.name === 'Advertisement'
  );

  const maxWeek = Math.max(
    1,
    ...weeks.map((week) => week.amount)
  );

  const monthName =
    selectedMonthData?.label.split(' ')[0] ?? '';

  const selectedSalaryIndex = salaryMonths.findIndex(
    (month) => month.key === selectedMonthData?.key
  );
  const selectedSalaryMonth =
    selectedSalaryIndex >= 0
      ? salaryMonths[selectedSalaryIndex]
      : undefined;
  const previousSalaryMonth =
    selectedSalaryIndex >= 0
      ? salaryMonths[selectedSalaryIndex + 1]
      : undefined;
  const previousEmployees = new Map(
    (previousSalaryMonth?.employees ?? []).map((employee) => [
      employee.name.trim().toLowerCase(),
      employee,
    ])
  );
  const salarySearchValue = salarySearch.trim().toLowerCase();
  const salaryEmployees = (selectedSalaryMonth?.employees ?? []).filter(
    (employee) =>
      salarySearchValue === '' ||
      employee.name.toLowerCase().includes(salarySearchValue) ||
      employee.role.toLowerCase().includes(salarySearchValue)
  );
  const additionalEarnings = selectedSalaryMonth
    ? selectedSalaryMonth.commissionTotal +
      selectedSalaryMonth.overtimeTotal +
      selectedSalaryMonth.paybackTotal +
      selectedSalaryMonth.extraRewardTotal
    : 0;
  const payrollDeductions = selectedSalaryMonth
    ? selectedSalaryMonth.borrowTotal +
      selectedSalaryMonth.deductionTotal
    : 0;
  const payrollChange = previousSalaryMonth
    ? (selectedSalaryMonth?.total ?? 0) - previousSalaryMonth.total
    : null;
  const payrollChangePercentage =
    payrollChange !== null && previousSalaryMonth?.total
      ? (payrollChange / previousSalaryMonth.total) * 100
      : null;

  /*
   * Search + category filter
   */
  const filteredExpenses = monthExpenses.filter(
    (expense) => {
      const matchesCategory =
        selectedCategory === 'All Categories' ||
        expense.category === selectedCategory;

      const searchValue =
        search.toLowerCase().trim();

      const matchesSearch =
        searchValue === '' ||
        expense.description
          .toLowerCase()
          .includes(searchValue) ||
        expense.category
          .toLowerCase()
          .includes(searchValue) ||
        expense.date
          .toLowerCase()
          .includes(searchValue) ||
        formatExpenseDate(expense.date)
          .toLowerCase()
          .includes(searchValue);

      return (
        matchesCategory &&
        matchesSearch
      );
    }
  );

  const visibleExpenses = showAllExpenses
    ? filteredExpenses
    : filteredExpenses.slice(0, 10);

  return (
    <div className={styles.page}>
      {/* =============================
          HEADER
      ============================== */}

      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            FINANCE
          </p>

          <h1>Expenses</h1>

          <p className={styles.subtitle}>
            {isLoading
              ? 'Loading live expenses…'
              : loadError
                ? loadError
                : `Live data from ${sourceName} · refreshes every minute`}
          </p>
        </div>

        <div className={styles.headerActions}>
          {/* MONTH DROPDOWN */}

          <div
            className={`${controls.selectControl} ${controls.monthControl}`}
          >
            <span
              className={controls.selectedValue}
              aria-hidden="true"
            >
              {selectedMonth}
            </span>

            <select
              className={controls.nativeSelect}
              value={selectedMonth}
              aria-label="Select month"
              onChange={(event) => {
                setSelectedMonth(event.target.value);
                setShowAllExpenses(false);
              }}
            >
              {monthOptions.map((month) => (
                <option
                  key={month}
                  value={month}
                >
                  {month}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className={styles.addButton}
          >
            <span>+</span>
            Add Expense
          </button>
        </div>
      </div>

      {/* =============================
          SUMMARY CARDS
      ============================== */}

      <div className={styles.summaryGrid}>
        <div className={styles.card}>
          <div className={styles.cardTop}>
            <span>
              Total Expense
            </span>

            <span
              className={
                styles.iconBox
              }
            >
              $
            </span>
          </div>

          <h2>
            {money(totalExpense)}
          </h2>

          <p>
            Total spending for {monthName}
          </p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTop}>
            <span>
              Biggest Category
            </span>

            <span
              className={
                styles.iconBox
              }
            >
              ↗
            </span>
          </div>

          <h2>
            {biggestCategory?.name ?? '—'}
          </h2>

          <p>
            {money(
              biggestCategory?.amount ?? 0
            )}
            {' · '}
            {
              biggestCategory?.percentage ?? 0
            }
            %
          </p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTop}>
            <span>
              Advertisement
            </span>

            <span
              className={
                styles.iconBox
              }
            >
              AD
            </span>
          </div>

          <h2>
            {money(
              advertisement?.amount ??
                0
            )}
          </h2>

          <p>
            {advertisement?.percentage ??
              0}
            % of total expense
          </p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTop}>
            <span>
              Categories
            </span>

            <span
              className={
                styles.iconBox
              }
            >
              #
            </span>
          </div>

          <h2>
            {categories.length}
          </h2>

          <p>
            Expense categories
          </p>
        </div>
      </div>

      {/* =============================
          CHARTS
      ============================== */}

      <div className={styles.chartGrid}>
        {/* WEEKLY EXPENSES */}

        <div className={`${styles.panel} ${styles.chartPanel}`}>
          <div
            className={
              styles.panelHeader
            }
          >
            <div>
              <h3>
                Weekly Expenses
              </h3>

              <p>
                {selectedMonthData?.label} spending
                overview
              </p>
            </div>
          </div>

          <div
            className={
              styles.barChart
            }
          >
            {weeks.map((week) => {
              const height =
                (week.amount /
                  maxWeek) *
                100;

              return (
                <div
                  key={week.name}
                  className={
                    styles.barItem
                  }
                >
                  <span
                    className={
                      styles.barValue
                    }
                  >
                    {money(
                      week.amount
                    )}
                  </span>

                  <div
                    className={
                      styles.barTrack
                    }
                  >
                    <div
                      className={
                        styles.bar
                      }
                      style={{
                        height: `${height}%`,
                      }}
                    />
                  </div>

                  <span
                    className={
                      styles.barLabel
                    }
                  >
                    {week.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CATEGORY BREAKDOWN */}

        <div className={`${styles.panel} ${styles.categoryPanel}`}>
          <div
            className={
              styles.panelHeader
            }
          >
            <div>
              <h3>
                Expense Categories
              </h3>

              <p>
                Breakdown by category
              </p>
            </div>
          </div>

          <div
            className={
              styles.categoryList
            }
          >
            {categories.map(
              (category) => (
                <div
                  key={
                    category.name
                  }
                  className={
                    styles.category
                  }
                >
                  <div
                    className={
                      styles.categoryHeading
                    }
                  >
                    <div
                      className={
                        styles.categoryName
                      }
                    >
                      <strong>
                        {
                          category.name
                        }
                      </strong>

                      <span>
                        {
                          category.percentage
                        }
                        %
                      </span>
                    </div>

                    <strong>
                      {money(
                        category.amount
                      )}
                    </strong>
                  </div>

                  <div
                    className={
                      styles.progress
                    }
                  >
                    <div
                      className={
                        styles.progressValue
                      }
                      style={{
                        width: `${category.percentage}%`,
                      }}
                    />
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* =============================
          SALARY COMPARISON
      ============================== */}

      {selectedSalaryMonth && (
        <div
          className={`${styles.panel} ${styles.salaryPanel}`}
        >
          <div className={styles.tableHeader}>
            <div>
              <h3>Payroll Comparison</h3>

              <p>
                {selectedSalaryMonth.label}
                {previousSalaryMonth
                  ? ` compared with ${previousSalaryMonth.label}`
                  : ' employee salary breakdown'}
              </p>
            </div>

            <input
              type="text"
              value={salarySearch}
              placeholder="Search employee or role..."
              aria-label="Search payroll employees"
              className={`${styles.searchInput} ${styles.salarySearch}`}
              onChange={(event) =>
                setSalarySearch(event.target.value)
              }
            />
          </div>

          <div className={styles.salarySummaryGrid}>
            <div
              className={`${styles.salaryMetric} ${styles.salaryMetricPrimary}`}
            >
              <div className={styles.salaryMetricTop}>
                <span className={styles.salaryMetricLabel}>
                  Salary Expense
                </span>
                <span className={styles.salaryMetricIcon}>$</span>
              </div>
              <strong className={styles.salaryMetricValue}>
                {money(selectedSalaryMonth.total)}
              </strong>
              <small className={styles.salaryMetricNote}>
                Workbook Total Salary · {selectedSalaryMonth.employeeCount}{' '}
                employees
              </small>
            </div>

            <div className={styles.salaryMetric}>
              <div className={styles.salaryMetricTop}>
                <span className={styles.salaryMetricLabel}>
                  Final Payments
                </span>
                <span className={styles.salaryMetricIcon}>✓</span>
              </div>
              <strong className={styles.salaryMetricValue}>
                {money(selectedSalaryMonth.finalTotal)}
              </strong>
              <small className={styles.salaryMetricNote}>
                After borrowing and deductions
              </small>
            </div>

            <div className={styles.salaryMetric}>
              <div className={styles.salaryMetricTop}>
                <span className={styles.salaryMetricLabel}>
                  Extra Earnings
                </span>
                <span className={styles.salaryMetricIcon}>+</span>
              </div>
              <strong className={styles.salaryMetricValue}>
                {money(additionalEarnings)}
              </strong>
              <small className={styles.salaryMetricNote}>
                Commission, OT, payback and rewards
              </small>
            </div>

            <div className={styles.salaryMetric}>
              <div className={styles.salaryMetricTop}>
                <span className={styles.salaryMetricLabel}>
                  Borrow + Deductions
                </span>
                <span className={styles.salaryMetricIcon}>−</span>
              </div>
              <strong className={styles.salaryMetricValue}>
                {money(payrollDeductions)}
              </strong>
              <small className={styles.salaryMetricNote}>
                Removed from final payments
              </small>
            </div>

            <div className={styles.salaryMetric}>
              <div className={styles.salaryMetricTop}>
                <span className={styles.salaryMetricLabel}>
                  Month Change
                </span>
                <span className={styles.salaryMetricIcon}>↔</span>
              </div>
              <strong
                className={`${styles.salaryMetricValue} ${
                  payrollChange === null
                    ? styles.changeNeutral
                    : payrollChange > 0
                      ? styles.changeUp
                      : payrollChange < 0
                        ? styles.changeDown
                        : styles.changeNeutral
                }`}
              >
                {payrollChange === null
                  ? '—'
                  : `${payrollChange > 0 ? '+' : ''}${money(payrollChange)}`}
              </strong>
              <small className={styles.salaryMetricNote}>
                {payrollChangePercentage === null
                  ? 'No previous month available'
                  : `${payrollChangePercentage > 0 ? '+' : ''}${payrollChangePercentage.toFixed(1)}% vs previous month`}
              </small>
            </div>
          </div>

          <div
            className={`${styles.tableWrapper} ${styles.salaryTable}`}
          >
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Role</th>
                  <th className={styles.numericCell}>Base</th>
                  <th className={styles.numericCell}>Adjusted</th>
                  <th className={styles.numericCell}>Commission</th>
                  <th className={styles.numericCell}>OT</th>
                  <th className={styles.numericCell}>Reward</th>
                  <th className={styles.numericCell}>Gross</th>
                  <th className={styles.numericCell}>Borrow</th>
                  <th className={styles.numericCell}>Deduction</th>
                  <th className={styles.numericCell}>Final Paid</th>
                  <th className={styles.numericCell}>
                    vs Previous
                  </th>
                </tr>
              </thead>

              <tbody>
                {salaryEmployees.length > 0 ? (
                  salaryEmployees.map((employee) => {
                    const previousEmployee = previousEmployees.get(
                      employee.name.trim().toLowerCase()
                    );
                    const employeeChange = previousEmployee
                      ? employee.finalSalary - previousEmployee.finalSalary
                      : null;

                    return (
                      <tr key={employee.id}>
                        <td>
                          <strong className={styles.employeeName}>
                            {employee.name}
                          </strong>
                        </td>
                        <td>{employee.role}</td>
                        <td className={styles.numericCell}>
                          {money(employee.baseSalary)}
                        </td>
                        <td className={styles.numericCell}>
                          {money(employee.adjustedSalary)}
                        </td>
                        <td className={styles.numericCell}>
                          {money(employee.commission)}
                        </td>
                        <td className={styles.numericCell}>
                          {money(employee.overtime)}
                        </td>
                        <td className={styles.numericCell}>
                          {money(employee.extraReward)}
                        </td>
                        <td className={styles.numericCell}>
                          {money(employee.grossSalary)}
                        </td>
                        <td className={styles.numericCell}>
                          {money(employee.borrow)}
                        </td>
                        <td className={styles.numericCell}>
                          {money(employee.deduction)}
                        </td>
                        <td
                          className={`${styles.numericCell} ${styles.total}`}
                        >
                          {money(employee.finalSalary)}
                        </td>
                        <td
                          className={styles.numericCell}
                        >
                          <span
                            className={`${styles.changePill} ${
                              employeeChange === null
                                ? styles.changeNeutral
                                : employeeChange > 0
                                  ? styles.changeUp
                                  : employeeChange < 0
                                    ? styles.changeDown
                                    : styles.changeNeutral
                            }`}
                          >
                            {employeeChange === null
                              ? 'New'
                              : `${employeeChange > 0 ? '+' : ''}${money(employeeChange)}`}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={12} className={styles.emptyState}>
                      No payroll employees found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =============================
          RECENT EXPENSES
      ============================== */}

      <div className={`${styles.panel} ${styles.recentPanel}`}>
        <div
          className={
            styles.tableHeader
          }
        >
          <div>
            <h3>
              Recent Expenses
            </h3>

            <p>
              Latest recorded business
              expenses
            </p>
          </div>

          <div
            className={
              styles.filters
            }
          >
            {/* SEARCH */}

            <input
              type="text"
              value={search}
              placeholder="Search expenses..."
              className={
                styles.searchInput
              }
              onChange={(event) => {
                setSearch(event.target.value);
                setShowAllExpenses(false);
              }}
            />

            {/* CATEGORY DROPDOWN */}

            <div
              className={`${controls.selectControl} ${controls.categoryControl}`}
            >
              <span
                className={controls.selectedValue}
                aria-hidden="true"
              >
                {selectedCategory}
              </span>

              <select
                className={controls.nativeSelect}
                value={selectedCategory}
                aria-label="Filter by category"
                onChange={(event) => {
                  setSelectedCategory(event.target.value);
                  setShowAllExpenses(false);
                }}
              >
                {categoryOptions.map((category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* TABLE */}

        <div
          className={
            styles.tableWrapper
          }
        >
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>
                  Category
                </th>
                <th>
                  Description
                </th>
                <th>
                  Quantity
                </th>
                <th>Total</th>
              </tr>
            </thead>

            <tbody>
              {visibleExpenses.length >
              0 ? (
                visibleExpenses.map(
                  (expense) => (
                    <tr
                      key={expense.id}
                    >
                      <td>
                        {formatExpenseDate(
                          expense.date
                        )}
                      </td>

                      <td>
                        <span
                          className={
                            styles.categoryBadge
                          }
                        >
                          {
                            expense.category
                          }
                        </span>
                      </td>

                      <td>
                        {
                          expense.description
                        }
                      </td>

                      <td>
                        {
                          expense.quantity
                        }
                      </td>

                      <td
                        className={
                          styles.total
                        }
                      >
                        {money(
                          expense.total
                        )}
                      </td>
                    </tr>
                  )
                )
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className={
                      styles.emptyState
                    }
                  >
                    No expenses found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}

        <div
          className={
            styles.tableFooter
          }
        >
          <span>
            Showing{' '}
            {
              visibleExpenses.length
            }{' '}
            of{' '}
            {filteredExpenses.length}{' '}
            expense
            {filteredExpenses.length !==
            1
              ? 's'
              : ''}
          </span>

          {filteredExpenses.length > 10 && (
            <button
              type="button"
              onClick={() =>
                setShowAllExpenses(
                  !showAllExpenses
                )
              }
            >
              {showAllExpenses
                ? 'Show recent expenses ↑'
                : 'View all expenses →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
