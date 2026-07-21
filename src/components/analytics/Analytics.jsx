import React, { useMemo, useState } from 'react';
import { useStore } from '../../store/StoreContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, LineChart, Line } from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns';

const COLORS = ['#4F8CFF', '#34D399', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#6366F1', '#84CC16', '#A855F7'];
const CATEGORY_COLORS = { Housing: '#4F8CFF', 'Food & Dining': '#F59E0B', Transportation: '#8B5CF6', Utilities: '#34D399', Entertainment: '#EC4899', Shopping: '#EF4444', Health: '#14B8A6', Education: '#6366F1', Travel: '#F97316', Insurance: '#06B6D4', other: '#94A3B8' };

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-label">{label || payload[0].name}</p>
        {payload.map((p, i) => (
          <p key={i} className="chart-tooltip-value" style={{ color: p.color }}>${p.value.toLocaleString()}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const { currentUser, getUserTransactions } = useStore();
  const transactions = getUserTransactions(currentUser?.id);
  const [timeRange, setTimeRange] = useState('12months');
  const [chartType, setChartType] = useState('area');

  const { monthlyData, categoryData, incomeVsExpense, netWorthGrowth } = useMemo(() => {
    const months = {};
    const cats = {};
    const incExp = {};
    const netGrowth = {};
    const now = new Date();
    const numMonths = timeRange === '3months' ? 3 : timeRange === '6months' ? 6 : 12;

    for (let i = numMonths - 1; i >= 0; i--) {
      const d = subMonths(now, i);
      const key = format(d, 'MMM yyyy');
      months[key] = { month: key, income: 0, expense: 0, net: 0 };
      incExp[key] = { month: key, income: 0, expense: 0 };
    }

    let runningNet = 0;
    transactions.forEach(t => {
      const d = parseISO(t.date);
      const amount = Number(t.amount);
      const key = format(d, 'MMM yyyy');

      if (months[key]) {
        if (t.type === 'income') {
          months[key].income += amount;
          incExp[key].income += amount;
        } else if (t.type === 'expense') {
          months[key].expense += amount;
          incExp[key].expense += amount;
        }
        months[key].net = months[key].income - months[key].expense;
      }

      runningNet += t.type === 'expense' ? -amount : amount;
      const netKey = format(d, 'MMM yyyy');
      if (netGrowth[netKey] === undefined) netGrowth[netKey] = runningNet;
      else netGrowth[netKey] = runningNet;
    });

    Object.keys(netGrowth).forEach(key => {
      if (!months[key]) delete netGrowth[key];
    });

    transactions.forEach(t => {
      if (t.type === 'expense') {
        cats[t.category] = (cats[t.category] || 0) + Number(t.amount);
      }
    });

    return {
      monthlyData: Object.values(months),
      categoryData: Object.entries(cats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      incomeVsExpense: Object.values(incExp),
      netWorthGrowth: Object.entries(netGrowth).map(([month, amount]) => ({ month, amount })),
    };
  }, [transactions, timeRange]);

  const totalIncome = monthlyData.reduce((s, m) => s + m.income, 0);
  const totalExpense = monthlyData.reduce((s, m) => s + m.expense, 0);
  const avgMonthly = monthlyData.length > 0 ? totalExpense / monthlyData.length : 0;

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Analytics</h1>
            <p className="page-subtitle">Deep insights into your financial patterns</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="tx-filters">
              {['3months', '6months', '12months'].map(r => (
                <button key={r} className={`filter-btn ${timeRange === r ? 'active' : ''}`} onClick={() => setTimeRange(r)}>
                  {r === '3months' ? '3M' : r === '6months' ? '6M' : '12M'}
                </button>
              ))}
            </div>
            <div className="tx-filters">
              {['area', 'bar', 'line'].map(t => (
                <button key={t} className={`filter-btn ${chartType === t ? 'active' : ''}`} onClick={() => setChartType(t)}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-card-title">Total Income</p>
          <p className="stat-card-value" style={{ color: 'var(--success)' }}>${totalIncome.toLocaleString()}</p>
          <p className="stat-card-subtitle">Over {timeRange === '3months' ? '3' : timeRange === '6months' ? '6' : '12'} months</p>
        </div>
        <div className="stat-card">
          <p className="stat-card-title">Total Expenses</p>
          <p className="stat-card-value" style={{ color: 'var(--danger)' }}>${totalExpense.toLocaleString()}</p>
          <p className="stat-card-subtitle">Avg ${Math.round(avgMonthly).toLocaleString()}/mo</p>
        </div>
        <div className="stat-card">
          <p className="stat-card-title">Net Savings</p>
          <p className="stat-card-value" style={{ color: totalIncome - totalExpense >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            ${(totalIncome - totalExpense).toLocaleString()}
          </p>
          <p className="stat-card-subtitle">{totalIncome > 0 ? `${Math.round(((totalIncome - totalExpense) / totalIncome) * 100)}% savings rate` : 'No income data'}</p>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card wide">
          <h3 className="chart-card-title">Income vs Expenses</h3>
          <ResponsiveContainer width="100%" height={280}>
            {chartType === 'area' ? (
              <AreaChart data={incomeVsExpense}>
                <defs>
                  <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34D399" stopOpacity={0.2}/><stop offset="95%" stopColor="#34D399" stopOpacity={0}/></linearGradient>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/><stop offset="95%" stopColor="#EF4444" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="income" stroke="#34D399" fill="url(#incGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="expense" stroke="#EF4444" fill="url(#expGrad)" strokeWidth={2} />
              </AreaChart>
            ) : chartType === 'bar' ? (
              <BarChart data={incomeVsExpense}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="income" fill="#34D399" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={incomeVsExpense}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="income" stroke="#34D399" strokeWidth={2.5} dot={{ fill: '#34D399', strokeWidth: 0 }} />
                <Line type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={2.5} dot={{ fill: '#EF4444', strokeWidth: 0 }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3 className="chart-card-title">Spending by Category</h3>
          <div className="chart-card-body">
            <div className="chart-doughnut">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={categoryData.slice(0, 8)} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {categoryData.slice(0, 8).map((entry, idx) => (
                      <Cell key={idx} fill={CATEGORY_COLORS[entry.name] || COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="chart-center-label">
                <span className="chart-center-value">${totalExpense.toLocaleString()}</span>
                <span className="chart-center-sub">Total</span>
              </div>
            </div>
            <div className="chart-legend">
              {categoryData.slice(0, 6).map(entry => (
                <div key={entry.name} className="legend-item">
                  <span className="legend-dot" style={{ background: CATEGORY_COLORS[entry.name] || COLORS[0] }} />
                  <span className="legend-label">{entry.name}</span>
                  <span className="legend-value">${entry.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="chart-card">
          <h3 className="chart-card-title">Net Worth Growth</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={netWorthGrowth}>
              <defs>
                <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4F8CFF" stopOpacity={0.2}/><stop offset="95%" stopColor="#4F8CFF" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="amount" stroke="#4F8CFF" fill="url(#netGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card wide">
          <h3 className="chart-card-title">Monthly Breakdown</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="income" fill="#34D399" radius={[4, 4, 0, 0]} name="Income" stackId="a" />
              <Bar dataKey="expense" fill="#EF4444" radius={[4, 4, 0, 0]} name="Expense" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {transactions.length === 0 && (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
          <h3>No data to analyze</h3>
          <p>Add transactions to see your financial analytics.</p>
        </div>
      )}
    </div>
  );
}
