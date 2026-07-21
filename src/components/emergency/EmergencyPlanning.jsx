import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/StoreContext';

export default function EmergencyPlanning() {
  const { data, currentUser, getUserTransactions, getNetWorth } = useStore();
  const ob = data.openingBalances;
  const transactions = getUserTransactions(currentUser?.id);
  const { totalAssets, totalLiabilities, netWorth } = getNetWorth(currentUser?.id);

  const [goalType, setGoalType] = useState('emergency');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalMonthly, setGoalMonthly] = useState('');

  const monthlyExpenses = useMemo(() => {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const recent = transactions.filter(t => {
      const d = new Date(t.date);
      return d >= sixMonthsAgo && t.type === 'expense';
    });
    const total = recent.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
    return recent.length > 0 ? total / Math.max(1, Math.ceil((now - sixMonthsAgo) / (30 * 24 * 60 * 60 * 1000))) : 0;
  }, [transactions]);

  const liquidSavings = (ob.checking || 0) + (ob.savings || 0);
  const runwayMonths = monthlyExpenses > 0 ? liquidSavings / monthlyExpenses : 0;
  const runwayStatus = runwayMonths >= 6 ? 'strong' : runwayMonths >= 3 ? 'moderate' : 'weak';

  const goalAmount = parseFloat(goalTarget) || 0;
  const goalSavingsPerMonth = parseFloat(goalMonthly) || 0;
  const monthsToGoal = goalSavingsPerMonth > 0 ? Math.ceil(goalAmount / goalSavingsPerMonth) : 0;
  const suggestions = useMemo(() => {
    if (!monthlyExpenses) return [];
    const suggestions = [];
    const targetRunway = 6;
    if (runwayMonths < targetRunway) {
      const needed = (targetRunway * monthlyExpenses) - liquidSavings;
      if (needed > 0) {
        suggestions.push(`Save $${needed.toLocaleString()} more for a ${targetRunway}-month emergency fund`);
        const extraMonthly = monthlyExpenses * 0.1;
        const monthsToCatch = Math.ceil(needed / extraMonthly);
        suggestions.push(`Saving an extra $${extraMonthly.toFixed(0)}/month would reach it in ${monthsToCatch} months`);
      }
    }
    return suggestions;
  }, [monthlyExpenses, liquidSavings, runwayMonths]);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Emergency Planning</h1>
        <p className="page-subtitle">Know your safety net and plan for the future</p>
      </div>

      <div className="emergency-runway">
        <h2>Emergency Savings Runway</h2>
        <p>If you lost your income today, how long could you survive?</p>

        <div className="emergency-runway-card">
          <div className="emergency-runway-value">
            <span className="runway-number" style={{
              color: runwayStatus === 'strong' ? 'var(--success)' : runwayStatus === 'moderate' ? 'var(--warning)' : 'var(--danger)'
            }}>
              {runwayMonths.toFixed(1)}
            </span>
            <span className="runway-unit">months</span>
          </div>
          <div className="runway-bar-container">
            <div className="runway-bar" style={{
              width: `${Math.min(runwayMonths / 12 * 100, 100)}%`,
              background: runwayStatus === 'strong' ? 'var(--success)' : runwayStatus === 'moderate' ? 'var(--warning)' : 'var(--danger)',
            }} />
          </div>
          <div className="runway-details">
            <div className="runway-detail">
              <span>Liquid Savings</span>
              <strong>${liquidSavings.toLocaleString()}</strong>
            </div>
            <div className="runway-detail">
              <span>Monthly Expenses</span>
              <strong>${monthlyExpenses.toFixed(0).toLocaleString()}</strong>
            </div>
            <div className="runway-detail">
              <span>Net Worth</span>
              <strong style={{ color: netWorth >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                ${(netWorth || 0).toLocaleString()}
              </strong>
            </div>
            <div className="runway-detail">
              <span>Status</span>
              <strong style={{
                color: runwayStatus === 'strong' ? 'var(--success)' : runwayStatus === 'moderate' ? 'var(--warning)' : 'var(--danger)'
              }}>
                {runwayStatus === 'strong' ? 'Strong' : runwayStatus === 'moderate' ? 'Moderate' : 'Needs Attention'}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="emergency-suggestions">
          <h3>Suggestions</h3>
          <ul>
            {suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="emergency-goal-planner">
        <h2>Goal Planner</h2>
        <p>Plan for a specific financial goal and see how long it will take.</p>

        <div className="emergency-goal-form">
          <div className="input-group" style={{ flex: 1 }}>
            <label>Goal Type</label>
            <select value={goalType} onChange={e => setGoalType(e.target.value)} className="input-wrapper" style={{ padding: '10px 14px', width: '100%' }}>
              <option value="emergency">Emergency Fund ({liquidSavings > 0 ? `${runwayMonths.toFixed(1)}mo runway` : 'build from $0'})</option>
              <option value="car">Car Purchase</option>
              <option value="trip">Trip / Vacation</option>
              <option value="housing">Housing Down Payment</option>
              <option value="debt">Debt Repayment</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="input-group" style={{ flex: 1 }}>
            <label>Target Amount ($)</label>
            <div className="input-wrapper">
              <input type="number" step="0.01" min="0" placeholder="e.g. 10000" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} />
            </div>
          </div>
          <div className="input-group" style={{ flex: 1 }}>
            <label>Monthly Savings ($)</label>
            <div className="input-wrapper">
              <input type="number" step="0.01" min="0" placeholder="e.g. 500" value={goalMonthly} onChange={e => setGoalMonthly(e.target.value)} />
            </div>
          </div>
        </div>

        {goalAmount > 0 && goalSavingsPerMonth > 0 && (
          <div className="emergency-goal-result">
            <div className="goal-result-card">
              <div className="goal-result-label">Time to Reach Goal</div>
              <div className="goal-result-value" style={{ color: 'var(--primary)' }}>
                {monthsToGoal >= 12 ? `${(monthsToGoal / 12).toFixed(1)} years` : `${monthsToGoal} months`}
              </div>
              <div className="goal-result-desc">
                Saving ${goalSavingsPerMonth.toLocaleString()}/month toward ${goalAmount.toLocaleString()}
              </div>
            </div>
            {monthsToGoal > 0 && goalSavingsPerMonth > 0 && (
              <div className="goal-suggestions">
                <h4>Ways to reach it faster:</h4>
                <ul>
                  <li>Increase monthly savings by 25% → reach it in {Math.ceil(goalAmount / (goalSavingsPerMonth * 1.25))} months</li>
                  <li>Increase monthly savings by 50% → reach it in {Math.ceil(goalAmount / (goalSavingsPerMonth * 1.5))} months</li>
                  <li>A one-time lump sum of ${(goalAmount * 0.2).toFixed(0)} would cut the timeline by {(monthsToGoal * 0.2).toFixed(0)} months</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="emergency-net-worth">
        <h3>Net Worth Overview</h3>
        <div className="networth-mini-cards">
          <div className="stat-card">
            <div className="stat-label">Total Assets</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>${totalAssets.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Liabilities</div>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>${totalLiabilities.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Net Worth</div>
            <div className="stat-value" style={{ color: netWorth >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              ${(netWorth || 0).toLocaleString()}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Liquid % of Assets</div>
            <div className="stat-value" style={{ color: 'var(--primary)' }}>
              {totalAssets > 0 ? ((liquidSavings / totalAssets) * 100).toFixed(1) : '0'}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
