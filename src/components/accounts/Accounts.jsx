import React, { useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { useToast } from '../ui/Toast';

const ACCOUNT_TYPES = ['Checking', 'Savings', 'Credit Card', 'Cash', 'Investment', 'Crypto', 'Real Estate', 'Loan', 'Other'];

export default function Accounts() {
  const { currentUser, getUserAccounts, addAccount, deleteAccount } = useStore();
  const { showToast: toast } = useToast();
  const accounts = getUserAccounts(currentUser?.id);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('Checking');
  const [balance, setBalance] = useState('');
  const [color, setColor] = useState('#4F8CFF');

  const totalAssets = accounts
    .filter(a => !['Credit Card', 'Loan'].includes(a.type))
    .reduce((s, a) => s + Number(a.balance || 0), 0);
  const totalLiabilities = accounts
    .filter(a => ['Credit Card', 'Loan'].includes(a.type))
    .reduce((s, a) => s + Number(a.balance || 0), 0);
  const netWorth = totalAssets - totalLiabilities;

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name || !balance) return;
    const accountData = { name, type, balance: parseFloat(balance), color };
    addAccount(accountData);
    toast.success('Account Added', `${name} created with $${parseFloat(balance).toLocaleString()}`);
    setName('');
    setType('Checking');
    setBalance('');
    setShowForm(false);
  };

  const handleDelete = (id, name) => {
    deleteAccount(id);
    toast.info('Account Removed', `${name} deleted`);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Accounts</h1>
            <p className="page-subtitle">{accounts.length} accounts &bull; Net worth tracking</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            {showForm ? 'Cancel' : 'Add Account'}
          </button>
        </div>
      </div>

      {accounts.length > 0 && (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card" style={{ borderTop: '3px solid var(--success)' }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Total Assets</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--success)' }}>${totalAssets.toLocaleString()}</p>
          </div>
          <div className="stat-card" style={{ borderTop: '3px solid var(--danger)' }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Total Liabilities</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--danger)' }}>${totalLiabilities.toLocaleString()}</p>
          </div>
          <div className="stat-card" style={{ borderTop: '3px solid var(--primary)' }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Net Worth</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: netWorth >= 0 ? 'var(--primary)' : 'var(--danger)' }}>
              ${netWorth.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAdd} className="glass-card" style={{ padding: 24, marginBottom: 20, animation: 'fadeInUp 0.3s ease-out' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>New Account</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="input-group">
              <label>Account Name</label>
              <div className="input-wrapper">
                <input type="text" placeholder="e.g. Main Checking" value={name} onChange={e => setName(e.target.value)} required />
              </div>
            </div>
            <div className="input-group">
              <label>Type</label>
              <div className="input-wrapper">
                <select value={type} onChange={e => setType(e.target.value)}>
                  {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="input-group">
              <label>Balance</label>
              <div className="input-wrapper">
                <span style={{ color: 'var(--text-muted)' }}>$</span>
                <input type="number" step="0.01" placeholder="0.00" value={balance} onChange={e => setBalance(e.target.value)} required />
              </div>
            </div>
          </div>
          <div className="input-group" style={{ marginBottom: 16 }}>
            <label>Color</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {['#4F8CFF', '#34D399', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'].map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  style={{
                    width: 28, height: 28, borderRadius: '50%', background: c, border: color === c ? '3px solid var(--text-primary)' : '2px solid transparent',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }} />
              ))}
            </div>
          </div>
          <button type="submit" className="btn btn-primary">Create Account</button>
        </form>
      )}

      {accounts.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M12 2L2 7h20z" /><rect x="8" y="12" width="3" height="5" /><rect x="13" y="12" width="3" height="5" />
          </svg>
          <h3>No accounts yet</h3>
          <p>Add your bank accounts, credit cards, and other financial accounts.</p>
        </div>
      ) : (
        <div className="accounts-grid">
          {accounts.map(account => (
            <div key={account.id} className="account-card">
              <div className="account-card-type" style={{ color: account.color || 'var(--text-muted)' }}>
                {account.type}
              </div>
              <div className="account-card-name">{account.name}</div>
              <div className={`account-card-balance ${Number(account.balance) >= 0 ? 'account-card-positive' : 'account-card-negative'}`}
                style={{ color: Number(account.balance) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {Number(account.balance) >= 0 ? '+' : ''}${Number(account.balance).toLocaleString()}
              </div>
              <button className="tx-action-btn danger:hover" onClick={() => handleDelete(account.id, account.name)}
                style={{ position: 'absolute', top: 12, right: 12 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
