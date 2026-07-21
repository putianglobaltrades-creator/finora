import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Application Error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          background: '#F8FAFC',
          fontFamily: "'Inter', sans-serif",
          color: '#0F172A',
        }}>
          <div style={{
            width: 56, height: 56,
            background: 'linear-gradient(135deg, #4F8CFF, #67E8F9)',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ color: '#64748B', marginBottom: 24, textAlign: 'center', maxWidth: 400 }}>
            Finora encountered an unexpected error. Please restart the application.
          </p>
          <button onClick={() => window.location.reload()}
            style={{
              padding: '10px 24px',
              background: 'linear-gradient(135deg, #4F8CFF, #3A6FD6)',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
            }}>
            Restart Application
          </button>
          {this.state.error && (
            <details style={{ marginTop: 24, maxWidth: 500, color: '#94A3B8', fontSize: 12 }}>
              <summary style={{ cursor: 'pointer', fontWeight: 500 }}>Error Details</summary>
              <pre style={{ marginTop: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
