import React from 'react';
import { useStore } from '../../store/StoreContext';

export default function NetWorth() {
  const { data, getNetWorth, currentUser, getUserTransactions, getUserNetWorthHistory } = useStore();
  const { totalAssets, totalLiabilities, netWorth } = getNetWorth(currentUser?.id);
  const ob = data.openingBalances;
  const transactions = getUserTransactions(currentUser?.id);
  const history = getUserNetWorthHistory(currentUser?.id);

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);

  const currentAssets = (ob.checking || 0) + (ob.savings || 0) + (ob.investments || 0) + totalIncome - totalExpenses;
  const currentLiabilities = ob.debts || 0;
  const currentNetWorth = currentAssets - currentLiabilities;

  const sections = [
    {
      label: 'Assets',
      items: [
        { name: 'Checking Account', value: ob.checking || 0 },
        { name: 'Savings Account', value: ob.savings || 0 },
        { name: 'Investments', value: ob.investments || 0 },
        { name: 'Total Income Earned', value: totalIncome },
      ],
      total: currentAssets,
      color: 'var(--success)',
    },
    {
      label: 'Liabilities',
      items: [
        { name: 'Debts', value: ob.debts || 0 },
        { name: 'Total Expenses', value: totalExpenses },
      ],
      total: currentLiabilities,
      color: 'var(--danger)',
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Net Worth Statement</h1>
        <p className="page-subtitle">Your financial snapshot — updates automatically</p>
      </div>

      <div className="networth-summary">
        <div className="networth-main-card">
          <div className="networth-main-label">Current Net Worth</div>
          <div className="networth-main-value" style={{ color: currentNetWorth >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            ${(currentNetWorth || 0).toLocaleString()}
          </div>
          <div className="networth-change">
            {netWorth !== 0 && (
              <span>Started at ${(netWorth || 0).toLocaleString()}</span>
            )}
          </div>
        </div>
      </div>

      <div className="networth-breakdown">
        {sections.map(section => (
          <div className="networth-section" key={section.label}>
            <h3 style={{ color: section.color, marginBottom: 16 }}>{section.label}</h3>
            <div className="networth-items">
              {section.items.filter(i => i.value > 0).map(item => (
                <div className="networth-item" key={item.name}>
                  <span className="networth-item-name">{item.name}</span>
                  <span className="networth-item-value" style={{ color: section.color }}>
                    ${item.value.toLocaleString()}
                  </span>
                </div>
              ))}
              {section.items.filter(i => i.value > 0).length === 0 && (
                <div className="networth-empty">No {section.label.toLowerCase()} recorded yet</div>
              )}
            </div>
            <div className="networth-section-total">
              <span>Total {section.label}</span>
              <span style={{ color: section.color, fontWeight: 700 }}>${section.total.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="networth-ratio">
        <div className="networth-ratio-card">
          <div className="networth-ratio-label">Debt-to-Asset Ratio</div>
          <div className="networth-ratio-value" style={{ color: currentAssets > 0 && (currentLiabilities / currentAssets) > 0.4 ? 'var(--danger)' : 'var(--success)' }}>
            {currentAssets > 0 ? ((currentLiabilities / currentAssets) * 100).toFixed(1) : '0.0'}%
          </div>
          <div className="networth-ratio-desc">
            {currentAssets > 0 && currentLiabilities / currentAssets > 0.4
              ? 'Your debts are high relative to your assets'
              : 'Healthy debt-to-asset ratio'}
          </div>
        </div>
        <div className="networth-ratio-card">
          <div className="networth-ratio-label">Net Worth Growth</div>
          <div className="networth-ratio-value" style={{ color: 'var(--primary)' }}>
            {history.length > 1 ? `${history.length} snapshots` : 'Tracking...'}
          </div>
          <div className="networth-ratio-desc">
            {history.length === 0 ? 'Snapshots are taken each month' : `${history.length} months of data`}
          </div>
        </div>
      </div>

      {history.length > 0 && (
        <div className="networth-history">
          <h3>Net Worth History</h3>
          <div className="networth-history-list">
            {history.sort((a, b) => b.year - a.year || b.month - a.month).slice(0, 12).map(h => (
              <div className="networth-history-item" key={h.id}>
                <span>{['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][h.month - 1]} {h.year}</span>
                <span style={{ color: h.netWorth >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                  ${(h.netWorth || 0).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
