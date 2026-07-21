import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const StoreContext = createContext();

const defaultData = {
  openingBalances: { checking: 0, savings: 0, investments: 0, debts: 0 },
  cashFlow: [],
  netWorthHistory: [],
  transactions: [],
  budgets: [],
  accounts: [],
  categories: [
    { id: '1', name: 'Housing', type: 'expense', color: '#4F8CFF', icon: 'home' },
    { id: '2', name: 'Food & Dining', type: 'expense', color: '#F59E0B', icon: 'utensils' },
    { id: '3', name: 'Transportation', type: 'expense', color: '#8B5CF6', icon: 'car' },
    { id: '4', name: 'Utilities', type: 'expense', color: '#34D399', icon: 'zap' },
    { id: '5', name: 'Entertainment', type: 'expense', color: '#EC4899', icon: 'music' },
    { id: '6', name: 'Shopping', type: 'expense', color: '#EF4444', icon: 'shopping-bag' },
    { id: '7', name: 'Health', type: 'expense', color: '#14B8A6', icon: 'heart' },
    { id: '8', name: 'Education', type: 'expense', color: '#6366F1', icon: 'book' },
    { id: '9', name: 'Travel', type: 'expense', color: '#F97316', icon: 'plane' },
    { id: '10', name: 'Insurance', type: 'expense', color: '#06B6D4', icon: 'shield' },
    { id: '11', name: 'Salary', type: 'income', color: '#34D399', icon: 'briefcase' },
    { id: '12', name: 'Freelance', type: 'income', color: '#8B5CF6', icon: 'laptop' },
    { id: '13', name: 'Investments', type: 'income', color: '#F59E0B', icon: 'trending-up' },
    { id: '14', name: 'Gifts', type: 'income', color: '#EC4899', icon: 'gift' },
    { id: '15', name: 'Other Income', type: 'income', color: '#94A3B8', icon: 'plus-circle' },
    { id: '16', name: 'Transfer', type: 'transfer', color: '#4F8CFF', icon: 'arrow-left-right' },
  ],
  savingsGoals: [],
  recurringPayments: [],
  investments: [],
  crypto: [],
  limits: {},
  profiles: {},
  settings: { theme: 'light', currency: 'USD', language: 'en', animations: true, notifications: true, includeInvestmentsInNetWorth: true },
};

const localStorageKey = 'finora_budget_data';

function loadLocalCache() {
  try { return JSON.parse(localStorage.getItem(localStorageKey)); } catch { return null; }
}

function saveLocalCache(data) {
  try { localStorage.setItem(localStorageKey, JSON.stringify(data)); } catch {}
}

function camelToSnake(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(camelToSnake);
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k.replace(/[A-Z]/g, l => '_' + l.toLowerCase()),
      v !== null && typeof v === 'object' && !Array.isArray(v) ? camelToSnake(v) : v
    ])
  );
}

function snakeToCamel(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(snakeToCamel);
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k.replace(/_([a-z])/g, (_, l) => l.toUpperCase()),
      v !== null && typeof v === 'object' && !Array.isArray(v) ? snakeToCamel(v) : v
    ])
  );
}

