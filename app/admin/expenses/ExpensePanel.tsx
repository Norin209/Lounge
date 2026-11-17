'use client';

import { useState } from 'react';
import styles from './expenses.module.css';
import controls from './select-controls.module.css';
import {
  expenseCategories,
  type ExpenseData,
} from './expense-source';

const categoryOptions = [
  'All Categories',
  ...expenseCategories,
];

const money = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
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

export default function ExpensePanel({ data, monthKey }: { data: ExpenseData; monthKey: string }) {
  const expenseMonths = data.months;
  const salaryMonths = data.salaryMonths;
  const [selectedCategory, setSelectedCategory] =
    useState('All Categories');

  const [search, setSearch] =
    useState('');

  const [salarySearch, setSalarySearch] =
    useState('');

  const [showAllExpenses, setShowAllExpenses] =
    useState(false);

  const selectedMonthData = expenseMonths.find((month) => month.key === monthKey);

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
    ? selectedSalaryMonth.commissionTotal + selectedSalaryMonth.overtimeTotal + selectedSalaryMonth.extraRewardTotal
    : 0;
  const payrollDeductions = selectedSalaryMonth
    ? selectedSalaryMonth.borrowTotal + selectedSalaryMonth.deductionTotal
    : 0;
  const payrollChange = previousSalaryMonth
    ? (selectedSalaryMonth?.finalTotal ?? 0) - previousSalaryMonth.finalTotal
    : null;
  const payrollChangePercentage =
    payrollChange !== null && previousSalaryMonth?.finalTotal
      ? (payrollChange / previousSalaryMonth.finalTotal) * 100
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
    <div className={`${styles.page} ${styles.embedded}`}>
      {/* =============================
          HEADER
      ============================== */}

      <div className={styles.header}>
        <div>
          <h2>Expenses &amp; payroll</h2>
          <p className={styles.subtitle}>Live data from {data.source} · refreshes every minute</p>
        </div>
      </div>

      {!selectedMonthData && <p className={styles.sourceWarnings}>No expense or payroll data has been added for this month.</p>}

      {!!selectedMonthData?.warnings?.length && (
        <div className={styles.sourceWarnings} role="status">
          <strong>Source data needs review</strong>
          <ul>
            {selectedMonthData.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {selectedMonthData && <>
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
            Total spending for {monthName}, including salary payments
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

        <div className={styles.panel}>
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

        <div className={styles.panel}>
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
            <div className={styles.salaryMetric}>
              <span>Final Payroll</span>
              <strong>{money(selectedSalaryMonth.finalTotal)}</strong>
              <small>
                {selectedSalaryMonth.employeeCount} employees
              </small>
            </div>

            <div className={styles.salaryMetric}>
              <span>Gross Payroll</span>
              <strong>{money(selectedSalaryMonth.total)}</strong>
              <small>Before borrowing and deductions</small>
            </div>

            <div className={styles.salaryMetric}>
              <span>Extra Earnings</span>
              <strong>{money(additionalEarnings)}</strong>
              <small>Commission, OT and rewards</small>
            </div>

            <div className={styles.salaryMetric}>
              <span>Borrow + Deductions</span>
              <strong>{money(payrollDeductions)}</strong>
              <small>Removed from final payments</small>
            </div>

            <div className={styles.salaryMetric}>
              <span>Month Change</span>
              <strong
                className={
                  payrollChange === null
                    ? styles.changeNeutral
                    : payrollChange > 0
                      ? styles.changeUp
                      : payrollChange < 0
                        ? styles.changeDown
                        : styles.changeNeutral
                }
              >
                {payrollChange === null
                  ? '—'
                  : `${payrollChange > 0 ? '+' : ''}${money(payrollChange)}`}
              </strong>
              <small>
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
                  <th className={styles.numericCell}>Gross</th>
                  <th className={styles.numericCell}>Extra</th>
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
                        <td data-label="Employee">
                          <strong className={styles.employeeName}>
                            {employee.name}
                          </strong>
                        </td>
                        <td data-label="Role">{employee.role}</td>
                        <td data-label="Base" className={styles.numericCell}>
                          {money(employee.baseSalary)}
                        </td>
                        <td data-label="Gross" className={styles.numericCell}>
                          {money(employee.grossSalary)}
                        </td>
                        <td data-label="Extra" className={styles.numericCell}>
                          {money(
                            employee.commission +
                              employee.overtime +
                              employee.extraReward
                          )}
                        </td>
                        <td data-label="Borrow" className={styles.numericCell}>
                          {money(employee.borrow)}
                        </td>
                        <td data-label="Deduction" className={styles.numericCell}>
                          {money(employee.deduction)}
                        </td>
                        <td data-label="Final paid"
                          className={`${styles.numericCell} ${styles.total}`}
                        >
                          {money(employee.finalSalary)}
                        </td>
                        <td data-label="vs previous"
                          className={`${styles.numericCell} ${
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
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className={styles.emptyState}>
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

      <div className={styles.panel}>
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
            `${styles.tableWrapper} ${styles.expenseTable}`
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
                      <td data-label="Date">
                        {formatExpenseDate(
                          expense.date
                        )}
                      </td>

                      <td data-label="Category">
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

                      <td data-label="Description">
                        {
                          expense.description
                        }
                      </td>

                      <td data-label="Quantity">
                        {
                          expense.quantity
                        }
                      </td>

                      <td data-label="Total"
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
      </>}
    </div>
  );
}
