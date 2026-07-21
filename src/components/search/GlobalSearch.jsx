import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useStore } from '../../store/StoreContext';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
  { id: 'analytics', label: 'Analytics', icon: 'M18 20V10 M12 20V4 M6 20v-6' },
  { id: 'transactions', label: 'Transactions', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' },
  { id: 'add', label: 'Add Transaction', icon: 'M12 5v14M5 12h14' },
  { id: 'budgets', label: 'Budgets', icon: 'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z' },
  { id: 'accounts', label: 'Accounts', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' },
  { id: 'categories', label: 'Categories', icon: 'M4 6h16M4 12h16M4 18h16' },
  { id: 'savings', label: 'Savings Goals', icon: 'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z' },
  { id: 'investments', label: 'Investments', icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
  { id: 'recurring', label: 'Recurring Payments', icon: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' },
  { id: 'calendar', label: 'Calendar', icon: 'M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z' },
  { id: 'reports', label: 'Reports', icon: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' },
  { id: 'settings', label: 'Settings', icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z' },
];

export default function GlobalSearch({ onClose, onNavigate }) {
  const { currentUser, getUserTransactions, getUserAccounts, getUserBudgets } = useStore();
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);
  const transactions = getUserTransactions(currentUser?.id);
  const accounts = getUserAccounts(currentUser?.id);
  const budgets = getUserBudgets(currentUser?.id);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return { pages: NAV_ITEMS, transactions: [], accounts: [], budgets: [] };
    const q = query.toLowerCase();

    const pages = NAV_ITEMS.filter(item =>
      item.label.toLowerCase().includes(q)
    );

    const txResults = transactions.filter(t =>
      t.category?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.merchant?.toLowerCase().includes(q) ||
      t.note?.toLowerCase().includes(q)
    ).slice(0, 5);

    const acctResults = accounts.filter(a =>
      a.name?.toLowerCase().includes(q) ||
      a.type?.toLowerCase().includes(q)
    ).slice(0, 3);

    const budgetResults = budgets.filter(b =>
      b.category?.toLowerCase().includes(q)
    ).slice(0, 3);

    return { pages, transactions: txResults, accounts: acctResults, budgets: budgetResults };
  }, [query, transactions, accounts, budgets, NAV_ITEMS]);

  const allResults = useMemo(() => {
    const items = [];
    results.pages.forEach(p => items.push({ type: 'page', ...p }));
    results.transactions.forEach(t => items.push({ type: 'transaction', data: t }));
    results.accounts.forEach(a => items.push({ type: 'account', data: a }));
    results.budgets.forEach(b => items.push({ type: 'budget', data: b }));
    return items;
  }, [results]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(prev => Math.min(prev + 1, allResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && allResults[selectedIdx]) {
      const item = allResults[selectedIdx];
      if (item.type === 'page') onNavigate(item.id);
      else if (item.type === 'transaction') onNavigate('transactions');
      else if (item.type === 'account') onNavigate('accounts');
      else if (item.type === 'budget') onNavigate('budgets');
    }
  };

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-modal" onClick={e => e.stopPropagation()}>
        <div className="search-input-wrapper">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input ref={inputRef} type="text" placeholder="Search pages, transactions, accounts..."
            value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKeyDown} />
          <span className="search-shortcut">ESC</span>
        </div>
        <div className="search-results">
          {allResults.length === 0 && (
            <div className="search-empty">
              {query ? 'No results found' : 'Start typing to search...'}
            </div>
          )}
          {allResults.map((item, idx) => (
            <div key={`${item.type}-${item.id || item.data?.id}`}
              className={`search-result-item ${idx === selectedIdx ? 'highlight' : ''}`}
              style={idx === selectedIdx ? { background: 'var(--bg-tertiary)' } : {}}
              onClick={() => {
                if (item.type === 'page') onNavigate(item.id);
                else if (item.type === 'transaction') onNavigate('transactions');
                else if (item.type === 'account') onNavigate('accounts');
                else if (item.type === 'budget') onNavigate('budgets');
              }}
              onMouseEnter={() => setSelectedIdx(idx)}>
              <div className="search-result-icon">
                {item.type === 'page' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={item.icon} /></svg>
                )}
                {item.type === 'transaction' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                  </svg>
                )}
                {item.type === 'account' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                  </svg>
                )}
                {item.type === 'budget' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  </svg>
                )}
              </div>
              <div className="search-result-info">
                <div className="search-result-title">
                  {item.type === 'page' ? item.label : ''}
                  {item.type === 'transaction' ? `${item.data.category} - $${Number(item.data.amount).toLocaleString()}` : ''}
                  {item.type === 'account' ? item.data.name : ''}
                  {item.type === 'budget' ? `${item.data.category} - $${Number(item.data.amount).toLocaleString()}` : ''}
                </div>
                <div className="search-result-sub">
                  {item.type === 'page' ? 'Navigate to page' : ''}
                  {item.type === 'transaction' ? (item.data.description || item.data.note || 'Transaction') : ''}
                  {item.type === 'account' ? item.data.type : ''}
                  {item.type === 'budget' ? 'Budget' : ''}
                </div>
              </div>
              <span className="search-shortcut">
                {item.type === 'page' ? 'Page' : item.type}
              </span>
            </div>
          ))}
        </div>
        <div style={{
          padding: '10px 20px', borderTop: '1px solid var(--border-light)',
          display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-muted)',
        }}>
          <span><kbd className="search-shortcut">↑↓</kbd> Navigate</span>
          <span><kbd className="search-shortcut">Enter</kbd> Open</span>
          <span><kbd className="search-shortcut">Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  );
}
