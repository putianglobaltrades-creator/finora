-- ============================================================
-- FINORA - Complete Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  username TEXT,
  email TEXT DEFAULT '',
  keyauth_username TEXT,
  keyauth_key TEXT DEFAULT '',
  full_name TEXT DEFAULT '',
  occupation TEXT DEFAULT '',
  monthly_savings_goal NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  setup_complete BOOLEAN DEFAULT false,
  last_login TIMESTAMPTZ DEFAULT NOW(),
  account_created TIMESTAMPTZ DEFAULT NOW(),
  app_version TEXT DEFAULT '4.2.8',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TEXT DEFAULT '00:00',
  description TEXT DEFAULT '',
  merchant TEXT DEFAULT '',
  account TEXT DEFAULT '',
  payment_method TEXT DEFAULT '',
  currency TEXT DEFAULT 'USD',
  tags JSONB DEFAULT '[]',
  note TEXT DEFAULT '',
  recurring JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 3. BUDGETS
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  period TEXT DEFAULT 'monthly',
  month TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- 4. ACCOUNTS
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  balance NUMERIC DEFAULT 0,
  color TEXT DEFAULT '#4F8CFF',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- 5. SAVINGS GOALS
CREATE TABLE IF NOT EXISTS savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target NUMERIC NOT NULL,
  deadline DATE,
  saved NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

-- 6. RECURRING PAYMENTS
CREATE TABLE IF NOT EXISTS recurring_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT DEFAULT 'expense',
  frequency TEXT NOT NULL,
  category TEXT DEFAULT '',
  next_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE recurring_payments ENABLE ROW LEVEL SECURITY;

-- 7. INVESTMENTS
CREATE TABLE IF NOT EXISTS investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'Stocks',
  ticker TEXT DEFAULT '',
  shares NUMERIC DEFAULT 0,
  amount NUMERIC DEFAULT 0,
  current_price NUMERIC DEFAULT 0,
  return_rate NUMERIC DEFAULT 0,
  risk TEXT DEFAULT 'Medium',
  last_price_update TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

-- 8. CRYPTO
CREATE TABLE IF NOT EXISTS crypto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  coin_id TEXT NOT NULL,
  coin_name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  buy_price NUMERIC NOT NULL,
  current_price NUMERIC DEFAULT 0,
  change24h NUMERIC DEFAULT 0,
  purchase_date DATE DEFAULT CURRENT_DATE,
  wallet TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE crypto ENABLE ROW LEVEL SECURITY;

-- 9. SETTINGS
CREATE TABLE IF NOT EXISTS settings (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light',
  currency TEXT DEFAULT 'USD',
  language TEXT DEFAULT 'en',
  animations BOOLEAN DEFAULT true,
  notifications BOOLEAN DEFAULT true,
  include_investments_in_net_worth BOOLEAN DEFAULT true
);
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 10. OPENING BALANCES
CREATE TABLE IF NOT EXISTS opening_balances (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  checking NUMERIC DEFAULT 0,
  savings NUMERIC DEFAULT 0,
  investments NUMERIC DEFAULT 0,
  debts NUMERIC DEFAULT 0
);
ALTER TABLE opening_balances ENABLE ROW LEVEL SECURITY;

-- 11. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  color TEXT DEFAULT '#4F8CFF',
  icon TEXT DEFAULT ''
);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES (service_role bypasses RLS, but policies are
-- required for the tables to work at all in Supabase)
-- ============================================================

CREATE POLICY "allow_all" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON budgets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON savings_goals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON recurring_payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON investments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON crypto FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON opening_balances FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON categories FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_payments_user_id ON recurring_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_user_id ON crypto(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
