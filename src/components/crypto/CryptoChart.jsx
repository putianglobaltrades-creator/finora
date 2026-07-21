import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts';
import { generateOHLC, generatePriceSeries, formatPrice } from '../../utils/cryptoData';

const TIME_RANGES = [
  { key: '1H', hours: 1, interval: 1 },
  { key: '1D', hours: 24, interval: 1 },
  { key: '1W', hours: 168, interval: 6 },
  { key: '1M', hours: 720, interval: 12 },
  { key: '3M', hours: 2160, interval: 24 },
  { key: '6M', hours: 4320, interval: 48 },
  { key: '1Y', hours: 8640, interval: 96 },
  { key: 'ALL', hours: 17280, interval: 168 },
];

const CHART_TYPES = [
  { key: 'line', label: 'Line' },
  { key: 'area', label: 'Area' },
  { key: 'candle', label: 'Candle' },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="ct-tooltip">
      <div className="ct-tt-time">{d.time?.toLocaleString?.() || new Date(label).toLocaleString()}</div>
      <div className="ct-tt-price">{formatPrice(d.close || d.price || 0)}</div>
    </div>
  );
}

function CandlestickSVG({ data, width, height }) {
  if (!data?.length || !width || !height) return null;
  const min = Math.min(...data.map(d => d.low)) * 0.998;
  const max = Math.max(...data.map(d => d.high)) * 1.002;
  const range = max - min || 1;
  const pad = { top: 20, right: 16, bottom: 32, left: 56 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;
  const candleW = Math.max(chartW / data.length - 2, 2);
  const step = chartW / (data.length - 1);
  const scaleY = (v) => pad.top + chartH - ((v - min) / range) * chartH;
  const scaleX = (i) => pad.left + step * i;

  const [tooltip, setTooltip] = useState(null);
  const [mouseX, setMouseX] = useState(null);
  const svgRef = useRef(null);

  const handleMouse = useCallback((e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setMouseX(mx);
    const idx = Math.round((mx - pad.left) / step);
    if (idx >= 0 && idx < data.length) {
      setTooltip({ data: data[idx], x: Math.min(scaleX(idx) + 12, width - 160), y: Math.max(my - 60, 10) });
    }
  }, [data, step, pad.left, width]);

  const handleLeave = () => { setTooltip(null); setMouseX(null); };

  const ticks = 5;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => min + (range / ticks) * i);
  const xLabelCount = Math.min(data.length, 6);
  const xStep = Math.max(1, Math.floor(data.length / xLabelCount));

  return (
    <svg ref={svgRef} width={width} height={height} onMouseMove={handleMouse} onMouseLeave={handleLeave} style={{ display: 'block', cursor: 'crosshair' }}>
      <defs><linearGradient id="candleGrid" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(148,163,184,0.08)" /><stop offset="100%" stopColor="rgba(148,163,184,0.02)" /></linearGradient></defs>
      {yTicks.map((v, i) => (
        <g key={i}>
          <line x1={pad.left} y1={scaleY(v)} x2={width - pad.right} y2={scaleY(v)} stroke="rgba(148,163,184,0.1)" strokeWidth="1" />
          <text x={pad.left - 8} y={scaleY(v) + 4} textAnchor="end" fill="#94A3B8" fontSize="11">{formatPrice(v)}</text>
        </g>
      ))}
      {data.filter((_, i) => i % xStep === 0).map((d, i) => (
        <text key={i} x={scaleX(data.indexOf(d))} y={height - 8} textAnchor="middle" fill="#94A3B8" fontSize="10">
          {d.time.toLocaleDateString?.('en-US', { month: 'short', day: 'numeric' }) || ''}
        </text>
      ))}
      {data.map((d, i) => {
        const isUp = d.close >= d.open;
        const color = isUp ? '#34D399' : '#EF4444';
        const bodyTop = isUp ? d.close : d.open;
        const bodyBottom = isUp ? d.open : d.close;
        const cx = scaleX(i);
        return (
          <g key={i}>
            <line x1={cx} y1={scaleY(d.high)} x2={cx} y2={scaleY(d.low)} stroke={color} strokeWidth="1.2" />
            <rect x={cx - candleW / 2} y={scaleY(bodyTop)} width={candleW} height={Math.max(scaleY(bodyBottom) - scaleY(bodyTop), 1)} fill={color} rx="1" />
          </g>
        );
      })}
      {mouseX && <line x1={mouseX} y1={pad.top} x2={mouseX} y2={height - pad.bottom} stroke="rgba(148,163,184,0.3)" strokeWidth="1" strokeDasharray="4 2" />}
      {tooltip && (
        <g>
          <rect x={tooltip.x} y={tooltip.y} width="150" height="72" rx="8" fill="rgba(15,23,42,0.95)" />
          <text x={tooltip.x + 12} y={tooltip.y + 18} fill="#94A3B8" fontSize="10">
            {tooltip.data.time.toLocaleString?.('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) || ''}
          </text>
          <text x={tooltip.x + 12} y={tooltip.y + 38} fill="white" fontSize="14" fontWeight="600">{formatPrice(tooltip.data.close)}</text>
          <text x={tooltip.x + 12} y={tooltip.y + 56} fill={tooltip.data.close >= tooltip.data.open ? '#34D399' : '#EF4444'} fontSize="11">
            {tooltip.data.close >= tooltip.data.open ? '▲' : '▼'} {tooltip.data.close >= tooltip.data.open ? '+' : '-'}{Math.abs(((tooltip.data.close - tooltip.data.open) / tooltip.data.open) * 100).toFixed(2)}%
          </text>
        </g>
      )}
    </svg>
  );
}

export default function CryptoChart({ coinId, currentPrice, change24h }) {
  const [timeRange, setTimeRange] = useState('1D');
  const [chartType, setChartType] = useState('candle');
  const containerRef = useRef(null);
  const [dim, setDim] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect;
      setDim({ w: Math.floor(width), h: 300 });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const range = TIME_RANGES.find(r => r.key === timeRange);
  const count = Math.max(20, range.hours / range.interval);
  const basePrice = currentPrice || 67000;

  const ohlcData = useMemo(() => generateOHLC(count, basePrice), [timeRange, coinId, basePrice]);
  const lineData = useMemo(() => generatePriceSeries(count, basePrice), [timeRange, coinId, basePrice]);

  const displayData = chartType === 'candle' ? ohlcData : lineData;
  const minP = Math.min(...displayData.map(d => chartType === 'candle' ? d.low : d.price)) * 0.999;
  const maxP = Math.max(...displayData.map(d => chartType === 'candle' ? d.high : d.price)) * 1.001;
  const lastClose = ohlcData[ohlcData.length - 1]?.close || basePrice;
  const firstOpen = ohlcData[0]?.open || basePrice;

  return (
    <div className="cc-wrap">
      <div className="cc-header">
        <div className="cc-price-info">
          <div className="cc-price-label">{coinId ? coinId.charAt(0).toUpperCase() + coinId.slice(1) : 'Bitcoin'}</div>
          <div className="cc-price-main">{formatPrice(currentPrice || lastClose)}</div>
          <div className={`cc-price-change ${(lastClose - firstOpen) >= 0 ? 'green' : 'red'}`}>
            {((lastClose - firstOpen) / firstOpen * 100) >= 0 ? '+' : ''}{((lastClose - firstOpen) / firstOpen * 100).toFixed(2)}%
          </div>
        </div>
        <div className="cc-controls">
          <div className="cc-chart-types">
            {CHART_TYPES.map(t => (
              <button key={t.key} className={`cc-type-btn ${chartType === t.key ? 'active' : ''}`} onClick={() => setChartType(t.key)}>{t.label}</button>
            ))}
          </div>
          <div className="cc-time-ranges">
            {TIME_RANGES.map(r => (
              <button key={r.key} className={`cc-range-btn ${timeRange === r.key ? 'active' : ''}`} onClick={() => setTimeRange(r.key)}>{r.key}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="cc-chart-area" ref={containerRef}>
        {dim.w === 0 ? (
          <div className="cc-loading"><div className="cc-loading-bar" /></div>
        ) : chartType === 'candle' ? (
          <CandlestickSVG data={ohlcData} width={dim.w} height={dim.h} />
        ) : chartType === 'line' ? (
          <ResponsiveContainer width="100%" height={dim.h}>
            <LineChart data={lineData} margin={{ top: 12, right: 12, bottom: 8, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis dataKey="time" tick={{ fill: '#94A3B8', fontSize: 10 }} tickFormatter={t => new Date(t).toLocaleTimeString?.('en-US', { hour: '2-digit', minute: '2-digit' }) || ''} axisLine={false} tickLine={false} />
              <YAxis domain={[minP, maxP]} tick={{ fill: '#94A3B8', fontSize: 10 }} tickFormatter={formatPrice} axisLine={false} tickLine={false} width={56} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(148,163,184,0.3)', strokeDasharray: '4 2' }} />
              <ReferenceLine y={lastClose} stroke="var(--primary)" strokeDasharray="4 4" strokeOpacity={0.4} />
              <Line type="monotone" dataKey="price" stroke="var(--primary)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: 'var(--primary)', stroke: 'white', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={dim.h}>
            <AreaChart data={lineData} margin={{ top: 12, right: 12, bottom: 8, left: 8 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" /><stop offset="100%" stopColor="var(--primary)" stopOpacity="0" /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis dataKey="time" tick={{ fill: '#94A3B8', fontSize: 10 }} tickFormatter={t => new Date(t).toLocaleTimeString?.('en-US', { hour: '2-digit', minute: '2-digit' }) || ''} axisLine={false} tickLine={false} />
              <YAxis domain={[minP, maxP]} tick={{ fill: '#94A3B8', fontSize: 10 }} tickFormatter={formatPrice} axisLine={false} tickLine={false} width={56} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(148,163,184,0.3)', strokeDasharray: '4 2' }} />
              <ReferenceLine y={lastClose} stroke="var(--primary)" strokeDasharray="4 4" strokeOpacity={0.4} />
              <Area type="monotone" dataKey="price" stroke="var(--primary)" strokeWidth={2} fill="url(#areaGrad)" dot={false} activeDot={{ r: 4, fill: 'var(--primary)', stroke: 'white', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
