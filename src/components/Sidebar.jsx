import React from 'react';

const navSections = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
      { id: 'analytics', label: 'Analytics', icon: 'M18 20V10 M12 20V4 M6 20v-6' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { id: 'transactions', label: 'Transactions', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6' },
      { id: 'add', label: 'Add Transaction', icon: 'M12 5v14M5 12h14' },
      { id: 'budgets', label: 'Budgets', icon: 'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2' },
      { id: 'accounts', label: 'Accounts', icon: 'M1 4h22v16H1z M1 10h22' },
      { id: 'cashflow', label: 'Cash Flow', icon: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3' },
      { id: 'networth', label: 'Net Worth', icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
      { id: 'crypto', label: 'Crypto', icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
    ],
  },
  {
    label: 'Planning',
    items: [
      { id: 'categories', label: 'Categories', icon: 'M4 6h16M4 12h16M4 18h16' },
      { id: 'savings', label: 'Savings Goals', icon: 'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z' },
      { id: 'investments', label: 'Investments', icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
      { id: 'recurring', label: 'Recurring', icon: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z' },
      { id: 'emergency', label: 'Emergency', icon: 'M12 9v2m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { id: 'welcome', label: 'Welcome', icon: 'M5 13l4 4L19 7' },
      { id: 'calendar', label: 'Calendar', icon: 'M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z M16 2v4 M8 2v4 M3 10h18' },
      { id: 'reports', label: 'Reports', icon: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3' },
      { id: 'settings', label: 'Settings', icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' },
    ],
  },
];

export default function Sidebar({ currentPage, onNavigate }) {
  return (
    <nav className="sidebar">
      <div className="sidebar-nav">
        {navSections.map((section, si) => (
          <React.Fragment key={si}>
            <div className="nav-section-label">{section.label}</div>
            {section.items.map(item => (
              <button
                key={item.id}
                className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={item.icon} />
                </svg>
                <span>{item.label}</span>
              </button>
            ))}
          </React.Fragment>
        ))}
      </div>
      <div className="sidebar-footer">
        <div className="sidebar-brand">Finora</div>
        <div className="sidebar-version">Version 4.2.8</div>
      </div>
    </nav>
  );
}
