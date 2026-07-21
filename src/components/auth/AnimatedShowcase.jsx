import React, { useState, useEffect, useRef } from 'react';

const FADE_MS = 600;

const SCENE_DEFS = [
  { key: 'dashboard', duration: 5000 },
  { key: 'transactions', duration: 5000 },
  { key: 'charts', duration: 5000 },
  { key: 'features', duration: 5000 },
  { key: 'pulse', duration: 5000 },
  { key: 'fadeout', duration: 5000 },
];

const TXNS = [
  { id: 1, name: 'Paycheck', amount: 2450, type: 'income' },
  { id: 2, name: 'Grocery Store', amount: -82.41, type: 'expense' },
  { id: 3, name: 'Netflix', amount: -15.99, type: 'expense' },
  { id: 4, name: 'Investment Return', amount: 340, type: 'income' },
  { id: 5, name: 'Coffee Shop', amount: -4.50, type: 'expense' },
];

const CHART_DATA = [32, 45, 38, 52, 48, 62, 58, 72, 65, 78, 70, 85];

const FEATURES = [
  { icon: '🔒', title: 'Secure Cloud Sync', desc: 'Encrypted and synced across all your devices.' },
  { icon: '📊', title: 'Smart Budget Analytics', desc: 'AI-powered insights on your spending.' },
  { icon: '💼', title: 'Multi-Account Tracking', desc: 'Checking, savings, investments in one place.' },
  { icon: '📈', title: 'Financial Insights', desc: 'Personalized recommendations to improve.' },
];

