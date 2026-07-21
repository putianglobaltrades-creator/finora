import React, { useState } from 'react';
import { useStore } from '../../store/StoreContext';

const EXPENSE_CATEGORIES = ['Housing', 'Food & Dining', 'Transportation', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Education', 'Travel', 'Insurance', 'Other'];
const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investments', 'Gifts', 'Other Income'];
const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'PayPal', 'Crypto', 'Other'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'INR', 'BRL'];
const CURRENCY_SYMBOLS = { USD: '$', EUR: '€', GBP: '£', CAD: 'C$', AUD: 'A$', JPY: '¥', CHF: 'Fr', CNY: '¥', INR: '₹', BRL: 'R$' };

export default function AddTransaction({ onDone }) {
  const { addTransaction, getUserAccounts, data } = useStore();
  const accounts = getUserAccounts();
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [merchant, setMerchant] = useState('');
  const [account, setAccount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [currency, setCurrency] = useState(data?.settings?.currency || 'USD');
  const [tags, setTags] = useState('');
  const [note, setNote] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [recurringFreq, setRecurringFreq] = useState('monthly');
  const [error, setError] = useState('');
  const [popupMsg, setPopupMsg] = useState('');

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setError('Please enter a valid amount'); return; }
    if (!category) { setError('Please select a category'); return; }

    const tx = {
      amount: amt,
      type,
      category,
      date,
      time: time || '00:00',
      description,
      merchant,
      account,
      paymentMethod,
      currency,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      note,
      recurring: recurring ? { frequency: recurringFreq } : null,
    };

    addTransaction(tx);
    setPopupMsg(`${type === 'expense' ? 'Expense' : 'Income'} of $${amt.toLocaleString()} recorded`);
    setTimeout(() => setPopupMsg(''), 2500);
    setAmount('');
    setCategory('');
    setDescription('');
    setMerchant('');
    setAccount('');
    setPaymentMethod('');
    setCurrency(data?.settings?.currency || 'USD');
    setTags('');
    setNote('');
    setRecurring(false);
  };

  return (
    <div className="page" style={{ maxWidth: 680 }}>
      {popupMsg && <div style={{position:'fixed',bottom:80,right:20,background:'#fff',padding:'14px 18px',borderRadius:12,borderLeft:'4px solid #34D399',boxShadow:'0 8px 32px rgba(0,0,0,0.12)',zIndex:99999,fontSize:13,fontWeight:600,color:'#1e293b',maxWidth:360,pointerEvents:'none'}} className="toast-popup">Added &mdash; {popupMsg}</div>}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Add Transaction</h1>
            <p className="page-subtitle">Record a new income or expense</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-card" style={{ padding: 28 }}>
        <div className="type-toggle">
          <button type="button" className={`type-btn expense ${type === 'expense' ? 'active' : ''}`} onClick={() => { setType('expense'); setCategory(''); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Expense
          </button>
          <button type="button" className={`type-btn income ${type === 'income' ? 'active' : ''}`} onClick={() => { setType('income'); setCategory(''); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
            Income
          </button>
          <button type="button" className={`type-btn transfer ${type === 'transfer' ? 'active' : ''}`} onClick={() => { setType('transfer'); setCategory('Transfer'); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="17" y1="3" x2="17" y2="21" /><polyline points="13 7 17 3 21 7" /><line x1="7" y1="21" x2="7" y2="3" /><polyline points="11 17 7 21 3 17" /></svg>
            Transfer
          </button>
        </div>

        <div className="form-row">
          <div className="input-group">
            <label>Amount</label>
            <div className="input-wrapper amount-input">
              <span className="currency-symbol" style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: 16 }}>{CURRENCY_SYMBOLS[currency] || '$'}</span>
              <input type="number" step="0.01" min="0" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} autoFocus />
            </div>
          </div>
          <div className="input-group">
            <label>Currency</label>
            <div className="input-wrapper">
              <select value={currency} onChange={e => setCurrency(e.target.value)}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="form-row">
          <div className="input-group">
            <label>Date</label>
            <div className="input-wrapper">
              <input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>
          <div className="input-group">
            <label>Time (optional)</label>
            <div className="input-wrapper">
              <input type="time" value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="input-group" style={{ marginBottom: 18 }}>
          <label>Category</label>
          <div className="category-grid">
            {categories.map(cat => (
              <button key={cat} type="button" className={`category-chip ${category === cat ? 'active' : ''}`}
                onClick={() => setCategory(cat)}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="form-row">
          <div className="input-group">
            <label>Description</label>
            <div className="input-wrapper">
              <input type="text" placeholder="What was this for?" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
          </div>
          <div className="input-group">
            <label>Merchant / Payee</label>
            <div className="input-wrapper">
              <input type="text" placeholder="Store, company, or person" value={merchant} onChange={e => setMerchant(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="form-row">
          <div className="input-group">
            <label>Payment Method</label>
            <div className="input-wrapper">
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                <option value="">Select method</option>
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div className="input-group">
            <label>Account</label>
            <div className="input-wrapper">
              <select value={account} onChange={e => setAccount(e.target.value)}>
                <option value="">Select account</option>
                {accounts.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                <option value="new">+ Add New Account</option>
              </select>
            </div>
          </div>
        </div>

        <div className="input-group" style={{ marginBottom: 18 }}>
          <label>Tags (comma separated)</label>
          <div className="input-wrapper">
            <input type="text" placeholder="e.g. groceries, weekly, essential" value={tags} onChange={e => setTags(e.target.value)} />
          </div>
        </div>

        <div className="input-group" style={{ marginBottom: 18 }}>
          <label>Notes</label>
          <div className="input-wrapper">
            <textarea placeholder="Additional notes..." value={note} onChange={e => setNote(e.target.value)} rows={2} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'var(--primary)' }} />
            Recurring Transaction
          </label>
          {recurring && (
            <select value={recurringFreq} onChange={e => setRecurringFreq(e.target.value)}
              style={{
                padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)',
                background: 'var(--bg-input)', fontSize: 13, fontFamily: 'var(--font)', color: 'var(--text-secondary)',
              }}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          )}
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onDone}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-lg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
            Add {type === 'expense' ? 'Expense' : type === 'income' ? 'Income' : 'Transfer'}
          </button>
        </div>
      </form>
    </div>
  );
}
