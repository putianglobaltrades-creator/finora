export function generateOHLC(count, startPrice) {
  let p = startPrice || 67000;
  const data = [];
  for (let i = count; i >= 0; i--) {
    const change = (Math.random() - 0.5) * p * 0.008;
    p += change;
    const open = p;
    const move = (Math.random() - 0.5) * p * 0.015;
    const close = p + move;
    const high = Math.max(open, close) + Math.random() * p * 0.006;
    const low = Math.min(open, close) - Math.random() * p * 0.006;
    data.push({ time: new Date(Date.now() - i * 3600000), open, high, low, close, volume: Math.random() * 2000 + 500 });
  }
  return data;
}

export function generatePriceSeries(count, startPrice) {
  let p = startPrice || 67000;
  const data = [];
  for (let i = count; i >= 0; i--) {
    p += (Math.random() - 0.48) * p * 0.01;
    data.push({ time: new Date(Date.now() - i * 3600000), price: p });
  }
  return data;
}

export function formatPrice(v) {
  if (v >= 1000) return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return '$' + v.toFixed(4);
}
