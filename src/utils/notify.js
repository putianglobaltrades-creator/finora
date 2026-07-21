let container = null;
function getContainer() {
  if (!container) {
    container = document.createElement('div');
    container.id = 'finora-notifications';
    container.style.cssText = 'position:fixed;top:60px;right:20px;z-index:99999;display:flex;flex-direction:column;gap:8px;pointer-events:none';
    document.body.appendChild(container);
  }
  return container;
}
export function notify(title, message, type) {
  const el = document.createElement('div');
  el.style.cssText = `display:flex;align-items:center;gap:12px;padding:14px 18px;border-radius:12px;background:rgba(255,255,255,0.95);backdrop-filter:blur(24px);border:1px solid rgba(0,0,0,0.08);box-shadow:0 8px 32px rgba(0,0,0,0.12);pointer-events:auto;min-width:300px;max-width:420px;animation:notificationSlide 3.5s cubic-bezier(0.16,1,0.3,1) forwards;color:#1e293b`;
  if (type === 'success') el.style.borderLeft = '4px solid #34D399';
  else if (type === 'error') el.style.borderLeft = '4px solid #EF4444';
  else el.style.borderLeft = '4px solid #4F8CFF';
  el.innerHTML = `<div style="flex:1"><div style="font-size:13px;font-weight:600">${title}</div><div style="font-size:12px;color:#64748b;margin-top:1px">${message}</div></div>`;
  getContainer().appendChild(el);
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(700, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.08);
  } catch (e) {}
  setTimeout(() => { if (el.parentNode) el.remove(); }, 3500);
}
