import React, { useState, useCallback } from 'react';
import { useStore } from './store/StoreContext';
import Login from './components/auth/Login';
import Onboarding from './components/Onboarding';
import Sidebar from './components/Sidebar';
import TitleBar from './components/TitleBar';
import Dashboard from './components/dashboard/Dashboard';
import Transactions from './components/transactions/Transactions';
import AddTransaction from './components/transactions/AddTransaction';
import Budgets from './components/budgets/Budgets';
import Accounts from './components/accounts/Accounts';
import Categories from './components/categories/Categories';
import Analytics from './components/analytics/Analytics';
import SavingsGoals from './components/savings/SavingsGoals';
import Calendar from './components/calendar/Calendar';
import Reports from './components/reports/Reports';
import Settings from './components/settings/Settings';
import Investments from './components/investments/Investments';
import Crypto from './components/crypto/Crypto';
import RecurringPayments from './components/recurring/RecurringPayments';
import GlobalSearch from './components/search/GlobalSearch';
import ProfileModal from './components/profile/ProfileModal';
import Welcome from './components/welcome/Welcome';
import NetWorth from './components/networth/NetWorth';
import CashFlow from './components/cashflow/CashFlow';
import EmergencyPlanning from './components/emergency/EmergencyPlanning';

export default function App() {
  const { currentUser, loaded, restoring, getUserProfile, logout, version } = useStore();
  React.useEffect(() => { document.title = 'Finora'; }, []);
  const [page, setPage] = useState('dashboard');
  const [showSearch, setShowSearch] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [pageKey, setPageKey] = useState(0);
  const profile = currentUser ? getUserProfile(currentUser.id) : null;

  const handleNavigate = useCallback((p) => {
    setPage(p);
    setPageKey(k => k + 1);
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (currentUser) setShowSearch(true);
      }
      if (e.key === 'Escape') setShowSearch(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentUser]);

  if (!loaded) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        </div>
        <div className="loading-spinner" />
        <p className="loading-text">Loading Finora...</p>
      </div>
    );
  }

  if (restoring) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        </div>
        <div className="loading-spinner" />
        <p className="loading-text">Logging in...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  if (!profile?.setupComplete) {
    return <Onboarding />;
  }

  const renderPage = () => {
    const key = page + '-' + pageKey;
    switch (page) {
      case 'dashboard': return <Dashboard key={key} />;
      case 'transactions': return <Transactions key={key} />;
      case 'add': return <AddTransaction key={key} />;
      case 'budgets': return <Budgets key={key} />;
      case 'accounts': return <Accounts key={key} />;
      case 'categories': return <Categories key={key} />;
      case 'analytics': return <Analytics key={key} />;
      case 'savings': return <SavingsGoals key={key} />;
      case 'calendar': return <Calendar key={key} />;
      case 'reports': return <Reports key={key} />;
      case 'settings': return <Settings key={key} />;
      case 'investments': return <Investments key={key} />;
      case 'crypto': return <Crypto key={key} />;
      case 'recurring': return <RecurringPayments key={key} />;
      case 'welcome': return <Welcome key={key} />;
      case 'networth': return <NetWorth key={key} />;
      case 'cashflow': return <CashFlow key={key} />;
      case 'emergency': return <EmergencyPlanning key={key} />;
      default: return <Dashboard key={key} />;
    }
  };

  return (
    <div className="app-layout">
      <TitleBar
        currentPage={page}
        profile={profile}
        onSearch={() => setShowSearch(true)}
        onOpenProfile={() => setShowProfile(true)}
      />
      <div className="app-body">
        <Sidebar currentPage={page} onNavigate={handleNavigate} />
        <main className="main-content page-enter">
          {renderPage()}
        </main>
      </div>
      {showSearch && <GlobalSearch onClose={() => setShowSearch(false)} onNavigate={(p) => { setShowSearch(false); setPage(p); }} />}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} onNavigateSettings={() => setPage('settings')} />}
    </div>
  );
}
