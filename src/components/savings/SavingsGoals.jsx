import React, { useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { useToast } from '../ui/Toast';
import { format, differenceInDays, parseISO } from 'date-fns';

export default function SavingsGoals() {
  const { currentUser, getUserSavingsGoals, addSavingsGoal, deleteSavingsGoal, updateSavingsGoal } = useStore();
  const { showToast: toast } = useToast();
  const goals = getUserSavingsGoals(currentUser?.id);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [initialAmount, setInitialAmount] = useState('0');
  const [fundModal, setFundModal] = useState(null);
  const [fundClosing, setFundClosing] = useState(false);
  const [fundAmount, setFundAmount] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!title || !target) return;
    const goal = {
      title,
      target: parseFloat(target),
      deadline: deadline || null,
      saved: parseFloat(initialAmount) || 0,
    };
    addSavingsGoal(goal);
    toast.success('Goal Created', `Saving $${parseFloat(target).toLocaleString()} for ${title}`);
    setTitle('');
    setTarget('');
    setDeadline('');
    setInitialAmount('0');
    setShowForm(false);
  };

  const handleDelete = (id, title) => {
    deleteSavingsGoal(id);
    toast.info('Goal Removed', `${title} deleted`);
  };

  const openFundModal = (goal) => {
    setFundModal(goal);
    setFundAmount('');
    setFundClosing(false);
  };

  const closeFundModal = () => {
    setFundClosing(true);
    setTimeout(() => {
      setFundModal(null);
      setFundClosing(false);
    }, 300);
  };

  const submitFund = () => {
    if (!fundModal) return;
    const amt = parseFloat(fundAmount);
    if (!amt || amt <= 0) return;
    updateSavingsGoal(fundModal.id, { saved: fundModal.saved + amt });
    toast.success('Funds Added', `$${amt.toLocaleString()} added to ${fundModal.title}`);
    closeFundModal();
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Savings Goals</h1>
            <p className="page-subtitle">{goals.length} goals &bull; Track your progress</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            {showForm ? 'Cancel' : 'New Goal'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="glass-card" style={{ padding: 24, marginBottom: 20, animation: 'fadeInUp 0.3s ease-out' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Create Savings Goal</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="input-group">
              <label>Goal Title</label>
              <div className="input-wrapper">
                <input type="text" placeholder="e.g. New Car" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>
            </div>
            <div className="input-group">
              <label>Target Amount</label>
              <div className="input-wrapper">
                <span style={{ color: 'var(--text-muted)' }}>$</span>
                <input type="number" step="0.01" min="0" placeholder="0.00" value={target} onChange={e => setTarget(e.target.value)} required />
              </div>
            </div>
            <div className="input-group">
              <label>Target Date</label>
              <div className="input-wrapper">
                <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
              </div>
            </div>
            <div className="input-group">
              <label>Initial Savings</label>
              <div className="input-wrapper">
                <span style={{ color: 'var(--text-muted)' }}>$</span>
                <input type="number" step="0.01" min="0" placeholder="0" value={initialAmount} onChange={e => setInitialAmount(e.target.value)} />
              </div>
            </div>
          </div>
          <button type="submit" className="btn btn-primary">Create Goal</button>
        </form>
      )}

      {goals.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          </svg>
          <h3>No savings goals yet</h3>
          <p>Set your first savings goal and track your progress.</p>
        </div>
      ) : (
        <div className="goals-grid">
          {goals.map(goal => {
            const pct = goal.target > 0 ? Math.min((goal.saved / goal.target) * 100, 100) : 0;
            const daysLeft = goal.deadline ? differenceInDays(parseISO(goal.deadline), new Date()) : null;
            return (
              <div key={goal.id} className="goal-card">
                <div className="goal-header">
                  <div className="goal-title">{goal.title}</div>
                  <button className="tx-action-btn danger:hover" onClick={() => handleDelete(goal.id, goal.title)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                  </button>
                </div>
                <div className="goal-amount">${goal.saved.toLocaleString()} <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)' }}>/ ${goal.target.toLocaleString()}</span></div>
                <div className="goal-progress">
                  <div className="budget-bar-track">
                    <div className={`budget-bar-fill ${pct >= 100 ? 'ok' : pct > 50 ? 'warning' : 'ok'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="goal-info">
                  <span>{pct.toFixed(0)}% complete</span>
                  {daysLeft !== null && (
                    <span className="goal-deadline">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                      {daysLeft > 0 ? `${daysLeft} days left` : 'Past due'}
                    </span>
                  )}
                </div>
                <button className="btn btn-secondary btn-sm" style={{ marginTop: 12, width: '100%' }} onClick={() => openFundModal(goal)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  Add Funds
                </button>
              </div>
            );
          })}
        </div>
      )}

      {fundModal && (
        <div className={`modal-overlay${fundClosing ? ' closing' : ''}`} onClick={closeFundModal}>
          <div className={`modal-glass${fundClosing ? ' closing' : ''}`} onClick={e => e.stopPropagation()} style={{ maxWidth: 400, width: '90%' }}>
            <div className="acm-header">
              <h2>Add Funds</h2>
              <button className="acm-close" onClick={closeFundModal}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="acm-body">
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <div className="goal-amount" style={{ fontSize: 22 }}>${fundModal.saved.toLocaleString()}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>saved of ${fundModal.target.toLocaleString()} for <strong>{fundModal.title}</strong></div>
              </div>
              <div className="input-group">
                <label>Amount to add</label>
                <div className="input-wrapper">
                  <span style={{ color: 'var(--text-muted)' }}>$</span>
                  <input type="number" step="0.01" min="0" placeholder="0.00" value={fundAmount}
                    onChange={e => setFundAmount(e.target.value)} autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') submitFund(); }} />
                </div>
              </div>
              <div className="input-group">
                <label>Source (optional)</label>
                <div className="input-wrapper">
                  <input type="text" placeholder="e.g. Paycheck, Gift, etc." />
                </div>
              </div>
              <button className="btn btn-primary" onClick={submitFund} style={{ width: '100%', marginTop: 10 }}>
                Add ${parseFloat(fundAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
