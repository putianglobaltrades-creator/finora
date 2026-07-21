import React, { useState, useCallback } from 'react';
import { useStore } from '../store/StoreContext';

const BALANCE_FIELDS = [
  { key: 'checking', label: 'Checking Account', desc: 'What\'s in your checking account right now?' },
  { key: 'savings', label: 'Savings Account', desc: 'What\'s in your savings account?' },
  { key: 'investments', label: 'Investments', desc: 'Total value of stocks, bonds, ETFs, etc.' },
  { key: 'debts', label: 'Debts', desc: 'Credit cards, loans, mortgages — total owed' },
];

function camelToSnake(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.replace(/[A-Z]/g, l => '_' + l.toLowerCase()), v]));
}

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

const STEPS = [
  {
    title: 'Welcome to Finora',
    description: 'Set up your account in just a few steps and start tracking your financial journey.',
    icon: 'M12 5v14M5 12h14',
  },
  {
    title: 'Tell us about yourself',
    description: "We'll personalize your experience.",
    fields: ['fullName', 'occupation'],
  },
  {
    title: 'Choose your currency',
    description: 'This will be your default currency for all transactions.',
    fields: ['currency'],
  },
  {
    title: 'Set a monthly savings goal',
    description: 'Optional — you can change this anytime.',
    fields: ['monthlySavingsGoal'],
  },
  {
    title: 'Enter your opening balances',
    description: 'What do you have in your accounts right now?',
    fields: ['checking', 'savings', 'investments', 'debts'],
  },
  {
    title: 'You\'re all set!',
    description: 'Start tracking your finances with Finora.',
    icon: 'M9 12l2 2 4-4 M7.5 7.5A7.5 7.5 0 1 0 12 4.5',
  },
];

