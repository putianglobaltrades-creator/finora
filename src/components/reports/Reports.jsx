import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/StoreContext';
import { format, parseISO, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import { useToast } from '../ui/Toast';

export default function Reports() {
  const { currentUser, getUserTransactions, exportData } = useStore();
  const { showToast: toast } = useToast();
  const transactions = getUserTransactions(currentUser?.id);
  const [reportType, setReportType] = useState('monthly');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  const reportData = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));

    if (reportType === 'monthly') {
      const periodTx = transactions.filter(t => isWithinInterval(parseISO(t.date), { start, end }));
      const income = periodTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
      const expense = periodTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
      const byCategory = {};
      periodTx.forEach(t => {
        if (t.type === 'expense') {
          byCategory[t.category] = (byCategory[t.category] || 0) + Number(t.amount);
        }
      });
      return { periodTx, income, expense, balance: income - expense, byCategory, totalTx: periodTx.length };
    }
    return { periodTx: [], income: 0, expense: 0, balance: 0, byCategory: {}, totalTx: 0 };
  }, [transactions, selectedMonth, reportType]);

  const handleExportCSV = async () => {
    if (reportData.periodTx.length === 0) {
      toast.warning('No Data', 'No transactions for the selected period');
      return;
    }
    await exportData(reportData.periodTx);
    toast.success('Exported', 'Report exported successfully');
  };

  const currentDate = new Date();
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(currentDate, i);
    return { value: format(d, 'yyyy-MM'), label: format(d, 'MMMM yyyy') };
  });

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Reports</h1>
            <p className="page-subtitle">Generate financial reports</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={handleExportCSV} disabled={reportData.periodTx.length === 0}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export CSV
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Print
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div className="tx-filters">
          {['monthly', 'quarterly', 'yearly'].map(r => (
            <button key={r} className={`filter-btn ${reportType === r ? 'active' : ''}`} onClick={() => setReportType(r)}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
        <div className="input-wrapper" style={{ width: 200 }}>
          <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card" style={{ borderTop: '3px solid var(--success)' }}>
          <p className="stat-card-title">Total Income</p>
          <p className="stat-card-value" style={{ color: 'var(--success)' }}>${reportData.income.toLocaleString()}</p>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid var(--danger)' }}>
          <p className="stat-card-title">Total Expenses</p>
          <p className="stat-card-value" style={{ color: 'var(--danger)' }}>${reportData.expense.toLocaleString()}</p>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid var(--primary)' }}>
          <p className="stat-card-title">Net Balance</p>
          <p className="stat-card-value" style={{ color: reportData.balance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            ${reportData.balance.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>
          Summary for {months.find(m => m.value === selectedMonth)?.label || selectedMonth}
        </h3>
        {reportData.totalTx === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No transactions for this period.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Total Transactions</p>
              <p style={{ fontSize: 18, fontWeight: 600 }}>{reportData.totalTx}</p>
            </div>
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Avg per Transaction</p>
              <p style={{ fontSize: 18, fontWeight: 600 }}>
                ${reportData.totalTx > 0 ? Math.round((reportData.income + reportData.expense) / reportData.totalTx).toLocaleString() : 0}
              </p>
            </div>
          </div>
        )}
      </div>

      {Object.keys(reportData.byCategory).length > 0 && (
        <div className="glass-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>
            Expenses by Category
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(reportData.byCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, amount]) => {
                const pct = reportData.expense > 0 ? (amount / reportData.expense) * 100 : 0;
                return (
                  <div key={cat}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{cat}</span>
                      <span>${amount.toLocaleString()} ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="budget-bar-track">
                      <div className="budget-bar-fill ok" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
