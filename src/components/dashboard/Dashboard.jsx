import React, { useMemo } from 'react';
import { useStore } from '../../store/StoreContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, startOfWeek, endOfWeek, subDays, isSameDay } from 'date-fns';

const COLORS = { Housing: '#4F8CFF', 'Food & Dining': '#F59E0B', Transportation: '#8B5CF6', Utilities: '#34D399', Entertainment: '#EC4899', Shopping: '#EF4444', Health: '#14B8A6', Education: '#6366F1', Travel: '#F97316', Insurance: '#06B6D4', other: '#94A3B8' };
const INCOME_COLORS = { Salary: '#34D399', Freelance: '#8B5CF6', Investments: '#F59E0B', Gifts: '#EC4899', 'Other Income': '#94A3B8', other: '#94A3B8' };

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-label">{payload[0].name}</p>
        <p className="chart-tooltip-value">${payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

function StatCard({ title, value, subtitle, icon, color, trend, prefix }) {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <div className="stat-card-icon" style={{ background: color + '18', color }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={icon} />
          </svg>
        </div>
        {trend !== undefined && (
          <span className={`stat-trend ${trend >= 0 ? 'positive' : 'negative'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="stat-card-body">
        <p className="stat-card-title">{title}</p>
        <h2 className="stat-card-value">{prefix || '$'}{value.toLocaleString()}</h2>
        {subtitle && <p className="stat-card-subtitle">{subtitle}</p>}
      </div>
    </div>
  );
}

function DoughnutChartCard({ title, data, colors, total }) {
  return (
    <div className="chart-card">
      <h3 className="chart-card-title">{title}</h3>
      <div className="chart-card-body">
        <div className="chart-doughnut">
          <ResponsiveContainer width={180} height={180}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                {data.map((entry, index) => (
                  <Cell key={index} fill={colors[entry.name] || colors.other} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="chart-center-label">
            <span className="chart-center-value">${total.toLocaleString()}</span>
            <span className="chart-center-sub">Total</span>
          </div>
        </div>
        <div className="chart-legend">
          {data.filter(d => d.value > 0).sort((a, b) => b.value - a.value).slice(0, 6).map(entry => (
            <div key={entry.name} className="legend-item">
              <span className="legend-dot" style={{ background: colors[entry.name] || colors.other }} />
              <span className="legend-label">{entry.name}</span>
              <span className="legend-value">${entry.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SpendingTrend({ transactions }) {
  const monthlyData = useMemo(() => {
    const months = {};
    transactions.forEach(t => {
      if (t.type !== 'expense') return;
      const d = parseISO(t.date);
      const key = format(d, 'MMM yyyy');
      months[key] = (months[key] || 0) + Number(t.amount);
    });
    return Object.entries(months).slice(-6).map(([month, amount]) => ({ month, amount }));
  }, [transactions]);

  if (monthlyData.length === 0) return null;

  return (
    <div className="chart-card">
      <h3 className="chart-card-title">Spending Trend</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={monthlyData}>
          <defs>
            <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4F8CFF" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#4F8CFF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
          <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="amount" stroke="#4F8CFF" fill="url(#spendGradient)" strokeWidth={2.5} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function DailySpending({ transactions }) {
  const dailyData = useMemo(() => {
    const days = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = subDays(today, i);
      const key = format(d, 'EEE');
      days[key] = { day: key, amount: 0, fullDate: d };
    }
    transactions.forEach(t => {
      if (t.type !== 'expense') return;
      const d = parseISO(t.date);
      if (isWithinInterval(d, { start: subDays(today, 6), end: today })) {
        const key = format(d, 'EEE');
        if (days[key]) days[key].amount += Number(t.amount);
      }
    });
    return Object.values(days);
  }, [transactions]);

  return (
    <div className="chart-card wide">
      <h3 className="chart-card-title">This Week</h3>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={dailyData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey="day" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
            {dailyData.map((entry, idx) => (
              <Cell key={idx} fill={entry.amount > 0 ? '#4F8CFF' : 'var(--border-light)'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Dashboard() {
  const { currentUser, getUserTransactions, getUserProfile, getUserAccounts, getUserBudgets, getUserSavingsGoals, getUserInvestments, data } = useStore();
  const profile = getUserProfile(currentUser?.id);
  const transactions = getUserTransactions(currentUser?.id);
  const accounts = getUserAccounts(currentUser?.id);
  const budgets = getUserBudgets(currentUser?.id);
  const goals = getUserSavingsGoals(currentUser?.id);
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const { monthlyExpenses, monthlyIncome, expenseByCategory, incomeByCategory, netWorth, cashFlow, weeklySpending, dailySpending, investmentValue } = useMemo(() => {
    let totalExpenses = 0, totalIncome = 0, weekExpenses = 0;
    const expCat = {}, incCat = {};
    let net = 0, dailyTotals = {};

    transactions.forEach(t => {
      const d = parseISO(t.date);
      const amount = Number(t.amount);
      const isThisMonth = isWithinInterval(d, { start: monthStart, end: monthEnd });
      const isThisWeek = isWithinInterval(d, { start: weekStart, end: weekEnd });

      if (t.type === 'expense') {
        if (isThisMonth) totalExpenses += amount;
        if (isThisWeek) weekExpenses += amount;
        if (isThisMonth) expCat[t.category] = (expCat[t.category] || 0) + amount;
      } else if (t.type === 'income') {
        if (isThisMonth) totalIncome += amount;
        if (isThisMonth) incCat[t.category] = (incCat[t.category] || 0) + amount;
      }
      net += t.type === 'expense' ? -amount : amount;
      if (isThisMonth) {
        const dayKey = format(d, 'MMM d');
        dailyTotals[dayKey] = (dailyTotals[dayKey] || 0) + (t.type === 'expense' ? -amount : amount);
      }
    });

    const spendingByDay = Object.entries(dailyTotals).slice(-14).map(([date, amount]) => ({ date, amount }));
    const accountsTotal = accounts.reduce((s, a) => s + Number(a.balance || 0), 0);
    const investments = getUserInvestments(currentUser?.id);
    const invValue = investments.reduce((s, i) => {
      if (i.currentPrice && i.shares) return s + (i.currentPrice * i.shares);
      return s + Number(i.amount || 0);
    }, 0);
    const includeInv = data.settings?.includeInvestmentsInNetWorth !== false;
    const totalNetWorth = net + accountsTotal + (includeInv ? invValue : 0);

    return {
      monthlyExpenses: totalExpenses,
      monthlyIncome: totalIncome,
      expenseByCategory: expCat,
      incomeByCategory: incCat,
      netWorth: totalNetWorth,
      cashFlow: totalIncome - totalExpenses,
      weeklySpending: weekExpenses,
      dailySpending: spendingByDay,
      investmentValue: invValue,
    };
  }, [transactions, accounts, monthStart, monthEnd, weekStart, weekEnd, currentUser, getUserInvestments, data.settings]);

  const expenseData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));
  const incomeData = Object.entries(incomeByCategory).map(([name, value]) => ({ name, value }));
  const totalExpense = expenseData.reduce((s, d) => s + d.value, 0);
  const totalIncomeVal = incomeData.reduce((s, d) => s + d.value, 0);

  const savingsRate = monthlyIncome > 0 ? Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100) : 0;
  const healthScore = useMemo(() => {
    let score = 70;
    if (cashFlow > 0) score += 15;
    if (savingsRate > 20) score += 10;
    else if (savingsRate > 10) score += 5;
    if (budgets.length > 0) score += 5;
    if (goals.length > 0) score += 5;
    if (accounts.length > 1) score += 5;
    return Math.min(score, 100);
  }, [cashFlow, savingsRate, budgets, goals, accounts]);

  const recentTransactions = transactions.slice(-5).reverse();
  const upcomingPayments = transactions.filter(t => {
    if (t.recurring) {
      const d = parseISO(t.date);
      return d > now;
    }
    return false;
  }).slice(0, 5);

  return (
    <div className="page dashboard-page">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Welcome{profile?.fullName ? `, ${profile.fullName.split(' ')[0]}` : ''}</h1>
            <p className="page-subtitle">{format(now, 'EEEE, MMMM d, yyyy')} &bull; Financial Overview</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {profile?.monthlySavingsGoal > 0 && monthlyIncome > 0 && (
              <div className="savings-goal-badge" style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 16px',
                background: 'var(--primary-glow)', border: '1px solid var(--border-color)',
                borderRadius: 20, color: 'var(--primary)', fontSize: 13, fontWeight: 600,
                whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                Save ${profile.monthlySavingsGoal.toLocaleString()}/mo
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="Net Worth" value={netWorth} color={netWorth >= 0 ? '#4F8CFF' : '#EF4444'}
          icon="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
          subtitle={accounts.length > 0 ? `Across ${accounts.length} accounts` : 'All-time balance'} />
        <StatCard title="Monthly Income" value={monthlyIncome} color="#34D399"
          icon="M12 1v22 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        <StatCard title="Monthly Expenses" value={monthlyExpenses} color="#EF4444"
          icon="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <StatCard title="Cash Flow" value={cashFlow} color={cashFlow >= 0 ? '#34D399' : '#EF4444'}
          icon="M12 5v14M5 12h14" />
      </div>

      <div className="stats-grid" style={{ marginTop: -12 }}>
        <StatCard title="Financial Health" value={healthScore} prefix="" color={healthScore >= 80 ? '#34D399' : healthScore >= 50 ? '#F59E0B' : '#EF4444'}
          icon="M9 12l2 2 4-4 M7.5 7.5A7.5 7.5 0 1 0 12 4.5" subtitle={`${savingsRate}% savings rate`} />
        <StatCard title="Weekly Spending" value={weeklySpending} color="#F59E0B"
          icon="M8 2v4 M16 2v4 M3 10h18" subtitle="This week" />
        <StatCard title="Total Savings" value={monthlyIncome - monthlyExpenses > 0 ? monthlyIncome - monthlyExpenses : 0} color="#8B5CF6"
          icon="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" subtitle="This month" />
        <StatCard title="Investment Value" value={investmentValue} color="#F59E0B"
          icon="M13 2L3 14h9l-1 8 10-12h-9l1-8z" subtitle={investmentValue > 0 ? 'Portfolio value' : 'No investments tracked'} />
      </div>

      <div className="charts-grid">
        {expenseData.length > 0 && (
          <DoughnutChartCard title="Expenses by Category" data={expenseData} colors={COLORS} total={totalExpense} />
        )}
        {incomeData.length > 0 && (
          <DoughnutChartCard title="Income by Category" data={incomeData} colors={INCOME_COLORS} total={totalIncomeVal} />
        )}
        {transactions.length > 0 ? (
          <DailySpending transactions={transactions} />
        ) : (
          <div className="chart-card wide">
            <h3 className="chart-card-title">This Week</h3>
            <div className="empty-state" style={{ padding: '30px 20px' }}>
              <p>Add transactions to see weekly trends</p>
            </div>
          </div>
        )}
        {transactions.length > 0 && <SpendingTrend transactions={transactions} />}
      </div>

      {transactions.length === 0 && (
        <div className="empty-state" style={{ marginBottom: 28 }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          <h3>No transactions yet</h3>
          <p>Add your first transaction to see your budget overview.</p>
        </div>
      )}

      {transactions.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="recent-transactions">
            <h3>Recent Transactions</h3>
            <div className="tx-list">
              {recentTransactions.map(tx => (
                <div key={tx.id} className="tx-item">
                  <div className={`tx-type-indicator ${tx.type}`} />
                  <div className="tx-info">
                    <span className="tx-category">{tx.category}</span>
                    <span className="tx-date">{format(parseISO(tx.date), 'MMM d, yyyy')}</span>
                  </div>
                  <span className={`tx-amount ${tx.type}`}>
                    {tx.type === 'expense' ? '-' : '+'}${Number(tx.amount).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="recent-transactions">
            <h3>Budget Usage</h3>
            {budgets.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {budgets.slice(0, 4).map(budget => {
                  const spent = transactions
                    .filter(t => t.type === 'expense' && t.category === budget.category)
                    .filter(t => isWithinInterval(parseISO(t.date), { start: monthStart, end: monthEnd }))
                    .reduce((s, t) => s + Number(t.amount), 0);
                  const pct = budget.amount > 0 ? Math.min((spent / budget.amount) * 100, 100) : 0;
                  return (
                    <div key={budget.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                        <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{budget.category}</span>
                        <span>${spent.toLocaleString()} / ${Number(budget.amount).toLocaleString()}</span>
                      </div>
                      <div className="budget-bar-track">
                        <div className={`budget-bar-fill ${pct > 90 ? 'over' : pct > 75 ? 'warning' : 'ok'}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '20px' }}>
                <p>No budgets set. Create one in Budgets.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
