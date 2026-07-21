import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/StoreContext';
import { useToast } from '../ui/Toast';
import { fetchCryptoPrice } from '../../utils/marketPrices';

const INVESTMENT_TYPES = ['Stocks', 'Crypto', 'ETFs', 'Real Estate', 'Bonds', 'Mutual Funds', 'Commodities', 'Other'];
const RISK_LEVELS = ['Low', 'Medium', 'High'];

export default function Investments() {
  const { currentUser, getUserInvestments, addInvestment, deleteInvestment } = useStore();
  const { showToast: toast } = useToast();
  const investments = getUserInvestments(currentUser?.id);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('Stocks');
  const [ticker, setTicker] = useState('');
  const [shares, setShares] = useState('');
  const [amount, setAmount] = useState('');
  const [returnRate, setReturnRate] = useState('');
  const [risk, setRisk] = useState('Medium');
  const [fetchingPrice, setFetchingPrice] = useState(false);

  const totalInvested = investments.reduce((s, i) => s + Number(i.amount || 0), 0);
  const totalValue = investments.reduce((s, i) => {
    if (i.currentPrice && i.shares) return s + (i.currentPrice * i.shares);
    return s + Number(i.amount || 0);
  }, 0);
  const totalGain = totalValue - totalInvested;
  const avgReturn = investments.length > 0
    ? investments.reduce((s, i) => s + Number(i.returnRate || 0), 0) / investments.length
    : 0;

  const handleFetchPrice = async () => {
    if (!ticker) return;
    setFetchingPrice(true);
    const price = await fetchCryptoPrice(ticker);
    if (price) {
      setAmount(String(price));
      toast.success('Price Fetched', `${ticker.toUpperCase()}: $${price}`);
    } else {
      toast.info('Manual Entry', 'Could not fetch price. Enter amount manually.');
    }
    setFetchingPrice(false);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name || !amount) return;
    const sharesNum = parseFloat(shares) || 0;
    addInvestment({
      name,
      type,
      ticker: ticker.toUpperCase(),
      shares: sharesNum,
      amount: parseFloat(amount),
      currentPrice: sharesNum > 0 ? parseFloat(amount) : null,
      returnRate: parseFloat(returnRate) || 0,
      risk,
      lastPriceUpdate: sharesNum > 0 ? new Date().toISOString() : null,
    });
    toast.success('Investment Added', `${name} tracked`);
    setName('');
    setTicker('');
    setShares('');
    setType('Stocks');
    setAmount('');
    setReturnRate('');
    setRisk('Medium');
    setShowForm(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Investments</h1>
            <p className="page-subtitle">{investments.length} investments tracked</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            {showForm ? 'Cancel' : 'Add Investment'}
          </button>
        </div>
      </div>

      {investments.length > 0 && (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card" style={{ borderTop: '3px solid var(--success)' }}>
            <p className="stat-card-title">Total Invested</p>
            <p className="stat-card-value" style={{ color: 'var(--success)' }}>${totalInvested.toLocaleString()}</p>
          </div>
          <div className="stat-card" style={{ borderTop: '3px solid var(--primary)' }}>
            <p className="stat-card-title">Current Value</p>
            <p className="stat-card-value" style={{ color: totalGain >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              ${totalValue.toLocaleString()}
            </p>
          </div>
          <div className="stat-card" style={{ borderTop: '3px solid var(--warning)' }}>
            <p className="stat-card-title">Total Gain / Loss</p>
            <p className="stat-card-value" style={{ color: totalGain >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {totalGain >= 0 ? '+' : ''}${totalGain.toLocaleString()}
            </p>
          </div>
          <div className="stat-card" style={{ borderTop: '3px solid var(--primary)' }}>
            <p className="stat-card-title">Diversification</p>
            <p className="stat-card-value" style={{ color: 'var(--primary)' }}>
              {new Set(investments.map(i => i.type)).size} types
            </p>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAdd} className="glass-card" style={{ padding: 24, marginBottom: 20, animation: 'fadeInUp 0.3s ease-out' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Track Investment</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="input-group">
              <label>Name</label>
              <div className="input-wrapper">
                <input type="text" placeholder="e.g. Apple Inc." value={name} onChange={e => setName(e.target.value)} required />
              </div>
            </div>
            <div className="input-group">
              <label>Ticker</label>
              <div className="input-wrapper" style={{ display: 'flex' }}>
                {type === 'Crypto' ? (
                  <select value={ticker} onChange={e => setTicker(e.target.value)} style={{ flex: 1, padding: '10px 14px', border: 'none', background: 'transparent', fontSize: 14, fontFamily: 'var(--font)', color: 'var(--text)' }}>
                    <option value="">Select crypto...</option>
                    <option value="BTC">BTC - Bitcoin</option>
                    <option value="ETH">ETH - Ethereum</option>
                    <option value="SOL">SOL - Solana</option>
                    <option value="XRP">XRP - Ripple</option>
                    <option value="ADA">ADA - Cardano</option>
                    <option value="DOT">DOT - Polkadot</option>
                    <option value="DOGE">DOGE - Dogecoin</option>
                    <option value="AVAX">AVAX - Avalanche</option>
                    <option value="LINK">LINK - Chainlink</option>
                    <option value="MATIC">MATIC - Polygon</option>
                    <option value="UNI">UNI - Uniswap</option>
                    <option value="ATOM">ATOM - Cosmos</option>
                    <option value="LTC">LTC - Litecoin</option>
                    <option value="BCH">BCH - Bitcoin Cash</option>
                    <option value="TRX">TRX - Tron</option>
                    <option value="SHIB">SHIB - Shiba Inu</option>
                    <option value="NEAR">NEAR - Near Protocol</option>
                    <option value="APE">APE - ApeCoin</option>
                    <option value="SAND">SAND - The Sandbox</option>
                    <option value="MANA">MANA - Decentraland</option>
                  </select>
                ) : (
                  <input type="text" placeholder="e.g. AAPL" value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} style={{ flex: 1 }} />
                )}
                <button type="button" className="btn btn-secondary btn-sm" style={{ marginLeft: 8 }} onClick={handleFetchPrice} disabled={fetchingPrice || !ticker}>
                  {fetchingPrice ? '...' : 'Fetch'}
                </button>
              </div>
            </div>
            <div className="input-group">
              <label>Type</label>
              <div className="input-wrapper">
                <select value={type} onChange={e => setType(e.target.value)}>
                  {INVESTMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="input-group">
              <label>Shares / Quantity</label>
              <div className="input-wrapper">
                <input type="number" step="any" min="0" placeholder="e.g. 10" value={shares} onChange={e => setShares(e.target.value)} />
              </div>
            </div>
            <div className="input-group">
              <label>Price Per Share ($)</label>
              <div className="input-wrapper">
                <span style={{ color: 'var(--text-muted)' }}>$</span>
                <input type="number" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required />
              </div>
            </div>
            <div className="input-group">
              <label>Est. Annual Return (%)</label>
              <div className="input-wrapper">
                <input type="number" step="0.1" placeholder="e.g. 8.5" value={returnRate} onChange={e => setReturnRate(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="input-group" style={{ marginBottom: 16 }}>
            <label>Risk Level</label>
            <div className="category-grid">
              {RISK_LEVELS.map(r => (
                <button key={r} type="button" className={`category-chip ${risk === r ? 'active' : ''}`} onClick={() => setRisk(r)}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" className="btn btn-primary">Add Investment</button>
        </form>
      )}

      {investments.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <h3>No investments tracked</h3>
          <p>Add your investment portfolio to monitor performance. Use the Fetch button to pull live prices for crypto tickers (BTC, ETH, SOL, etc.).</p>
        </div>
      ) : (
        <div className="goals-grid">
          {investments.map(inv => {
            const sharesNum = Number(inv.shares || 0);
            const pricePerShare = Number(inv.currentPrice || 0);
            const currentValue = sharesNum > 0 && pricePerShare > 0 ? sharesNum * pricePerShare : Number(inv.amount || 0);
            const costBasis = Number(inv.amount || 0);
            const gain = currentValue - costBasis;
            const gainPercent = costBasis > 0 ? ((gain / costBasis) * 100).toFixed(1) : null;
            return (
              <div key={inv.id} className="goal-card">
                <div className="goal-header">
                  <div>
                    <div className="goal-title">{inv.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {inv.type}{inv.ticker ? `  ·  ${inv.ticker}` : ''}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 12,
                    background: inv.risk === 'Low' ? 'var(--success-bg)' : inv.risk === 'Medium' ? 'var(--warning-bg)' : 'var(--danger-bg)',
                    color: inv.risk === 'Low' ? 'var(--success)' : inv.risk === 'Medium' ? 'var(--warning)' : 'var(--danger)',
                  }}>
                    {inv.risk}
                  </span>
                </div>
                {sharesNum > 0 && pricePerShare > 0 ? (
                  <>
                    <div className="goal-amount">${currentValue.toLocaleString()}</div>
                    <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                      {sharesNum} shares @ ${pricePerShare.toFixed(2)}
                    </div>
                    <div style={{ marginTop: 4, fontSize: 14, fontWeight: 600, color: gain >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {gain >= 0 ? '+' : ''}${gain.toLocaleString()} ({gainPercent}%)
                    </div>
                  </>
                ) : (
                  <>
                    <div className="goal-amount">${costBasis.toLocaleString()}</div>
                    {inv.returnRate && (
                      <div style={{ marginTop: 8, fontSize: 14, fontWeight: 600, color: Number(inv.returnRate) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {Number(inv.returnRate) >= 0 ? '+' : ''}{inv.returnRate}% est. return
                      </div>
                    )}
                  </>
                )}
                {inv.lastPriceUpdate && (
                  <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                    Updated {new Date(inv.lastPriceUpdate).toLocaleDateString()}
                  </div>
                )}
                <button className="btn btn-secondary btn-sm" style={{ marginTop: 12, width: '100%' }}
                  onClick={() => { deleteInvestment(inv.id); toast.info('Removed', `${inv.name} deleted`); }}>
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