export default function Onboarding() {
  const { currentUser, updateProfile, getUserProfile, updateOpeningBalances, updateSettings, applyData, data } = useStore();
  const existingProfile = getUserProfile(currentUser?.id);
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    fullName: existingProfile?.fullName || '',
    occupation: existingProfile?.occupation || '',
    currency: existingProfile?.currency || 'USD',
    currencySymbol: existingProfile?.currencySymbol || '$',
    monthlySavingsGoal: existingProfile?.monthlySavingsGoal || 0,
  });
  const [balances, setBalances] = useState({ ...data.openingBalances });
  const [slideClass, setSlideClass] = useState('');

  const updateField = useCallback((field, value) => {
    setProfile(prev => {
      if (field === 'currency') {
        const cur = CURRENCIES.find(c => c.code === value);
        return { ...prev, currency: value, currencySymbol: cur?.symbol || '$' };
      }
      if (field === 'monthlySavingsGoal') {
        return { ...prev, monthlySavingsGoal: parseFloat(value) || 0 };
      }
      return { ...prev, [field]: value };
    });
  }, []);

  const handleBack = () => {
    if (step <= 0) return;
    setSlideClass('slide-out');
    setTimeout(() => {
      setStep(s => s - 1);
      setSlideClass('slide-in');
      setTimeout(() => setSlideClass(''), 300);
    }, 200);
  };

  const handleNext = async () => {
    if (step === STEPS.length - 1) {
      const uid = currentUser?.id || 'local';
      const merged = {
        ...data,
        openingBalances: { ...data.openingBalances, ...balances },
        profiles: { ...data.profiles, [uid]: { ...profile, setupComplete: true, userId: uid } },
        settings: { ...data.settings, currency: profile.currency },
      };
      applyData(merged);
      if (uid && window.finora?.supabase) {
        const { currencySymbol, ...profileData } = profile;
        await Promise.allSettled([
          window.finora.supabase.upsertBalances(uid, merged.openingBalances),
          window.finora.supabase.upsertProfile(camelToSnake({ id: uid, ...profileData, setupComplete: true })),
          window.finora.supabase.upsertSettings(uid, camelToSnake({ currency: profile.currency })),
        ]);
      }
      return;
    }
    setSlideClass('slide-out');
    setTimeout(() => {
      setStep(s => s + 1);
      setSlideClass('slide-in');
      setTimeout(() => setSlideClass(''), 300);
    }, 200);
  };

  const handleSkip = async () => {
    const uid = currentUser?.id || 'local';
    const merged = { ...data, profiles: { ...data.profiles, [uid]: { setupComplete: true, userId: uid } } };
    applyData(merged);
    if (uid && window.finora?.supabase) {
      await window.finora.supabase.upsertProfile(camelToSnake({ id: uid, setupComplete: true }));
    }
  };

  const progress = ((step + 1) / STEPS.length) * 100;
  const currentStep = STEPS[step];

  return (
    <div className="onboarding-page">
      <div className="onboarding-bg" />
      <div className={`onboarding-container ${slideClass}`}>
        <div className="onboarding-progress">
          <div className="onboarding-progress-bar">
            <div className="onboarding-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="onboarding-step-counter">{step + 1} / {STEPS.length}</span>
        </div>

        <div className="onboarding-content">
          <div className="onboarding-header">
            {currentStep.icon && (
              <div className="onboarding-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d={currentStep.icon} />
                </svg>
              </div>
            )}
            <h2>{currentStep.title}</h2>
            <p>{currentStep.description}</p>
          </div>

          <div className="onboarding-step">
            {step === 0 && (
              <div className="onboarding-features">
                <div className="ob-feature"><div className="ob-feat-icon" style={{ background: 'rgba(79,140,255,0.12)', color: '#4F8CFF' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" /></svg></div><div><strong>Track Everything</strong><p>Monitor income, expenses, budgets, and savings in one place.</p></div></div>
                <div className="ob-feature"><div className="ob-feat-icon" style={{ background: 'rgba(52,211,153,0.12)', color: '#34D399' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg></div><div><strong>Secure Sync</strong><p>All your data encrypted and synced across devices automatically.</p></div></div>
                <div className="ob-feature"><div className="ob-feat-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg></div><div><strong>Smart Insights</strong><p>Visualize trends and get actionable financial recommendations.</p></div></div>
                <div className="ob-feature"><div className="ob-feat-icon" style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg></div><div><strong>Multi-Account</strong><p>Connect checking, savings, investments, and crypto all at once.</p></div></div>
              </div>
            )}
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="input-group">
                  <label>Full Name</label>
                  <div className="input-wrapper">
                    <input type="text" placeholder="e.g. John Doe" value={profile.fullName}
                      onChange={e => updateField('fullName', e.target.value)} />
                  </div>
                </div>
                <div className="input-group">
                  <label>Occupation</label>
                  <div className="input-wrapper">
                    <input type="text" placeholder="e.g. Software Engineer" value={profile.occupation}
                      onChange={e => updateField('occupation', e.target.value)} />
                  </div>
                  <p className="input-hint">Used for personalization</p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="currency-grid">
                {CURRENCIES.map(c => (
                  <button key={c.code} className={`currency-option ${profile.currency === c.code ? 'active' : ''}`}
                    onClick={() => updateField('currency', c.code)}>
                    <span className="currency-symbol-big">{c.symbol}</span>
                    <div>
                      <div className="currency-code">{c.code}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="input-group">
                <label>Monthly Savings Goal</label>
                <div className="input-wrapper amount-input">
                  <span className="currency-symbol" style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: 18 }}>
                    {profile.currencySymbol}
                  </span>
                  <input type="number" step="0.01" min="0" placeholder="0.00"
                    value={profile.monthlySavingsGoal || ''}
                    onChange={e => updateField('monthlySavingsGoal', e.target.value)} />
                </div>
                <p className="input-hint">How much would you like to save each month?</p>
              </div>
            )}

            {step === 4 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {BALANCE_FIELDS.map(f => (
                  <div className="input-group" key={f.key}>
                    <label>{f.label}</label>
                    <p className="input-hint" style={{ marginTop: -4, marginBottom: 4 }}>{f.desc}</p>
                    <div className="input-wrapper amount-input">
                      <span className="currency-symbol" style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: 18 }}>
                        {profile.currencySymbol}
                      </span>
                      <input type="number" step="0.01" min="0" placeholder="0.00"
                        value={balances[f.key] || ''}
                        onChange={e => setBalances(prev => ({ ...prev, [f.key]: parseFloat(e.target.value) || 0 }))} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {step === 5 && (
              <div className="done-summary" style={{ margin: '0 auto' }}>
                <div className="done-item"><span>Name</span><strong>{profile.fullName || 'Not set'}</strong></div>
                <div className="done-item"><span>Occupation</span><strong>{profile.occupation || 'Not set'}</strong></div>
                <div className="done-item"><span>Currency</span><strong>{profile.currency} ({profile.currencySymbol})</strong></div>
                <div className="done-item"><span>Savings Goal</span><strong>{profile.currencySymbol}{profile.monthlySavingsGoal?.toLocaleString() || 0}/mo</strong></div>
                <div className="done-item"><span>Checking</span><strong>{profile.currencySymbol}{(balances.checking || 0).toLocaleString()}</strong></div>
                <div className="done-item"><span>Savings</span><strong>{profile.currencySymbol}{(balances.savings || 0).toLocaleString()}</strong></div>
                <div className="done-item"><span>Investments</span><strong>{profile.currencySymbol}{(balances.investments || 0).toLocaleString()}</strong></div>
                <div className="done-item"><span>Debts</span><strong>{profile.currencySymbol}{(balances.debts || 0).toLocaleString()}</strong></div>
              </div>
            )}
          </div>
        </div>

        <div className="onboarding-actions">
          <div style={{ display: 'flex', gap: 10 }}>
            {step > 0 && <button className="btn btn-secondary" onClick={handleBack}>Back</button>}
            <button className="btn btn-ghost" onClick={handleSkip}>Skip Setup</button>
          </div>
          <button className="btn btn-primary btn-lg" onClick={handleNext}>
            {step === STEPS.length - 1 ? 'Get Started' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
