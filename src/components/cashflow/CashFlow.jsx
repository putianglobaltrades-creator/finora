import React, { useMemo } from 'react';
import { useStore } from '../../store/StoreContext';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function CashFlow() {
  const { data, currentUser, getUserTransactions, getUserCashFlow, addCashFlowRecord, addNetWorthSnapshot } = useStore();
  const transactions = getUserTransactions(currentUser?.id);
  const records = getUserCashFlow(currentUser?.id);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const monthData = useMemo(() => {
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const m = currentMonth - i;
      const year = currentYear + (m <= 0 ? -1 : 0) + (m > 12 ? 1 : 0);
      const month = ((m - 1) % 12 + 12) % 12 + 1;
      months.push({ month, year, label: `${MONTHS[month - 1]} ${year}` });
    }
    return months;
  }, [currentMonth, currentYear]);

  const getMonthIncome = (month, year) =>
    transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() + 1 === month && d.getFullYear() === year && t.type === 'income';
    }).reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);

  const getMonthExpenses = (month, year) =>
    transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() + 1 === month && d.getFullYear() === year && t.type === 'expense';
    }).reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);

  const ob = data.openingBalances;
  let runningCash = (ob.checking || 0) + (ob.savings || 0);

  const handleSnapshot = () => {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
    const totalAssets = (ob.checking || 0) + (ob.savings || 0) + (ob.investments || 0) + totalIncome - totalExpenses;
    const totalLiabilities = ob.debts || 0;
    addNetWorthSnapshot({
      month: currentMonth, year: currentYear,
      totalAssets, totalLiabilities, netWorth: totalAssets - totalLiabilities,
    });
    alert('Net worth snapshot saved for ' + MONTHS[currentMonth - 1] + ' ' + currentYear);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Monthly Cash Flow</h1>
        <p className="page-subtitle">Track your cash position month by month</p>
      </div>

      <div className="cashflow-summary">
        <div className="stat-card">
          <div className="stat-label">Current Cash Position</div>
          <div className="stat-value" style={{ color: 'var(--primary)' }}>${runningCash.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">12-Month Total Income</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>
            ${monthData.reduce((s, m) => s + getMonthIncome(m.month, m.year), 0).toLocaleString()}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">12-Month Total Expenses</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>
            ${monthData.reduce((s, m) => s + getMonthExpenses(m.month, m.year), 0).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="cashflow-table-container">
        <table className="cashflow-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Beginning Cash</th>
              <th>Income</th>
              <th>Expenses</th>
              <th>Net Change</th>
              <th>Ending Cash</th>
            </tr>
          </thead>
          <tbody>
            {monthData.map(m => {
              const income = getMonthIncome(m.month, m.year);
              const expenses = getMonthExpenses(m.month, m.year);
              const netChange = income - expenses;
              const begCash = runningCash;
              runningCash += netChange;
              const endCash = runningCash;
              const isFuture = m.year > currentYear || (m.year === currentYear && m.month > currentMonth);
              return (
                <tr key={`${m.month}-${m.year}`} className={isFuture ? 'cashflow-future' : ''}>
                  <td><strong>{m.label}</strong></td>
                  <td>${begCash.toLocaleString()}</td>
                  <td style={{ color: 'var(--success)' }}>{income > 0 ? `+$${income.toLocaleString()}` : '$0'}</td>
                  <td style={{ color: 'var(--danger)' }}>{expenses > 0 ? `-$${expenses.toLocaleString()}` : '$0'}</td>
                  <td style={{ color: netChange >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {netChange >= 0 ? '+' : ''}${netChange.toLocaleString()}
                  </td>
                  <td style={{ fontWeight: 600 }}>${endCash.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="cashflow-actions">
        <button className="btn btn-primary" onClick={handleSnapshot}>
          Save Current Net Worth Snapshot
        </button>
      </div>

      <div className="cashflow-tips">
        <h3>Tips</h3>
        <ul>
          <li>The cash flow starts from your opening checking + savings balances</li>
          <li>Each month's ending cash becomes the next month's beginning cash</li>
          <li>Future months are shown as a projection based on current data</li>
          <li>Log transactions regularly to keep your cash flow accurate</li>
        </ul>
      </div>
    </div>
  );
}
