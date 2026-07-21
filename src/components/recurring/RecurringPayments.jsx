import React, { useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { useToast } from '../ui/Toast';
import { format, parseISO } from 'date-fns';

const FREQUENCIES = ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'];
const FREQ_LABELS = { daily: 'Daily', weekly: 'Weekly', biweekly: 'Biweekly', monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly' };

export default function RecurringPayments() {
  const { currentUser, getUserRecurringPayments, addRecurringPayment, deleteRecurringPayment } = useStore();
  const { showToast: toast } = useToast();
  const payments = getUserRecurringPayments(currentUser?.id);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [frequency, setFrequency] = useState('monthly');
  const [nextDate, setNextDate] = useState('');
  const [category, setCategory] = useState('');

  const monthlyTotal = payments
    .filter(p => p.type === 'expense')
    .reduce((s, p) => {
      if (p.frequency === 'monthly') return s + Number(p.amount);
      if (p.frequency === 'weekly') return s + Number(p.amount) * 4.33;
      if (p.frequency === 'yearly') return s + Number(p.amount) / 12;
      return s + Number(p.amount);
    }, 0);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name || !amount || !nextDate) return;
    addRecurringPayment({
      name, amount: parseFloat(amount), type, frequency, nextDate, category: category || 'Other',
    });
    toast.success('Payment Added', `${name} scheduled ${FREQ_LABELS[frequency]}`);
    setName(''); setAmount(''); setNextDate(''); setCategory('');
    setShowForm(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Recurring Payments</h1>
            <p className="page-subtitle">{payments.length} recurring items &bull; ${monthlyTotal.toLocaleString()}/mo</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            {showForm ? 'Cancel' : 'Add Recurring'}
          </button>
        </div>
      </div>

      {payments.length > 0 && (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card" style={{ borderTop: '3px solid var(--danger)' }}>
            <p className="stat-card-title">Monthly Obligations</p>
            <p className="stat-card-value" style={{ color: 'var(--danger)' }}>${monthlyTotal.toLocaleString()}</p>
          </div>
          <div className="stat-card" style={{ borderTop: '3px solid var(--primary)' }}>
            <p className="stat-card-title">Active Payments</p>
            <p className="stat-card-value" style={{ color: 'var(--primary)' }}>{payments.length}</p>
          </div>
          <div className="stat-card" style={{ borderTop: '3px solid var(--warning)' }}>
            <p className="stat-card-title">Due This Month</p>
            <p className="stat-card-value" style={{ color: 'var(--warning)' }}>
              {payments.filter(p => {
                const d = parseISO(p.nextDate);
                const now = new Date();
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
              }).length}
            </p>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAdd} className="glass-card" style={{ padding: 24, marginBottom: 20, animation: 'fadeInUp 0.3s ease-out' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>New Recurring Payment</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="input-group">
              <label>Name</label>
              <div className="input-wrapper">
                <input type="text" placeholder="e.g. Netflix" value={name} onChange={e => setName(e.target.value)} required />
              </div>
            </div>
            <div className="input-group">
              <label>Amount</label>
              <div className="input-wrapper">
                <span style={{ color: 'var(--text-muted)' }}>$</span>
                <input type="number" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required />
              </div>
            </div>
            <div className="input-group">
              <label>Type</label>
              <div className="input-wrapper">
                <select value={type} onChange={e => setType(e.target.value)}>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
            </div>
            <div className="input-group">
              <label>Frequency</label>
              <div className="input-wrapper">
                <select value={frequency} onChange={e => setFrequency(e.target.value)}>
                  {FREQUENCIES.map(f => <option key={f} value={f}>{FREQ_LABELS[f]}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="form-row full">
            <div className="input-group">
              <label>Next Payment Date</label>
              <div className="input-wrapper">
                <input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)} required />
              </div>
            </div>
          </div>
          <button type="submit" className="btn btn-primary">Add Recurring Payment</button>
        </form>
      )}

      {payments.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          <h3>No recurring payments</h3>
          <p>Track subscriptions, bills, and recurring income.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {payments.map(p => (
            <div key={p.id} className="tx-detailed-item">
              <div className="tx-detailed-left">
                <div className={`tx-type-badge ${p.type}`}>
                  {p.type === 'expense' ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
                  )}
                </div>
                <div className="tx-detailed-info">
                  <span className="tx-detailed-category">{p.name}</span>
                  <span className="tx-detailed-desc">{FREQ_LABELS[p.frequency] || p.frequency} &bull; {p.category || p.type}</span>
                  <span className="tx-detailed-date">Next: {format(parseISO(p.nextDate), 'MMM d, yyyy')}</span>
                </div>
              </div>
              <div className="tx-detailed-right">
                <span className={`tx-detailed-amount ${p.type}`}>
                  {p.type === 'expense' ? '-' : '+'}${Number(p.amount).toLocaleString()}
                </span>
                <button className="tx-action-btn danger:hover" onClick={() => { deleteRecurringPayment(p.id); toast.info('Removed', `${p.name} deleted`); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
