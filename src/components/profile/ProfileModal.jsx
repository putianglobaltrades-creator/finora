import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/StoreContext';

function formatUptime(start) {
  if (!start) return 'Just now';
  const diff = Math.floor((Date.now() - start) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ${diff % 60}s`;
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return `${h}h ${m}m`;
}

export default function ProfileModal({ onClose, onNavigateSettings }) {
  const { currentUser, getUserProfile, data } = useStore();
  const profile = currentUser ? getUserProfile(currentUser.id) : null;
  const [uptime, setUptime] = useState(formatUptime(currentUser?.loginTime));

  useEffect(() => {
    const id = setInterval(() => {
      setUptime(formatUptime(currentUser?.loginTime));
    }, 1000);
    return () => clearInterval(id);
  }, [currentUser?.loginTime]);

  if (!currentUser) return null;

  const joinDate = currentUser.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Unknown';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="profile-modal glass-card" onClick={e => e.stopPropagation()}>
        <button className="profile-modal-close" onClick={onClose}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="profile-modal-header">
          <div className="profile-modal-avatar">
            {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : currentUser.username.charAt(0).toUpperCase()}
          </div>
          <h2>{profile?.fullName || 'User'}</h2>
          <p className="profile-modal-username">@{currentUser.username}</p>
        </div>

        <div className="profile-modal-body">
          <div className="profile-info-row">
            <span className="profile-info-label">Member Since</span>
            <span className="profile-info-value">{joinDate}</span>
          </div>
          <div className="profile-info-row">
            <span className="profile-info-label">Session Time</span>
            <span className="profile-info-value">{uptime}</span>
          </div>
          {profile?.occupation && (
            <div className="profile-info-row">
              <span className="profile-info-label">Occupation</span>
              <span className="profile-info-value">{profile.occupation}</span>
            </div>
          )}
          {profile?.monthlySavingsGoal > 0 && (
            <div className="profile-info-row">
              <span className="profile-info-label">Monthly Savings Goal</span>
              <span className="profile-info-value">${Number(profile.monthlySavingsGoal).toLocaleString()}</span>
            </div>
          )}
          {profile?.currency && (
            <div className="profile-info-row">
              <span className="profile-info-label">Currency</span>
              <span className="profile-info-value">{profile.currency}</span>
            </div>
          )}
          {currentUser?.subscription && (
            <div className="profile-info-row">
              <span className="profile-info-label">License</span>
              <span className="profile-info-value">{currentUser.subscription}{currentUser.expiry && currentUser.subscription !== 'Lifetime' ? ` (${Math.max(0, Math.ceil((new Date(currentUser.expiry) - Date.now()) / 86400000))}d)` : ''}</span>
            </div>
          )}

          <div className="profile-section-divider" />

          <div className="profile-info-row">
            <span className="profile-info-label">Checking</span>
            <span className="profile-info-value">${(data.openingBalances?.checking || 0).toLocaleString()}</span>
          </div>
          <div className="profile-info-row">
            <span className="profile-info-label">Savings</span>
            <span className="profile-info-value">${(data.openingBalances?.savings || 0).toLocaleString()}</span>
          </div>
          <div className="profile-info-row">
            <span className="profile-info-label">Investments</span>
            <span className="profile-info-value">${(data.openingBalances?.investments || 0).toLocaleString()}</span>
          </div>
          <div className="profile-info-row">
            <span className="profile-info-label">Debts</span>
            <span className="profile-info-value" style={{ color: 'var(--danger)' }}>${(data.openingBalances?.debts || 0).toLocaleString()}</span>
          </div>
        </div>

        <div className="profile-modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={() => { onNavigateSettings(); onClose(); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Settings
          </button>
        </div>
      </div>
    </div>
  );
}