export function StoreProvider({ children }) {
  const [data, setData] = useState(() => loadLocalCache() || defaultData);
  const [currentUser, setCurrentUser] = useState(null);
  const [loaded, setLoaded] = useState(true);
  const [restoring, setRestoring] = useState(true);
  const [version, setVersion] = useState('4.3.0');

  const applyData = useCallback((newData) => {
    setData(newData);
    saveLocalCache(newData);
  }, []);

  // Auto-login from saved session on mount
  useEffect(() => {
    const saved = localStorage.getItem('finora_auth');
    const buildVer = localStorage.getItem('finora_build_version');

    // Clear stale data on version mismatch (new build)
    if (buildVer !== version) {
      localStorage.removeItem('finora_auth');
      localStorage.removeItem('finora_license');
      localStorage.removeItem('finora_has_logged_in');
    }

    if (!saved || buildVer !== version) {
      localStorage.removeItem('finora_has_logged_in');
      localStorage.removeItem('finora_license');
      localStorage.removeItem('finora_auth');
      setRestoring(false);
      return;
    }

    // Show "Logging in..." for minimum 2s
    const minDelay = new Promise(r => setTimeout(r, 2000));

    let cancelled = false;
    (async () => {
      try {
        const session = JSON.parse(saved);
        const user = { ...session, loginTime: Date.now() };

        if (!window.finora?.supabase) {
          // Dev mode with no Supabase — let them in
          await minDelay;
          if (!cancelled) setCurrentUser(user);
          if (!cancelled) setRestoring(false);
          return;
        }

        const health = await window.finora.supabase.health();
        if (!health.success) {
          console.warn('[Auto-login] Supabase unreachable, restoring session from cache');
          await minDelay;
          if (!cancelled) { setCurrentUser(user); setRestoring(false); }
          return;
        }

        const merged = { ...data };
        const tableMap = {
          transactions: 'transactions', budgets: 'budgets', accounts: 'accounts',
          savings_goals: 'savingsGoals', recurring_payments: 'recurringPayments', investments: 'investments', crypto: 'crypto',
        };
 
        // Try loadAll but don't block profile/settings on it
        const loadResult = await window.finora.supabase.loadAll(user.id || user.username);
        if (!cancelled && loadResult?.success && loadResult?.data) {
          for (const [dbKey, stateKey] of Object.entries(tableMap)) {
            if (loadResult.data[dbKey]?.length) {
              merged[stateKey] = loadResult.data[dbKey].map(r => {
                const c = snakeToCamel(r);
                return { ...c, userId: c.userId || user.id };
              });
            }
          }
        }

        // ALWAYS try to load profile — onboarding is register-only
        const profileRes = await window.finora.supabase.loadProfile(user.id || user.username);
        if (!cancelled) {
          let p = { setupComplete: true, userId: user.id };
          if (profileRes?.success && profileRes?.data) {
            p = { ...snakeToCamel(profileRes.data), setupComplete: true, userId: user.id };
          }
          merged.profiles = { ...merged.profiles, [user.id]: p };
        }

        // ALWAYS try to load settings
        const settingsRes = await window.finora.supabase.loadSettings(user.id || user.username);
        if (!cancelled && settingsRes?.success && settingsRes?.data) {
          const s = snakeToCamel(settingsRes.data);
          merged.settings = { ...merged.settings, ...s };
        }

        if (!cancelled) applyData(merged);

        // Always restore the saved session — Supabase is best-effort
        await minDelay;
        if (!cancelled) {
          setCurrentUser(user);
          setRestoring(false);
        }
      } catch (e) {
        console.warn('[Auto-login] Error:', e);
        // Restore session even on error — local cache is the fallback
        await minDelay;
        try {
          const session = JSON.parse(saved);
          if (!cancelled) setCurrentUser({ ...session, loginTime: Date.now() });
        } catch {}
        if (!cancelled) setRestoring(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (username, password) => {
    const savedKey = localStorage.getItem('finora_license') || '';
    const result = await window.finora.keyauth.login(username, password, savedKey);
    if (!result.success) return { success: false, error: result.error || 'Invalid credentials' };

    const user = { id: result.user?.id || username, username, email: result.user?.email || '', subscription: result.subscription || '', expiry: result.expiry || '', loginTime: Date.now() };
    setCurrentUser(user);
    localStorage.setItem('finora_auth', JSON.stringify(user));

    if (!window.finora?.supabase) { console.warn('[Supabase] Not available in Electron'); return { success: true }; }

    try {
      const userRecord = { id: user.id, username: user.username, email: user.email, keyauthUsername: user.username, keyauthKey: savedKey, appVersion: version };
      await window.finora.supabase.createUser(userRecord);
      console.log('[Supabase] User record created/updated');

      // Load all data from Supabase
      const loadResult = await window.finora.supabase.loadAll(user.id);
      if (loadResult.success && loadResult.data) {
        const merged = { ...data };
        const tableMap = {
          transactions: 'transactions', budgets: 'budgets', accounts: 'accounts',
          savings_goals: 'savingsGoals', recurring_payments: 'recurringPayments', investments: 'investments', crypto: 'crypto',
        };
        for (const [dbKey, stateKey] of Object.entries(tableMap)) {
          if (loadResult.data[dbKey]?.length) merged[stateKey] = loadResult.data[dbKey].map(r => { const c = snakeToCamel(r); return { ...c, userId: c.userId || c.userId || user.id }; });
        }
        applyData(merged);
        console.log('[Supabase] Data loaded for', user.id);
      }

      // Load profile from Supabase — always mark setupComplete (onboarding is register-only)
      try {
        const profileRes = await window.finora.supabase.loadProfile(user.id);
        const local = data.profiles[user.id];
        let mergedProfile = { setupComplete: true, userId: user.id };
        if (profileRes.success && profileRes.data) {
          const p = snakeToCamel(profileRes.data);
          mergedProfile = { ...p, setupComplete: true, userId: user.id };
        }
        const newData = { ...data, profiles: { ...data.profiles, [user.id]: mergedProfile } };
        applyData(newData);
      } catch (e) { console.warn('[Supabase] Load profile error:', e); }

      // Load settings from Supabase
      try {
        const settingsRes = await window.finora.supabase.loadSettings(user.id);
        if (settingsRes.success && settingsRes.data) {
          const s = snakeToCamel(settingsRes.data);
          const newData = { ...data, settings: { ...data.settings, ...s } };
          applyData(newData);
        }
      } catch (e) { console.warn('[Supabase] Load settings error:', e); }

      // Push local data not yet in Supabase
      const supData = loadResult?.data || {};
      const uid = user.id;
      const pushLocal = async (table, items) => {
        const existing = supData[table] || [];
        const existingIds = new Set(existing.map(r => r.id));
        const toPush = items.filter(i => i.userId === uid && !existingIds.has(i.id));
        if (toPush.length > 0) {
          const converted = toPush.map(i => { const { userId: _, ...rest } = i; return { ...camelToSnake(rest), user_id: uid }; });
          await window.finora.supabase.sync(table, converted);
          console.log(`[Supabase] Pushed ${toPush.length} local ${table}`);
        }
      };
      await Promise.all([
        pushLocal('transactions', data.transactions),
        pushLocal('budgets', data.budgets),
        pushLocal('accounts', data.accounts),
        pushLocal('savings_goals', data.savingsGoals),
        pushLocal('recurring_payments', data.recurringPayments),
        pushLocal('investments', data.investments),
        pushLocal('crypto', data.crypto),
      ]);
    } catch (e) { console.error('[Supabase] Login sync error:', e); }

    localStorage.setItem('finora_build_version', version);
    localStorage.setItem('finora_has_logged_in', '1');
    return { success: true };
  }, [data, version, applyData]);

  const register = useCallback(async (username, password, email, licenseKey) => {
    const result = await window.finora.keyauth.register(username, password, licenseKey);
    if (!result.success) return { success: false, error: result.error || 'Registration failed' };

    localStorage.setItem('finora_license', licenseKey);
    const user = { id: username, username, email: email || '', subscription: result.subscription || '', expiry: result.expiry || '', loginTime: Date.now() };
    setCurrentUser(user);
    localStorage.setItem('finora_auth', JSON.stringify(user));

    if (window.finora?.supabase) {
      try {
        await window.finora.supabase.createUser({
          id: user.id, username: user.username, email: user.email,
          keyauthUsername: user.username, keyauthKey: licenseKey,
          accountCreated: new Date().toISOString(), appVersion: version,
        });
        console.log('[Supabase] User created on register');
      } catch (e) { console.error('[Supabase] Register createUser error:', e); }
    }

    localStorage.setItem('finora_build_version', version);
    localStorage.setItem('finora_has_logged_in', '1');
    return { success: true };
  }, [version]);

  const logout = useCallback(() => {
    localStorage.removeItem('finora_auth');
    setCurrentUser(null);
  }, []);

  const syncTable = useCallback(async (table, items, uid) => {
    if (!items.length) return true;
    const rows = items.map(i => {
      const { userId, ...rest } = i;
      return { ...camelToSnake(rest), user_id: uid };
    });
    let lastErr;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await window.finora.supabase.sync(table, rows);
        if (res.success) return true;
        lastErr = res.error;
        console.warn(`[Supabase] ${table} sync attempt ${attempt + 1} failed: ${res.error}`);
        if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      } catch (e) {
        lastErr = e.message;
        console.warn(`[Supabase] ${table} sync attempt ${attempt + 1} threw:`, e);
        if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
    console.error(`[Supabase] ${table} sync FAILED after 3 attempts:`, lastErr);
    return false;
  }, []);

  const mutate = useCallback(async (buildNew, table, filterUser, deletedIds) => {
    const uid = currentUser?.id;
    const newData = buildNew(data);
    applyData(newData);

    if (uid && table && window.finora?.supabase) {
      if (deletedIds?.length) {
        try { await window.finora.supabase.delete(table, deletedIds); }
        catch (e) { console.error(`[Supabase] ${table} delete failed:`, e); }
      }
      const items = filterUser ? newData[table].filter(i => i.userId === uid) : newData[table];
      const ok = await syncTable(table, items, uid);
      if (!ok) console.error(`[Supabase] ${table} mutation failed to sync`);
    }
    return newData;
  }, [data, currentUser, applyData, syncTable]);

  const addTransaction = useCallback(async (transaction) => {
    const t = { ...transaction, id: uuidv4(), userId: currentUser?.id || 'local', createdAt: new Date().toISOString() };
    return mutate(d => ({ ...d, transactions: [...d.transactions, t] }), 'transactions', true);
  }, [mutate, currentUser]);

  const deleteTransaction = useCallback(async (id) => {
    return mutate(d => ({ ...d, transactions: d.transactions.filter(x => x.id !== id) }), 'transactions', true, [id]);
  }, [mutate]);

  const updateTransaction = useCallback(async (id, updates) => {
    return mutate(d => ({ ...d, transactions: d.transactions.map(x => x.id === id ? { ...x, ...updates } : x) }), 'transactions', true);
  }, [mutate]);

  const addBudget = useCallback(async (budget) => {
    const b = { ...budget, id: uuidv4(), userId: currentUser?.id || 'local', createdAt: new Date().toISOString() };
    return mutate(d => ({ ...d, budgets: [...d.budgets, b] }), 'budgets', true);
  }, [mutate, currentUser]);

  const deleteBudget = useCallback(async (id) => {
    return mutate(d => ({ ...d, budgets: d.budgets.filter(x => x.id !== id) }), 'budgets', true, [id]);
  }, [mutate]);

  const addAccount = useCallback(async (account) => {
    const a = { ...account, id: uuidv4(), userId: currentUser?.id || 'local', createdAt: new Date().toISOString() };
    return mutate(d => ({ ...d, accounts: [...d.accounts, a] }), 'accounts', true);
  }, [mutate, currentUser]);

  const deleteAccount = useCallback(async (id) => {
    return mutate(d => ({ ...d, accounts: d.accounts.filter(x => x.id !== id) }), 'accounts', true, [id]);
  }, [mutate]);

  const addSavingsGoal = useCallback(async (goal) => {
    const g = { ...goal, id: uuidv4(), userId: currentUser?.id || 'local', createdAt: new Date().toISOString(), saved: 0 };
    return mutate(d => ({ ...d, savingsGoals: [...d.savingsGoals, g] }), 'savings_goals', true);
  }, [mutate, currentUser]);

  const deleteSavingsGoal = useCallback(async (id) => {
    return mutate(d => ({ ...d, savingsGoals: d.savingsGoals.filter(x => x.id !== id) }), 'savings_goals', true, [id]);
  }, [mutate]);

  const updateSavingsGoal = useCallback(async (id, updates) => {
    return mutate(d => ({ ...d, savingsGoals: d.savingsGoals.map(x => x.id === id ? { ...x, ...updates } : x) }), 'savings_goals', true);
  }, [mutate]);

  const addRecurringPayment = useCallback(async (payment) => {
    const p = { ...payment, id: uuidv4(), userId: currentUser?.id || 'local', createdAt: new Date().toISOString() };
    return mutate(d => ({ ...d, recurringPayments: [...d.recurringPayments, p] }), 'recurring_payments', true);
  }, [mutate, currentUser]);

  const deleteRecurringPayment = useCallback(async (id) => {
    return mutate(d => ({ ...d, recurringPayments: d.recurringPayments.filter(x => x.id !== id) }), 'recurring_payments', true, [id]);
  }, [mutate]);

  const addInvestment = useCallback(async (investment) => {
    const inv = { ...investment, id: uuidv4(), userId: currentUser?.id || 'local', createdAt: new Date().toISOString() };
    return mutate(d => ({ ...d, investments: [...d.investments, inv] }), 'investments', true);
  }, [mutate, currentUser]);

  const deleteInvestment = useCallback(async (id) => {
    return mutate(d => ({ ...d, investments: d.investments.filter(x => x.id !== id) }), 'investments', true, [id]);
  }, [mutate]);

  const addCrypto = useCallback(async (holding) => {
    const h = { ...holding, id: uuidv4(), userId: currentUser?.id || 'local', createdAt: new Date().toISOString() };
    return mutate(d => ({ ...d, crypto: [...d.crypto, h] }), 'crypto', true);
  }, [mutate, currentUser]);

  const deleteCrypto = useCallback(async (id) => {
    return mutate(d => ({ ...d, crypto: d.crypto.filter(x => x.id !== id) }), 'crypto', true, [id]);
  }, [mutate]);

  const updateCryptoPrice = useCallback(async (id, currentPrice, change24h) => {
    const newData = { ...data, crypto: data.crypto.map(x => x.id === id ? { ...x, currentPrice, change24h, lastUpdated: new Date().toISOString() } : x) };
    applyData(newData);
    if (currentUser?.id && window.finora?.supabase) {
      const row = camelToSnake(newData.crypto.find(x => x.id === id));
      if (row) { try { await window.finora.supabase.sync('crypto', [{ ...row, user_id: currentUser.id }]); } catch {} }
    }
  }, [data, currentUser, applyData]);

  const refreshCryptoPrices = useCallback(async () => {
    if (!data.crypto.length) return;
    const ids = [...new Set(data.crypto.map(c => c.coinId))].join(',');
    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
      const prices = await res.json();
      let updated = [...data.crypto];
      for (const c of data.crypto) {
        const coinData = prices[c.coinId];
        if (coinData) {
          updated = updated.map(x => x.id === c.id ? { ...x, currentPrice: coinData.usd, change24h: coinData.usd_24h_change, lastUpdated: new Date().toISOString() } : x);
        }
      }
      applyData({ ...data, crypto: updated });
      if (currentUser?.id && window.finora?.supabase) {
        const rows = updated.map(c => { const { userId, ...rest } = c; return { ...camelToSnake(rest), user_id: currentUser.id }; });
        try { await window.finora.supabase.sync('crypto', rows); } catch {}
      }
    } catch (e) { console.error('[Crypto] Price refresh error:', e); }
  }, [data, currentUser, applyData]);

  const addCategory = useCallback(async (category) => {
    const c = { ...category, id: uuidv4() };
    const newData = { ...data, categories: [...data.categories, c] };
    applyData(newData);
    return c;
  }, [data, applyData]);

  const deleteCategory = useCallback(async (id) => {
    const newData = { ...data, categories: data.categories.filter(c => c.id !== id) };
    applyData(newData);
  }, [data, applyData]);

  const updateSettings = useCallback(async (settings) => {
    const newData = { ...data, settings: { ...data.settings, ...settings } };
    applyData(newData);
    if (currentUser?.id && window.finora?.supabase) {
      try {
        await window.finora.supabase.upsertSettings(currentUser.id, camelToSnake(newData.settings));
        console.log('[Supabase] Settings saved');
      } catch (e) { console.error('[Supabase] Settings sync error:', e); }
    }
  }, [data, currentUser, applyData]);

  const updateOpeningBalances = useCallback(async (balances) => {
    const newData = { ...data, openingBalances: { ...data.openingBalances, ...balances } };
    applyData(newData);
    if (currentUser?.id && window.finora?.supabase) {
      try {
        await window.finora.supabase.upsertBalances(currentUser.id, newData.openingBalances);
        console.log('[Supabase] Opening balances saved');
      } catch (e) { console.error('[Supabase] Opening balances sync error:', e); }
    }
  }, [data, currentUser, applyData]);

  const updateProfile = useCallback(async (profile) => {
    const uid = currentUser?.id || 'local';
    const newData = { ...data, profiles: { ...data.profiles, [uid]: { ...profile, userId: uid } } };
    applyData(newData);
    if (uid && window.finora?.supabase) {
      try {
        const { currencySymbol, ...dbProfile } = profile;
        await window.finora.supabase.upsertProfile(camelToSnake({ id: uid, ...dbProfile }));
        console.log('[Supabase] Profile saved');
      } catch (e) { console.error('[Supabase] Profile sync error:', e); }
    }
    return profile;
  }, [data, currentUser, applyData]);

  const importTransactions = useCallback(async (transactions) => {
    const parsed = Array.isArray(transactions) ? transactions : [];
    const newTransactions = parsed.map(t => ({
      ...t, id: uuidv4(), userId: currentUser?.id || 'local', createdAt: new Date().toISOString(),
    }));
    const newData = { ...data, transactions: [...data.transactions, ...newTransactions] };
    applyData(newData);
    if (currentUser?.id && window.finora?.supabase) {
      await syncTable('transactions', newTransactions, currentUser.id);
    }
    return newTransactions;
  }, [data, currentUser, applyData, syncTable]);

  const addCashFlowRecord = useCallback((record) => {
    const r = { ...record, id: uuidv4(), userId: currentUser?.id || 'local' };
    const newData = { ...data, cashFlow: [...data.cashFlow, r] };
    applyData(newData);
    return r;
  }, [data, currentUser, applyData]);

  const updateCashFlowRecord = useCallback((id, updates) => {
    const newData = { ...data, cashFlow: data.cashFlow.map(r => r.id === id ? { ...r, ...updates } : r) };
    applyData(newData);
  }, [data, applyData]);

  const deleteCashFlowRecord = useCallback((id) => {
    const newData = { ...data, cashFlow: data.cashFlow.filter(r => r.id !== id) };
    applyData(newData);
  }, [data, applyData]);

  const addNetWorthSnapshot = useCallback((snapshot) => {
    const s = { ...snapshot, id: uuidv4(), userId: currentUser?.id || 'local' };
    const newData = { ...data, netWorthHistory: [...data.netWorthHistory, s] };
    applyData(newData);
    return s;
  }, [data, currentUser, applyData]);

  const getUserTransactions = useCallback((userId) => data.transactions.filter(t => t.userId === (userId || 'local')), [data.transactions]);
  const getUserBudgets = useCallback((userId) => data.budgets.filter(b => b.userId === (userId || 'local')), [data.budgets]);
  const getUserAccounts = useCallback((userId) => data.accounts.filter(a => a.userId === (userId || 'local')), [data.accounts]);
  const getUserSavingsGoals = useCallback((userId) => data.savingsGoals.filter(g => g.userId === (userId || 'local')), [data.savingsGoals]);
  const getUserRecurringPayments = useCallback((userId) => data.recurringPayments.filter(p => p.userId === (userId || 'local')), [data.recurringPayments]);
  const getUserInvestments = useCallback((userId) => data.investments.filter(i => i.userId === (userId || 'local')), [data.investments]);
  const getUserCrypto = useCallback((userId) => data.crypto.filter(c => c.userId === (userId || 'local')), [data.crypto]);
  const getUserLimits = useCallback((userId) => { const uid = userId || 'local'; return Object.values(data.limits).filter(l => l.userId === uid); }, [data.limits]);
  const getUserProfile = useCallback((userId) => { const uid = userId || (currentUser?.id || 'local'); return data.profiles[uid] || null; }, [data.profiles, currentUser]);
  const getUserCashFlow = useCallback((userId) => data.cashFlow.filter(r => r.userId === (userId || 'local')), [data.cashFlow]);
  const getUserNetWorthHistory = useCallback((userId) => data.netWorthHistory.filter(s => s.userId === (userId || 'local')), [data.netWorthHistory]);

  const getNetWorth = useCallback((userId) => {
    const ob = data.openingBalances;
    let totalAssets = (ob.checking || 0) + (ob.savings || 0) + (ob.investments || 0);
    const totalLiabilities = ob.debts || 0;
    if (data.settings?.includeInvestmentsInNetWorth !== false) {
      const investments = data.investments.filter(i => i.userId === (userId || 'local'));
      totalAssets += investments.reduce((s, i) => {
        if (i.currentPrice && i.shares) return s + (i.currentPrice * i.shares);
        return s + Number(i.amount || 0);
      }, 0);
    }
    // Crypto holdings with live prices
    const crypto = data.crypto.filter(c => c.userId === (userId || 'local'));
    totalAssets += crypto.reduce((s, c) => s + ((c.currentPrice || 0) * (c.amount || 0)), 0);
    return { totalAssets, totalLiabilities, netWorth: totalAssets - totalLiabilities };
  }, [data.openingBalances, data.investments, data.crypto, data.settings]);

  const value = {
    data, currentUser, loaded, restoring, version, applyData,
    login, register, logout,
    addTransaction, deleteTransaction, updateTransaction,
    addBudget, deleteBudget,
    addAccount, deleteAccount,
    addSavingsGoal, deleteSavingsGoal, updateSavingsGoal,
    addRecurringPayment, deleteRecurringPayment,
    addInvestment, deleteInvestment,
    addCrypto, deleteCrypto, updateCryptoPrice, refreshCryptoPrices,
    addCategory, deleteCategory,
    setLimit: () => {}, removeLimit: () => {},
    importTransactions,
    getUserTransactions, getUserBudgets, getUserAccounts,
    getUserSavingsGoals, getUserRecurringPayments, getUserInvestments, getUserCrypto,
    getUserLimits, getUserProfile, updateProfile,
    updateSettings,
    updateOpeningBalances,
    addCashFlowRecord, updateCashFlowRecord, deleteCashFlowRecord,
    addNetWorthSnapshot,
    getUserCashFlow, getUserNetWorthHistory, getNetWorth,
    exportData: () => Promise.resolve(true),
    importFile: () => new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv,.json';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) { resolve(null); return; }
        const reader = new FileReader();
        reader.onload = () => resolve({ filePath: file.name, content: reader.result });
        reader.readAsText(file);
      };
      input.click();
    }),
    backupData: async () => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finora-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      return true;
    },
    restoreData: () => new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) { resolve(null); return; }
        const reader = new FileReader();
        reader.onload = () => {
          try { const d = JSON.parse(reader.result); localStorage.setItem(localStorageKey, JSON.stringify(d)); resolve({ success: true, data: d }); }
          catch (err) { resolve({ success: false, error: err.message }); }
        };
        reader.readAsText(file);
      };
      input.click();
    }),
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
