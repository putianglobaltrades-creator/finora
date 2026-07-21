import React from 'react';
import { useTheme } from '../store/ThemeContext';

export default function TitleBar({ currentPage, profile, onSearch, onOpenProfile }) {
  const { theme, toggleTheme } = useTheme();
  const isMac = navigator.platform?.includes('Mac') || false;

  const handleMinimize = () => window.finora?.minimize();
  const handleMaximize = () => window.finora?.maximize();
  const handleClose = () => window.finora?.close();

  const pageLabels = {
    dashboard: 'Dashboard',
    transactions: 'Transactions',
    add: 'Add Transaction',
    budgets: 'Budgets',
    accounts: 'Accounts',
    categories: 'Categories',
    analytics: 'Analytics',
    savings: 'Savings Goals',
    calendar: 'Calendar',
    reports: 'Reports',
    settings: 'Settings',
    investments: 'Investments',
    recurring: 'Recurring Payments',
  };

  return (
    <div className="titlebar">
      <div className="titlebar-drag">
        <div className="titlebar-logo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          <span>Finora</span>
        </div>
        <div className="titlebar-divider" />
        <span className="titlebar-tagline">{pageLabels[currentPage] || 'Dashboard'}</span>
      </div>

      <div className="titlebar-right">
        <button className="titlebar-search-btn" onClick={onSearch} title="Search (Ctrl+K)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        </button>

        <button className="titlebar-notif-btn" onClick={toggleTheme} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}>
          {theme === 'light' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
          )}
        </button>

        {profile && (
          <div className="titlebar-user" onClick={onOpenProfile} title="Profile">
            <div className="titlebar-avatar">
              {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="titlebar-username">{profile.fullName?.split(' ')[0] || 'User'}</span>
          </div>
        )}
      </div>

      {!isMac && (
        <div className="titlebar-controls">
          <button className="control-btn" onClick={handleMinimize}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /></svg>
          </button>
          <button className="control-btn" onClick={handleMaximize}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /></svg>
          </button>
          <button className="control-btn control-close" onClick={handleClose}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
      )}
    </div>
  );
}
