import React, { useState } from 'react';
import { useStore } from '../../store/StoreContext';
import AnimatedShowcase from './AnimatedShowcase';

export default function Login() {
  const { login, register } = useStore();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [email, setEmail] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isRegister) {
      if (!username || !password || !confirm || !licenseKey) {
        setError('Fill in all fields'); setLoading(false); return;
      }
      if (password !== confirm) { setError('Passwords do not match'); setLoading(false); return; }
      const r = await register(username, password, email, licenseKey);
      if (!r.success) { setError(r.error || 'Registration failed'); setLoading(false); return; }
    } else {
      if (!username || !password) { setError('Enter username and password'); setLoading(false); return; }
      const r = await login(username, password);
      if (!r.success) { setError(r.error || 'Invalid credentials'); setLoading(false); return; }
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-panel">
        <div className="login-brand">
          <div className="login-icon-lg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <h1 className="login-title">Finora</h1>
          <p className="login-desc">Take control of your finances</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Username</label>
            <div className="input-wrapper">
              <input type="text" placeholder="Enter username" value={username} onChange={e => setUsername(e.target.value)} autoFocus />
            </div>
          </div>

          {!isRegister && (
            <div className="input-group">
              <label>Password</label>
              <div className="input-wrapper">
                <input type="password" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
            </div>
          )}

          {isRegister && (
            <>
              <div className="input-group">
                <label>Email</label>
                <div className="input-wrapper">
                  <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>
              <div className="input-group">
                <label>Password</label>
                <div className="input-wrapper">
                  <input type="password" placeholder="Create a password" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
              </div>
              <div className="input-group">
                <label>Confirm Password</label>
                <div className="input-wrapper">
                  <input type="password" placeholder="Confirm password" value={confirm} onChange={e => setConfirm(e.target.value)} />
                </div>
              </div>
              <div className="input-group">
                <label>License Key</label>
                <div className="input-wrapper">
                  <input type="text" placeholder="Your license key" value={licenseKey} onChange={e => setLicenseKey(e.target.value.toUpperCase())} />
                </div>
              </div>
            </>
          )}

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : (isRegister ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div className="login-switch">
          <p>
            {isRegister ? 'Already have an account?' : "Don't have an account?"}
            &nbsp;
            <button className="link-btn" onClick={() => { setIsRegister(!isRegister); setError(''); }}>
              {isRegister ? 'Sign In' : 'Register'}
            </button>
          </p>
        </div>

        <span className="login-version-badge">v4.3.0</span>
      </div>

      <div className="login-visual">
        <AnimatedShowcase />
      </div>
    </div>
  );
}
