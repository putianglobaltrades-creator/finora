import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../../store/StoreContext';
import CryptoChart from './CryptoChart';
import AddCryptoModal from './AddCryptoModal';

export default function Crypto() {
  const { currentUser, getUserCrypto, addCrypto, deleteCrypto, updateCryptoPrice } = useStore();
  const holdings = getUserCrypto(currentUser?.id);
  const [showModal, setShowModal] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [livePrices, setLivePrices] = useState({});
  const [selectedHolding, setSelectedHolding] = useState(null);

  useEffect(() => {
    if (!holdings.length) return;
    const ids = [...new Set(holdings.map(h => h.coinId))].join(',');
    const fetchPrices = async () => {
      try {
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
        if (res.ok) {
          const d = await res.json();
          setLivePrices(prev => ({ ...prev, ...d }));
          for (const h of holdings) {
            const pd = d[h.coinId];
            if (pd) updateCryptoPrice(h.id, pd.usd, pd.usd_24h_change);
          }
        }
      } catch {}
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, [holdings.length]);

  const handleAdd = useCallback(async (holding) => {
    await addCrypto(holding);
    setShowModal(false);
  }, [addCrypto]);

  const openModal = useCallback(() => {
    setModalKey(k => k + 1);
    setShowModal(true);
  }, []);

  const totalValue = holdings.reduce((s, h) => {
    const price = livePrices[h.coinId]?.usd || h.currentPrice || 0;
    return s + price * h.amount;
  }, 0);
  const totalCost = holdings.reduce((s, h) => s + h.buyPrice * h.amount, 0);
  const totalPnL = totalValue - totalCost;
  const pnlPct = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

  const chartHolding = selectedHolding || (holdings.length ? holdings[0] : null);
  const chartPrice = chartHolding ? (livePrices[chartHolding.coinId]?.usd || chartHolding.currentPrice || 0) : 0;
  const chartChange = chartHolding ? (livePrices[chartHolding.coinId]?.usd_24h_change || chartHolding.change24h || 0) : 0;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Crypto</h1>
          <p className="page-subtitle">Real-time cryptocurrency portfolio tracker</p>
        </div>
      </div>

      {holdings.length > 0 && chartHolding && (
        <CryptoChart key={chartHolding.id} coinId={chartHolding.coinId} currentPrice={chartPrice} change24h={chartChange} />
      )}

      {!showModal && holdings.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h3>No crypto holdings yet</h3>
          <p>Track your cryptocurrency portfolio with live price updates.</p>
          <button className="btn btn-primary" onClick={openModal}>Add Your First Crypto</button>
        </div>
      )}

      {!showModal && holdings.length > 0 && (
        <>
          <div className="crypto-analytics">
            <div className="crypto-analytics-card crypto-ac-value">
              <div className="crypto-ac-label">Portfolio Value</div>
              <div className="crypto-ac-number">${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              <div className={`crypto-ac-change ${totalPnL >= 0 ? 'up' : 'down'}`}>
                {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="crypto-analytics-card crypto-ac-holdings">
              <div className="crypto-ac-label">Holdings</div>
              <div className="crypto-ac-number">{holdings.length}</div>
              <div className="crypto-ac-change">{holdings.reduce((s, h) => s + h.amount, 0).toFixed(4)} total coins</div>
            </div>
            <div className="crypto-analytics-card crypto-ac-total-cost">
              <div className="crypto-ac-label">Total Invested</div>
              <div className="crypto-ac-number">${totalCost.toLocaleString('en-US', { minimumFractionDigits: 0 })}</div>
              <div className="crypto-ac-change">Avg return {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%</div>
            </div>
          </div>

          <div className="crypto-grid">
            {holdings.map(h => {
              const price = livePrices[h.coinId]?.usd || h.currentPrice || 0;
              const change24h = livePrices[h.coinId]?.usd_24h_change || h.change24h || 0;
              const value = price * h.amount;
              const cost = h.buyPrice * h.amount;
              const pnl = value - cost;
              const pnlPctH = cost > 0 ? (pnl / cost) * 100 : 0;
              return (
                <div key={h.id} className={`crypto-card ${selectedHolding?.id === h.id ? 'active' : ''}`} onClick={() => setSelectedHolding(h)}>
                  <div className="crypto-card-top">
                    <div className="crypto-coin-info">
                      <span className="crypto-symbol">{h.symbol}</span>
                      <span className="crypto-name">{h.coinName}</span>
                    </div>
                    <button className="btn-icon crypto-delete" onClick={e => { e.stopPropagation(); deleteCrypto(h.id); }} title="Remove">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                  <div className="crypto-amount">{h.amount} {h.symbol}</div>
                  <div className="crypto-card-row">
                    <span className="crypto-label">Price</span>
                    <span className="crypto-value">${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
                  </div>
                  <div className="crypto-card-row">
                    <span className="crypto-label">Value</span>
                    <span className="crypto-value">${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="crypto-card-row">
                    <span className="crypto-label">24h</span>
                    <span className={`crypto-value ${change24h >= 0 ? 'positive' : 'negative'}`}>
                      {change24h >= 0 ? '+' : ''}{change24h?.toFixed(2) || '0.00'}%
                    </span>
                  </div>
                  <div className="crypto-card-row">
                    <span className="crypto-label">P&amp;L</span>
                    <span className={`crypto-value ${pnl >= 0 ? 'positive' : 'negative'}`}>
                      {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} ({pnlPctH >= 0 ? '+' : ''}{pnlPctH.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="crypto-card-row crypto-last">
                    <span className="crypto-label">Buy</span>
                    <span className="crypto-value">${h.buyPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="crypto-actions">
            <button className="btn btn-primary" onClick={openModal}>+ Add Crypto</button>
          </div>
        </>
      )}

      {showModal && (
        <AddCryptoModal key={modalKey} onClose={() => setShowModal(false)} onAdd={handleAdd} />
      )}
    </div>
  );
}
