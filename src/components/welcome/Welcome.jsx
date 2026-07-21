import React from 'react';
import { useStore } from '../../store/StoreContext';

export default function Welcome() {
  const { getNetWorth, getUserBudgets, getUserAccounts, currentUser } = useStore();
  const { totalAssets, totalLiabilities, netWorth } = getNetWorth(currentUser?.id);
  const budgets = getUserBudgets(currentUser?.id);
  const accounts = getUserAccounts(currentUser?.id);

  const steps = [
    { icon: 'M12 5v14M5 12h14', title: '1. Enter Your Opening Balances', desc: 'Start by entering what you have in checking, savings, investments, and debts. This establishes your starting net worth.' },
    { icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', title: '2. Set Up Your Accounts', desc: 'Add all your financial accounts — bank accounts, credit cards, investment accounts, loans. Keep everything in one place.' },
    { icon: 'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z', title: '3. Create Your Monthly Budget', desc: 'Set budgets for each expense category. The app will show what percentage of your income goes where.' },
    { icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', title: '4. Log Your Transactions', desc: 'Record what you earn and spend. Each transaction updates your budget, cash flow, and net worth automatically.' },
    { icon: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3', title: '5. Track Your Cash Flow', desc: 'Use the Cash Flow tab to see your monthly beginning/ending cash position. Know where you stand every month.' },
    { icon: 'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z', title: '6. Monitor Your Net Worth', desc: 'Your net worth updates automatically as you add transactions. Watch it grow over time in the Net Worth tab.' },
    { icon: 'M9 12l2 2 4-4 M7.5 7.5A7.5 7.5 0 1 0 12 4.5', title: '7. Plan for Emergencies', desc: 'Use the Emergency Planning tab to see how long your savings would last and plan for future goals.' },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Welcome to Finora</h1>
        <p className="page-subtitle">Your complete financial command center</p>
      </div>

      <div className="welcome-summary-cards">
        <div className="stat-card welcome-stat">
          <div className="stat-label">Net Worth</div>
          <div className="stat-value" style={{ color: netWorth >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            ${(netWorth || 0).toLocaleString()}
          </div>
        </div>
        <div className="stat-card welcome-stat">
          <div className="stat-label">Total Assets</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>${(totalAssets || 0).toLocaleString()}</div>
        </div>
        <div className="stat-card welcome-stat">
          <div className="stat-label">Total Liabilities</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>${(totalLiabilities || 0).toLocaleString()}</div>
        </div>
        <div className="stat-card welcome-stat">
          <div className="stat-label">Active Budgets</div>
          <div className="stat-value" style={{ color: 'var(--primary)' }}>{budgets.length}</div>
        </div>
        <div className="stat-card welcome-stat">
          <div className="stat-label">Accounts</div>
          <div className="stat-value" style={{ color: 'var(--secondary)' }}>{accounts.length}</div>
        </div>
      </div>

      <div className="welcome-guide">
        <h2>Getting Started Guide</h2>
        <div className="welcome-steps">
          {steps.map((s, i) => (
            <div className="welcome-step-card" key={i}>
              <div className="welcome-step-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={s.icon} />
                </svg>
              </div>
              <div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
