import React, { useState } from 'react';

export default function LicenseScreen({ onActivated }) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleActivate = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await window.finora.keyauth.license(key.trim());
      if (result.success) {
        localStorage.setItem('finora_license', key.trim());
        onActivated(key.trim());
      } else {
        setError(result.error || 'Invalid license key');
      }
    } catch {
      setError('Connection failed. Check your internet.');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        {[...Array(5)].map((_, i) => <div key={i} className="login-bubble" />)}
      </div>
      <div className="login-container">
        <div className="login-header">
          <div className="login-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <h1>Finora</h1>
          <p className="login-subtitle">Activate your license to continue</p>
        </div>

        <form className="login-form" onSubmit={handleActivate}>
          <div className="input-group">
            <label>License Key</label>
            <div className="input-wrapper">
              <input type="text" placeholder="XXXXX-XXXXX-XXXXX-XXXXX" value={key}
                onChange={e => setKey(e.target.value.toUpperCase())} autoFocus />
            </div>
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : 'Activate'}
          </button>
        </form>
      </div>
    </div>
  );
}
