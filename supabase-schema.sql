-- Run this in Supabase SQL Editor (https://supabase.com)

CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  full_name TEXT DEFAULT '',
  occupation TEXT DEFAULT '',
  currency TEXT DEFAULT 'USD',
  currency_symbol TEXT DEFAULT '$',
  monthly_savings_goal NUMERIC DEFAULT 0,
  setup_complete BOOLEAN DEFAULT FALSE,
  keyauth_username TEXT DEFAULT '',
  keyauth_key TEXT DEFAULT '',
  last_login TIMESTAMPTZ,
  account_created TIMESTAMPTZ DEFAULT NOW(),
  app_version TEXT DEFAULT ''
);

CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT DEFAULT '',
  date TEXT NOT NULL,
  time TEXT DEFAULT '00:00',
  merchant TEXT DEFAULT '',
  account TEXT DEFAULT '',
  payment_method TEXT DEFAULT '',
  currency TEXT DEFAULT 'USD',
  tags JSONB DEFAULT '[]'::jsonb,
  note TEXT DEFAULT '',
  recurring JSONB DEFAULT 'null'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE budgets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id),
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  period TEXT DEFAULT 'monthly',
  month TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id),
  name TEXT NOT NULL,
  type TEXT DEFAULT 'checking',
  balance NUMERIC DEFAULT 0,
  color TEXT DEFAULT '#4F8CFF',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  color TEXT DEFAULT '#4F8CFF',
  icon TEXT DEFAULT 'circle'
);

CREATE TABLE savings_goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  target NUMERIC NOT NULL,
  saved NUMERIC DEFAULT 0,
  deadline TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE recurring_payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id),
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT DEFAULT 'expense',
  frequency TEXT DEFAULT 'monthly',
  next_date TEXT NOT NULL,
  category TEXT DEFAULT 'Other',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE investments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id),
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

CREATE TABLE opening_balances (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id),
  checking NUMERIC DEFAULT 0,
  savings NUMERIC DEFAULT 0,
  investments NUMERIC DEFAULT 0,
  debts NUMERIC DEFAULT 0
);

CREATE TABLE settings (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id),
  theme TEXT DEFAULT 'light',
  currency TEXT DEFAULT 'USD',
  language TEXT DEFAULT 'en',
  animations BOOLEAN DEFAULT TRUE,
  notifications BOOLEAN DEFAULT TRUE,
  include_investments_in_net_worth BOOLEAN DEFAULT TRUE
);

-- Indexes
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_budgets_user ON budgets(user_id);
CREATE INDEX idx_accounts_user ON accounts(user_id);
CREATE INDEX idx_savings_goals_user ON savings_goals(user_id);
CREATE INDEX idx_recurring_payments_user ON recurring_payments(user_id);
CREATE INDEX idx_investments_user ON investments(user_id);

-- ============================================================
-- MIGRATION: Run this if tables already exist
-- ============================================================
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS keyauth_username TEXT DEFAULT '';
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS keyauth_key TEXT DEFAULT '';
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_created TIMESTAMPTZ DEFAULT NOW();
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS app_version TEXT DEFAULT '';
--
-- ALTER TABLE transactions ADD COLUMN IF NOT EXISTS time TEXT DEFAULT '00:00';
-- ALTER TABLE transactions ADD COLUMN IF NOT EXISTS merchant TEXT DEFAULT '';
-- ALTER TABLE transactions ADD COLUMN IF NOT EXISTS account TEXT DEFAULT '';
-- ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT '';
-- ALTER TABLE transactions ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
-- ALTER TABLE transactions ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
-- ALTER TABLE transactions ADD COLUMN IF NOT EXISTS note TEXT DEFAULT '';
-- ALTER TABLE transactions ALTER COLUMN recurring DROP DEFAULT;
-- ALTER TABLE transactions ALTER COLUMN recurring TYPE JSONB USING
--   CASE WHEN recurring IS NULL THEN 'null'::jsonb
--        WHEN recurring = true THEN '{"frequency": "monthly"}'::jsonb
--        ELSE 'null'::jsonb END;
-- ALTER TABLE transactions ALTER COLUMN recurring SET DEFAULT 'null'::jsonb;
--
-- ALTER TABLE budgets ADD COLUMN IF NOT EXISTS month TEXT DEFAULT '';
--
-- ALTER TABLE accounts ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#4F8CFF';
--
-- ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS deadline TEXT;
-- ALTER TABLE savings_goals RENAME COLUMN name TO title;
--
-- ALTER TABLE recurring_payments ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'expense';
-- ALTER TABLE recurring_payments ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Other';
