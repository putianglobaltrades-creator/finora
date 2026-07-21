import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useStore } from '../../store/StoreContext';
import { format, parseISO } from 'date-fns';
import { formatAmount, getCurrencySymbol } from '../../utils/currency';

const ITEMS_PER_PAGE = 20;

export default function Transactions() {
  const { currentUser, getUserTransactions, deleteTransaction, exportData, importFile, importTransactions, data } = useStore();
  const currency = data?.settings?.currency || 'USD';
  const transactions = getUserTransactions(currentUser?.id);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [importResult, setImportResult] = useState(null);
  const sentinelRef = useRef(null);

  const filtered = useMemo(() => {
    let list = [...transactions];
    if (filter !== 'all') list = list.filter(t => t.type === filter);
    if (typeFilter !== 'all') list = list.filter(t => t.category === typeFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.category?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.note?.toLowerCase().includes(q) ||
        t.merchant?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const aVal = sortBy === 'date' ? new Date(a.date + 'T' + (a.time || '00:00')) : Number(a.amount);
      const bVal = sortBy === 'date' ? new Date(b.date + 'T' + (b.time || '00:00')) : Number(b.amount);
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return list;
  }, [transactions, filter, typeFilter, search, sortBy, sortDir]);

  const paginated = useMemo(() => filtered.slice(0, page * ITEMS_PER_PAGE), [filtered, page]);
  const hasMore = paginated.length < filtered.length;

  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setPage(p => p + 1);
    }, { threshold: 0.1 });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore]);

  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [search, filter, typeFilter, sortBy, sortDir]);

  const totalIn = filtered.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const totalOut = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

  const handleExport = async () => {
    await exportData(filtered);
  };

  const handleImport = async () => {
    setImportResult(null);
    const result = await importFile();
    if (!result) return;
    try {
      if (result.filePath.endsWith('.csv')) {
        const Papa = await import('papaparse');
        const parsed = Papa.parse(result.content, { header: true, skipEmptyLines: true });
        if (parsed.data && parsed.data.length > 0) {
          const mapped = parsed.data.map(row => ({
            amount: parseFloat(row.amount || row.Amount || 0),
            type: (row.type || row.Type || 'expense').toLowerCase(),
            category: row.category || row.Category || 'other',
            description: row.description || row.Description || row.note || '',
            date: row.date || row.Date || new Date().toISOString().split('T')[0],
          }));
          const imported = importTransactions(mapped);
          setImportResult({ success: true, count: imported.length });
        }
      } else if (result.filePath.endsWith('.json')) {
        const data = JSON.parse(result.content);
        const txns = Array.isArray(data) ? data : (data.transactions || []);
        const imported = importTransactions(txns);
        setImportResult({ success: true, count: imported.length });
      }
    } catch (err) {
      setImportResult({ success: false, error: err.message });
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginated.map(t => t.id)));
  };

  const deleteSelected = () => {
    selectedIds.forEach(id => deleteTransaction(id));
    setSelectedIds(new Set());
  };

  const categories = [...new Set(transactions.map(t => t.category))];

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Transactions</h1>
            <p className="page-subtitle">{transactions.length} total transactions</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={handleImport}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Import
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleExport}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Export
            </button>
          </div>
        </div>
      </div>

      {importResult && (
        <div className={`import-result ${importResult.success ? 'success' : 'error'}`} style={{
          padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: 16, fontSize: 14, fontWeight: 500,
          background: importResult.success ? 'var(--success-bg)' : 'var(--danger-bg)',
          color: importResult.success ? 'var(--success)' : 'var(--danger)',
          border: `1px solid ${importResult.success ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.2)'}`,
        }}>
          {importResult.success ? `Successfully imported ${importResult.count} transactions` : `Import failed: ${importResult.error}`}
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 12 }} onClick={() => setImportResult(null)}>Dismiss</button>
        </div>
      )}

      <div className="tx-controls">
        <div className="tx-search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="text" placeholder="Search transactions, categories, merchants..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="tx-filters">
          {['all', 'income', 'expense', 'transfer'].map(f => (
            <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {categories.length > 0 && (
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            style={{
              padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)',
              background: 'var(--bg-glass)', fontSize: 13, fontFamily: 'var(--font)', color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}>
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {selectedIds.size > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
          background: 'var(--primary-glow)', borderRadius: 'var(--radius-md)', marginBottom: 12,
        }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{selectedIds.size} selected</span>
          <button className="btn btn-danger btn-sm" onClick={deleteSelected}>Delete Selected</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setSelectedIds(new Set())}>Clear</button>
        </div>
      )}

      {filtered.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div className="tx-summary-item income" style={{
            flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)', padding: '10px 16px', display: 'flex',
            justifyContent: 'space-between', alignItems: 'center', fontSize: 13,
            color: 'var(--success)',
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>Income</span>
            <span style={{ fontWeight: 700 }}>{formatAmount(totalIn, currency)}</span>
          </div>
          <div className="tx-summary-item expense" style={{
            flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)', padding: '10px 16px', display: 'flex',
            justifyContent: 'space-between', alignItems: 'center', fontSize: 13,
            color: 'var(--danger)',
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>Expenses</span>
            <span style={{ fontWeight: 700 }}>{formatAmount(totalOut, currency)}</span>
          </div>
          <div className="tx-summary-item balance" style={{
            flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)', padding: '10px 16px', display: 'flex',
            justifyContent: 'space-between', alignItems: 'center', fontSize: 13,
            color: 'var(--primary)',
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>Balance</span>
            <span style={{ fontWeight: 700 }}>{formatAmount(totalIn - totalOut, currency)}</span>
          </div>
        </div>
      )}

      <div className="tx-list-detailed">
        {paginated.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
            </svg>
            <p>{search || filter !== 'all' ? 'No transactions match your filters' : 'No transactions yet'}</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input type="checkbox" checked={selectedIds.size === paginated.length && paginated.length > 0}
                  onChange={toggleSelectAll} style={{ accentColor: 'var(--primary)', width: 16, height: 16 }} />
              </label>
              <span style={{ marginLeft: 38, flex: 1 }}>Transaction</span>
              <span style={{ cursor: 'pointer' }} onClick={() => { setSortBy('date'); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>
                Date {sortBy === 'date' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </span>
              <span style={{ cursor: 'pointer', marginLeft: 'auto' }} onClick={() => { setSortBy('amount'); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>
                Amount {sortBy === 'amount' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </span>
            </div>
            {paginated.map(tx => (
              <div key={tx.id} className="tx-detailed-item" style={selectedIds.has(tx.id) ? { borderColor: 'var(--primary)', background: 'var(--primary-glow)' } : {}}>
                <div className="tx-detailed-left">
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedIds.has(tx.id)}
                      onChange={() => toggleSelect(tx.id)} style={{ accentColor: 'var(--primary)', width: 16, height: 16 }} />
                  </label>
                  <div className={`tx-type-badge ${tx.type}`}>
                    {tx.type === 'expense' ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
                    )}
                  </div>
                  <div className="tx-detailed-info">
                    <span className="tx-detailed-category">{tx.category}</span>
                    <span className="tx-detailed-desc">{tx.description || tx.note || tx.merchant || 'No description'}</span>
                    <span className="tx-detailed-date">
                      {format(parseISO(tx.date), 'MMM d, yyyy')}
                      {tx.time && tx.time !== '00:00' ? ` at ${tx.time}` : ''}
                    </span>
                  </div>
                </div>
                <div className="tx-detailed-right">
                  <span className={`tx-detailed-amount ${tx.type}`}>
                    {tx.type === 'expense' ? '-' : '+'}{formatAmount(tx.amount, tx.currency || currency)}
                  </span>
                  <button className="tx-action-btn danger:hover" onClick={() => deleteTransaction(tx.id)} title="Delete">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                  </button>
                </div>
              </div>
            ))}
            {hasMore && <div ref={sentinelRef} style={{ height: 20 }} />}
            {!hasMore && filtered.length > ITEMS_PER_PAGE && (
              <div style={{ textAlign: 'center', padding: 16, color: 'var(--text-muted)', fontSize: 13 }}>
                Showing all {filtered.length} transactions
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
