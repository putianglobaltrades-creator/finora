import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/StoreContext';
import { useToast } from '../ui/Toast';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

const CATEGORIES = ['Housing', 'Food & Dining', 'Transportation', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Education', 'Travel', 'Insurance'];

export default function Budgets() {
  const { currentUser, getUserBudgets, getUserTransactions, addBudget, deleteBudget } = useStore();
  const { showToast: toast } = useToast();
  const budgets = getUserBudgets(currentUser?.id);
  const transactions = getUserTransactions(currentUser?.id);
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState('monthly');
  const [editingId, setEditingId] = useState(null);

  const budgetUsage = useMemo(() => {
    return budgets.map(budget => {
      const spent = transactions
        .filter(t => t.type === 'expense' && t.category === budget.category)
        .filter(t => isWithinInterval(parseISO(t.date), { start: monthStart, end: monthEnd }))
        .reduce((s, t) => s + Number(t.amount), 0);
      const pct = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      return { ...budget, spent, percentage: Math.min(pct, 100), remaining: budget.amount - spent };
    }).sort((a, b) => b.percentage - a.percentage);
  }, [budgets, transactions, monthStart, monthEnd]);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .filter(t => isWithinInterval(parseISO(t.date), { start: monthStart, end: monthEnd }))
    .reduce((s, t) => s + Number(t.amount), 0);

  const totalBudgeted = budgets.reduce((s, b) => s + Number(b.amount), 0);
  const totalSpent = budgetUsage.reduce((s, b) => s + b.spent, 0);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!category || !amount) return;
    const budgetData = { category, amount: parseFloat(amount), period, month: format(now, 'yyyy-MM') };
    addBudget(budgetData);
    toast.success('Budget Created', `$${parseFloat(amount).toLocaleString()} budget for ${category}`);
    setCategory('');
    setAmount('');
    setShowForm(false);
  };

  const handleDelete = (id, category) => {
    deleteBudget(id);
    toast.info('Budget Removed', `${category} budget deleted`);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Budgets</h1>
            <p className="page-subtitle">{format(now, 'MMMM yyyy')} &bull; {budgets.length} budgets active</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            {showForm ? 'Cancel' : 'New Budget'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="glass-card" style={{ padding: 24, marginBottom: 20, animation: 'fadeInUp 0.3s ease-out' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Create New Budget</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="input-group">
              <label>Category</label>
              <div className="input-wrapper">
                <select value={category} onChange={e => setCategory(e.target.value)} required>
                  <option value="">Select category</option>
                  {CATEGORIES.filter(c => !budgets.find(b => b.category === c)).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="input-group">
              <label>Budget Amount</label>
              <div className="input-wrapper">
                <span style={{ color: 'var(--text-muted)' }}>$</span>
                <input type="number" step="0.01" min="0" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required />
              </div>
            </div>
            <div className="input-group">
              <label>Period</label>
              <div className="input-wrapper">
                <select value={period} onChange={e => setPeriod(e.target.value)}>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>
          </div>
          <button type="submit" className="btn btn-primary">Create Budget</button>
        </form>
      )}

      {budgets.length > 0 && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <div className="stat-card" style={{ flex: 1, padding: 16 }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Total Budgeted</p>
              <p style={{ fontSize: 22, fontWeight: 700 }}>${totalBudgeted.toLocaleString()}</p>
            </div>
            <div className="stat-card" style={{ flex: 1, padding: 16 }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Total Spent</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--danger)' }}>${totalSpent.toLocaleString()}</p>
            </div>
            <div className="stat-card" style={{ flex: 1, padding: 16 }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Remaining</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: totalBudgeted - totalSpent > 0 ? 'var(--success)' : 'var(--danger)' }}>
                ${(totalBudgeted - totalSpent).toLocaleString()}
              </p>
            </div>
            {totalIncome > 0 && (
              <div className="stat-card" style={{ flex: 1, padding: 16 }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>% of Income Budgeted</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: totalBudgeted / totalIncome > 0.8 ? 'var(--warning)' : 'var(--success)' }}>
                  {((totalBudgeted / totalIncome) * 100).toFixed(0)}%
                </p>
              </div>
            )}
          </div>
          {totalIncome > 0 && (
            <div className="glass-card" style={{ padding: '14px 18px', marginBottom: 16, fontSize: 13, background: 'var(--bg-glass)' }}>
              <strong>Income Allocation:</strong> Your total monthly income is <strong>${totalIncome.toLocaleString()}</strong>.
              You've budgeted <strong>{((totalBudgeted / totalIncome) * 100).toFixed(0)}%</strong> of your income.
              After expenses, you could save <strong>${(totalIncome - totalBudgeted).toLocaleString()}</strong> per month.
            </div>
          )}
        </div>
      )}

      {budgetUsage.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          </svg>
          <h3>No budgets yet</h3>
          <p>Create your first budget to start tracking your spending limits.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {budgetUsage.map(budget => {
            const status = budget.percentage > 90 ? 'over' : budget.percentage > 75 ? 'warning' : 'ok';
            return (
              <div key={budget.id} className="budget-card">
                <div className="budget-header">
                  <div>
                    <div className="budget-category">{budget.category}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {budget.period || 'Monthly'}
                      {totalIncome > 0 && budget.amount > 0 && (
                        <span style={{ marginLeft: 8, color: 'var(--secondary)', fontWeight: 500 }}>
                          {((Number(budget.amount) / totalIncome) * 100).toFixed(1)}% of income
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="budget-amounts">
                      <span className="budget-spent">${budget.spent.toLocaleString()}</span>
                      <span className="budget-sep"> / </span>
                      <span className="budget-max">${Number(budget.amount).toLocaleString()}</span>
                    </div>
                    <button className="tx-action-btn danger:hover" onClick={() => handleDelete(budget.id, budget.category)} title="Delete">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                    </button>
                  </div>
                </div>
                <div className="budget-bar-track">
                  <div className={`budget-bar-fill ${status}`} style={{ width: `${budget.percentage}%` }} />
                </div>
                <div className="budget-footer">
                  <span className="budget-remaining" style={{ color: budget.remaining >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {budget.remaining >= 0 ? `$${budget.remaining.toLocaleString()} remaining` : `$${Math.abs(budget.remaining).toLocaleString()} over`}
                  </span>
                  <span style={{ fontWeight: 600, color: status === 'over' ? 'var(--danger)' : status === 'warning' ? 'var(--warning)' : 'var(--text-muted)' }}>
                    {budget.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
