import React, { useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { useTheme } from '../../store/ThemeContext';
import { useToast } from '../ui/Toast';

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
];

export default function Settings() {
  const { data, updateSettings, updateProfile, currentUser, getUserProfile, backupData, restoreData, version, logout } = useStore();
  const { theme, toggleTheme } = useTheme();
  const { showToast: toast } = useToast();
  const settings = data.settings || {};
  const profile = currentUser ? getUserProfile(currentUser.id) : null;
  const [email, setEmail] = useState(profile?.email || '');

  const handleCurrencyChange = (code) => {
    updateSettings({ currency: code });
    toast.success('Settings Updated', `Currency changed to ${code}`);
  };

  const handleToggle = (key) => {
    updateSettings({ [key]: !settings[key] });
  };

  const handleBackup = async () => {
    const result = await backupData();
    if (result) toast.success('Backup Created', 'Data exported successfully');
  };

  const handleRestore = async () => {
    const result = await restoreData();
    if (result?.success) {
      toast.success('Backup Restored', 'Data has been restored. Reloading...');
      setTimeout(() => window.location.reload(), 1000);
    } else if (result?.error) {
      toast.error('Restore Failed', result.error);
    }
  };

  return (
    <div className="page" style={{ maxWidth: 720 }}>
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p className="page-subtitle">Customize your experience</p>
        </div>
      </div>

      <div className="settings-section">
        <h3>Appearance</h3>
        <div className="settings-row">
          <div className="settings-label">
            <span>Theme</span>
            <small>Switch between light and dark mode</small>
          </div>
          <div className="settings-value">
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', marginRight: 8 }}>
              {theme === 'light' ? 'Light' : 'Dark'}
            </span>
            <button className={`toggle ${theme === 'dark' ? 'active' : ''}`} onClick={toggleTheme}>
              <div className="toggle-knob" />
            </button>
          </div>
        </div>
        <div className="settings-row">
          <div className="settings-label">
            <span>Animations</span>
            <small>Enable UI animations and transitions</small>
          </div>
          <div className="settings-value">
            <button className={`toggle ${settings.animations !== false ? 'active' : ''}`} onClick={() => handleToggle('animations')}>
              <div className="toggle-knob" />
            </button>
          </div>
        </div>
        <div className="settings-row">
          <div className="settings-label">
            <span>Include Investments in Net Worth</span>
            <small>Add portfolio value to dashboard net worth calculation</small>
          </div>
          <div className="settings-value">
            <button className={`toggle ${settings.includeInvestmentsInNetWorth !== false ? 'active' : ''}`} onClick={() => handleToggle('includeInvestmentsInNetWorth')}>
              <div className="toggle-knob" />
            </button>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>Regional</h3>
        <div className="settings-row">
          <div className="settings-label">
            <span>Currency</span>
            <small>Default currency for all transactions</small>
          </div>
          <div className="settings-value">
            <div className="input-wrapper" style={{ width: 200 }}>
              <select value={settings.currency || 'USD'} onChange={e => handleCurrencyChange(e.target.value)}>
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.symbol} {c.code} - {c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="settings-row">
          <div className="settings-label">
            <span>Language</span>
            <small>Interface language</small>
          </div>
          <div className="settings-value">
            <div className="input-wrapper" style={{ width: 200 }}>
              <select value={settings.language || 'en'} onChange={e => updateSettings({ language: e.target.value })}>
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="pt">Português</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>Notifications</h3>
        <div className="settings-row">
          <div className="settings-label">
            <span>Push Notifications</span>
            <small>Receive alerts for bill reminders and budget warnings</small>
          </div>
          <div className="settings-value">
            <button className={`toggle ${settings.notifications !== false ? 'active' : ''}`} onClick={() => handleToggle('notifications')}>
              <div className="toggle-knob" />
            </button>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>Data Management</h3>
        <div className="settings-row">
          <div className="settings-label">
            <span>Backup Data</span>
            <small>Export all your data as a JSON backup file</small>
          </div>
          <div className="settings-value">
            <button className="btn btn-secondary btn-sm" onClick={handleBackup}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Backup
            </button>
          </div>
        </div>
        <div className="settings-row">
          <div className="settings-label">
            <span>Restore Data</span>
            <small>Restore your data from a backup file</small>
          </div>
          <div className="settings-value">
            <button className="btn btn-secondary btn-sm" onClick={handleRestore}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
              Restore
            </button>
          </div>
        </div>
        <div className="settings-row">
          <div className="settings-label">
            <span>Cloud Sync</span>
            <small>Synchronize across devices (coming soon)</small>
          </div>
          <div className="settings-value">
            <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '3px 10px', borderRadius: 12, fontWeight: 500 }}>
              Coming Soon
            </span>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>About</h3>
        <div className="settings-row">
          <div className="settings-label">
            <span>Finora</span>
            <small>Version {version || '1.0'}</small>
          </div>
          <div className="settings-value" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Personal Finance Manager
          </div>
        </div>
        <div className="settings-row">
          <div className="settings-label">
            <span>Data Location</span>
            <small>Your data is stored locally</small>
          </div>
          <div className="settings-value">
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Local Storage</span>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>Account</h3>
        <div className="settings-row">
          <div className="settings-label">
            <span>Recovery Email</span>
            <small>Used for account recovery and important notifications</small>
          </div>
          <div className="settings-value">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div className="input-wrapper" style={{ width: 220 }}>
                <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => {
                const existing = currentUser ? getUserProfile(currentUser.id) || {} : {};
                updateProfile({ ...existing, email });
                toast.success('Settings Updated', 'Recovery email saved');
              }}>Save</button>
            </div>
          </div>
        </div>
        <div className="settings-row">
          <div className="settings-label">
            <span>Sign Out</span>
            <small>Log out of your Finora account</small>
          </div>
          <div className="settings-value">
            <button className="btn btn-danger btn-sm" onClick={() => { logout(); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