function fmt(n) {
  const a = Math.abs(n);
  return (n < 0 ? '-' : '') + '$' + a.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function lerp(a, b, t) { return a + (b - a) * (1 - Math.pow(1 - t, 3)); }

function useCounter(target, duration, start) {
  const [val, setVal] = useState(start ?? 0);
  const started = useRef(null);
  const initVal = useRef(start ?? 0);

  useEffect(() => {
    started.current = performance.now();
    initVal.current = val;
    let raf;
    const tick = () => {
      const p = Math.min((performance.now() - started.current) / duration, 1);
      setVal(lerp(initVal.current, target, p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return val;
}

function useMountFade(delay) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), delay || 50); return () => clearTimeout(t); }, []);
  return v;
}

function GlowOrbs() {
  return (
    <div className="showcase-orbs">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="orb orb-4" />
    </div>
  );
}

function GC({ className, children, style }) {
  return <div className={`showcase-glass ${className || ''}`} style={style}>{children}</div>;
}

function Sparkline({ data, color, w, h }) {
  const width = w || 80;
  const height = h || 24;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - (v / max) * height}`).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <polyline fill="none" stroke={color || '#4F8CFF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts} />
    </svg>
  );
}

/* ===== SCENE: Dashboard ===== */
function SceneDashboard() {
  const fade = useMountFade(100);
  const nw = useCounter(28450, 2000);
  const health = useCounter(78, 1800);

  return (
    <div className="ss-scene">
      <div className="showcase-header" style={{ opacity: fade ? 1 : 0, transform: `translateY(${fade ? 0 : 16}px)`, transition: 'opacity 0.5s ease, transform 0.5s ease' }}>
        <h2 className="showcase-title">Take Control of Your Finances</h2>
        <p className="showcase-subtitle">Track spending, manage budgets, and securely sync your finances across all your devices.</p>
      </div>
      <div className="showcase-cards">
        <GC className="sc-nw" style={{ opacity: fade ? 1 : 0, transform: `translateY(${fade ? 0 : 12}px)`, transition: 'opacity 0.5s ease, transform 0.5s ease', transitionDelay: '0.1s' }}>
          <div className="sc-label">Net Worth</div>
          <div className="sc-value">{fmt(nw)}</div>
          <div className="sc-change positive">+$1,240 this month</div>
        </GC>
        <GC style={{ opacity: fade ? 1 : 0, transform: `translateY(${fade ? 0 : 12}px)`, transition: 'opacity 0.5s ease, transform 0.5s ease', transitionDelay: '0.2s' }}>
          <div className="sc-label">Monthly Spending</div>
          <div className="sc-chart-bars">
            {CHART_DATA.slice(0, 8).map((v, i) => (
              <div key={i} className="sc-bar-wrap"><div className="sc-bar" style={{ height: fade ? `${(v / 85) * 100}%` : '0%', transition: 'height 0.6s ease', transitionDelay: `${0.3 + i * 0.06}s` }} /></div>
            ))}
          </div>
        </GC>
        <GC style={{ opacity: fade ? 1 : 0, transform: `translateY(${fade ? 0 : 12}px)`, transition: 'opacity 0.5s ease, transform 0.5s ease', transitionDelay: '0.25s' }}>
          <div className="sc-label">Financial Health</div>
          <div className="sc-health-ring">
            <svg width="72" height="72" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(79,140,255,0.15)" strokeWidth="6" />
              <circle cx="36" cy="36" r="30" fill="none" stroke="#4F8CFF" strokeWidth="6"
                strokeDasharray={`${(health / 100) * 188.5} 188.5`} strokeLinecap="round" transform="rotate(-90 36 36)"
                style={{ transition: 'stroke-dasharray 0.3s ease' }} />
            </svg>
            <span className="sc-health-num">{Math.round(health)}</span>
          </div>
          <div className="sc-health-label">Good</div>
        </GC>
      </div>
    </div>
  );
}

/* ===== SCENE: Transactions ===== */
function SceneTransactions() {
  const fade = useMountFade(100);
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    TXNS.forEach((_, i) => {
      setTimeout(() => setVisible(i + 1), 300 + i * 400);
    });
  }, []);

  return (
    <div className="ss-scene">
      <div className="showcase-header" style={{ opacity: fade ? 1 : 0, transform: `translateY(${fade ? 0 : 16}px)`, transition: 'opacity 0.5s ease, transform 0.5s ease' }}>
        <h2 className="showcase-title">Real-Time Tracking</h2>
        <p className="showcase-subtitle">Every transaction syncs instantly across all your devices.</p>
      </div>
      <GC style={{ width: '100%', maxWidth: 420, margin: '0 auto', opacity: fade ? 1 : 0, transition: 'opacity 0.5s ease', transitionDelay: '0.1s' }}>
        <div className="sc-label" style={{ marginBottom: 12 }}>Recent Transactions</div>
        {TXNS.map((tx, i) => (
          <div key={tx.id} className="sc-txn-row"
            style={{
              opacity: i < visible ? 1 : 0,
              transform: `translateY(${i < visible ? 0 : 10}px)`,
              transition: 'opacity 0.4s ease, transform 0.4s ease',
            }}>
            <span className="sc-txn-name">{tx.name}</span>
            <span className={`sc-txn-amt ${tx.type === 'income' ? 'positive' : ''}`}>{tx.amount > 0 ? '+' : ''}{fmt(tx.amount)}</span>
          </div>
        ))}
        {visible < TXNS.length && (
          <div className="sc-txn-loading" style={{ opacity: 1 }}>
            <div className="sc-txn-pulse" />
            <div className="sc-txn-pulse" style={{ width: '40%' }} />
          </div>
        )}
      </GC>
    </div>
  );
}

/* ===== SCENE: Charts ===== */
function SceneCharts() {
  const fade = useMountFade(100);
  const savingsPct = useCounter(72, 2500, 48);
  const balanceVal = useCounter(6240, 2000, 4500);
  const [bars, setBars] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setBars(12), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="ss-scene">
      <div className="showcase-header" style={{ opacity: fade ? 1 : 0, transform: `translateY(${fade ? 0 : 16}px)`, transition: 'opacity 0.5s ease, transform 0.5s ease' }}>
        <h2 className="showcase-title">Smart Analytics</h2>
        <p className="showcase-subtitle">Visualize your spending patterns and track progress toward your goals.</p>
      </div>
      <div className="showcase-cards">
        <GC style={{ gridColumn: '1 / -1', opacity: fade ? 1 : 0, transition: 'opacity 0.5s ease', transitionDelay: '0.1s' }}>
          <div className="sc-label">Spending Overview</div>
          <div className="sc-chart-bars" style={{ height: 100, gap: 3 }}>
            {CHART_DATA.slice(0, bars).map((v, i) => (
              <div key={i} className="sc-bar-wrap" style={{ height: '100%' }}>
                <div className="sc-bar" style={{
                  height: `${(v / 85) * 100}%`,
                  background: i % 2 === 0 ? '#4F8CFF' : '#8B5CF6',
                  transition: 'height 0.5s ease',
                  transitionDelay: `${i * 0.04}s`,
                }} />
              </div>
            ))}
          </div>
        </GC>
        <GC style={{ opacity: fade ? 1 : 0, transition: 'opacity 0.5s ease', transitionDelay: '0.2s' }}>
          <div className="sc-label">Balance</div>
          <div className="sc-value" style={{ fontSize: 20 }}>{fmt(balanceVal)}</div>
          <Sparkline data={CHART_DATA} color="#34D399" w={140} h={28} />
        </GC>
        <GC style={{ opacity: fade ? 1 : 0, transition: 'opacity 0.5s ease', transitionDelay: '0.25s' }}>
          <div className="sc-label">Savings Goal</div>
          <div className="sc-goal-bar" style={{ margin: '8px 0' }}>
            <div className="sc-goal-fill" style={{ width: `${savingsPct}%`, background: '#34D399' }} />
          </div>
          <div className="sc-goal-text" style={{ fontSize: 13, fontWeight: 600 }}>{Math.round(savingsPct)}%</div>
        </GC>
      </div>
    </div>
  );
}

/* ===== SCENE: Features ===== */
function SceneFeatures() {
  const fade = useMountFade(100);

  return (
    <div className="ss-scene">
      <div className="showcase-header" style={{ opacity: fade ? 1 : 0, transform: `translateY(${fade ? 0 : 16}px)`, transition: 'opacity 0.5s ease, transform 0.5s ease' }}>
        <h2 className="showcase-title">Everything You Need</h2>
        <p className="showcase-subtitle">A complete financial toolkit designed for modern life.</p>
      </div>
      <div className="showcase-feat-grid">
        {FEATURES.map((f, i) => (
          <GC key={i} className="sc-feat-card"
            style={{
              opacity: fade ? 1 : 0,
              transform: `translateY(${fade ? 0 : 16}px)`,
              transition: 'opacity 0.5s ease, transform 0.5s ease',
              transitionDelay: `${0.15 + i * 0.12}s`,
            }}>
            <span className="sc-feat-icon">{f.icon}</span>
            <div className="sc-feat-title">{f.title}</div>
            <div className="sc-feat-desc">{f.desc}</div>
          </GC>
        ))}
      </div>
    </div>
  );
}

/* ===== SCENE: Pulse ===== */
function ScenePulse() {
  useMountFade(50);

  return (
    <div className="ss-scene">
      <div className="showcase-header" style={{ opacity: 0.9 }}>
        <h2 className="showcase-title">Always in Sync</h2>
        <p className="showcase-subtitle">Your finances, updated in real time.</p>
      </div>
      <div className="showcase-cards">
        <GC className="sc-nw" style={{ animation: 'ssPulse 2.5s ease-in-out infinite' }}>
          <div className="sc-label">Net Worth</div>
          <div className="sc-value">$28,450</div>
          <div className="sc-change positive">+$1,240 this month</div>
        </GC>
        <GC style={{ animation: 'ssPulse 2.5s ease-in-out infinite 0.3s' }}>
          <div className="sc-label">Total Saved</div>
          <div className="sc-value" style={{ color: '#34D399' }}>$6,240</div>
          <Sparkline data={CHART_DATA} color="#34D399" w={140} h={28} />
        </GC>
        <GC style={{ animation: 'ssPulse 2.5s ease-in-out infinite 0.6s' }}>
          <div className="sc-label">Investments</div>
          <div className="sc-value">$12,800</div>
          <div className="sc-change positive">+$340 today</div>
        </GC>
      </div>
    </div>
  );
}

/* ===== SCENE: Fadeout ===== */
function SceneFadeout() {
  useMountFade(50);

  return (
    <div className="ss-scene">
      <div className="showcase-header">
        <h2 className="showcase-title">Your Financial World</h2>
        <p className="showcase-subtitle">In one place.</p>
      </div>
      <div className="showcase-cards">
        <GC className="sc-nw">
          <div className="sc-label">Net Worth</div>
          <div className="sc-value">$28,450</div>
        </GC>
        <GC>
          <div className="sc-label">Monthly Spending</div>
          <div className="sc-chart-bars" style={{ height: 60, gap: 2 }}>
            {CHART_DATA.slice(0, 8).map((v, i) => (
              <div key={i} className="sc-bar-wrap" style={{ height: '100%' }}>
                <div className="sc-bar" style={{ height: `${(v / 85) * 100}%`, background: i % 2 === 0 ? '#4F8CFF' : '#94A3B8' }} />
              </div>
            ))}
          </div>
        </GC>
        <GC>
          <div className="sc-label">Financial Health</div>
          <div className="sc-health-ring">
            <svg width="56" height="56" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(79,140,255,0.1)" strokeWidth="6" />
              <circle cx="36" cy="36" r="30" fill="none" stroke="#4F8CFF" strokeWidth="6"
                strokeDasharray={`150 188.5`} strokeLinecap="round" transform="rotate(-90 36 36)" />
            </svg>
          </div>
        </GC>
      </div>
    </div>
  );
}

const SCENE_COMPONENTS = {
  dashboard: SceneDashboard,
  transactions: SceneTransactions,
  charts: SceneCharts,
  features: SceneFeatures,
  pulse: ScenePulse,
  fadeout: SceneFadeout,
};

export default function AnimatedShowcase() {
  const [sceneIdx, setSceneIdx] = useState(0);
  const [opacity, setOpacity] = useState(0);

  // Fade in on first mount
  useEffect(() => {
    const enter = setTimeout(() => setOpacity(1), 60);
    return () => clearTimeout(enter);
  }, []);

  // Scene lifecycle: fade-out → switch → fade-in handled on mount
  useEffect(() => {
    const duration = SCENE_DEFS[sceneIdx].duration;

    const out = setTimeout(() => setOpacity(0), duration - FADE_MS);
    const next = setTimeout(() => {
      setSceneIdx(i => (i + 1) % SCENE_DEFS.length);
      // Will re-render with new scene; fade-in triggered by that scene's mount effect
    }, duration);

    return () => { clearTimeout(out); clearTimeout(next); };
  }, [sceneIdx]);

  // Fade in when scene changes
  useEffect(() => {
    const enter = setTimeout(() => setOpacity(1), 60);
    return () => clearTimeout(enter);
  }, [sceneIdx]);

  const Scene = SCENE_COMPONENTS[SCENE_DEFS[sceneIdx].key];

  return (
    <div className="showcase-wrapper">
      <GlowOrbs />
      <div className="showcase-content" style={{ opacity, transition: `opacity ${FADE_MS}ms ease` }}>
        <Scene />
      </div>
      <div className="showcase-indicators">
        {SCENE_DEFS.map((s, i) => (
          <div key={s.key} className={`sc-dot ${i === sceneIdx ? 'active' : ''}`} />
        ))}
      </div>
    </div>
  );
}
