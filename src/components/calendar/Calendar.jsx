import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/StoreContext';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Calendar() {
  const { currentUser, getUserTransactions } = useStore();
  const transactions = getUserTransactions(currentUser?.id);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const monthTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = parseISO(t.date);
      return isSameMonth(d, currentMonth);
    });
  }, [transactions, currentMonth]);

  const getDayTransactions = (day) => {
    return monthTransactions.filter(t => isSameDay(parseISO(t.date), day));
  };

  const startDayOfWeek = getDay(days[0]);

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Calendar</h1>
            <p className="page-subtitle">View transactions by date</p>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 24, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <h3 style={{ fontSize: 18, fontWeight: 600 }}>{format(currentMonth, 'MMMM yyyy')}</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
          {DAYS.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', padding: '8px 0' }}>{d}</div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {days.map(day => {
            const dayTx = getDayTransactions(day);
            const isToday = isSameDay(day, new Date());
            const income = dayTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
            const expense = dayTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
            return (
              <div key={day.toISOString()} style={{
                minHeight: 80, padding: 6, borderRadius: 'var(--radius-sm)',
                background: isToday ? 'var(--primary-glow)' : 'transparent',
                border: isToday ? '1px solid var(--border-color)' : '1px solid transparent',
                transition: 'var(--transition)',
              }}
                onMouseEnter={e => { if (!isToday) e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
                onMouseLeave={e => { if (!isToday) e.currentTarget.style.background = 'transparent'; }}>
                <div style={{ fontSize: 12, fontWeight: isToday ? 700 : 500, color: isToday ? 'var(--primary)' : 'var(--text-secondary)', marginBottom: 4 }}>
                  {format(day, 'd')}
                </div>
                {income > 0 && <div style={{ fontSize: 10, color: 'var(--success)', fontWeight: 600 }}>+${income.toLocaleString()}</div>}
                {expense > 0 && <div style={{ fontSize: 10, color: 'var(--danger)', fontWeight: 600 }}>-${expense.toLocaleString()}</div>}
                {dayTx.length > 0 && (
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{dayTx.length} txns</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {monthTransactions.length > 0 && (
        <div className="glass-card" style={{ padding: 20, marginTop: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>
            Transactions this month
          </h3>
          <div className="tx-list">
            {monthTransactions.slice(-10).reverse().map(tx => (
              <div key={tx.id} className="tx-item">
                <div className={`tx-type-indicator ${tx.type}`} />
                <div className="tx-info">
                  <span className="tx-category">{tx.category}</span>
                  <span className="tx-date">{format(parseISO(tx.date), 'MMM d, yyyy')}</span>
                </div>
                <span className={`tx-amount ${tx.type}`}>
                  {tx.type === 'expense' ? '-' : '+'}${Number(tx.amount).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
