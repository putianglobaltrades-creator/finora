const https = require('https');
const os = require('os');
const { createHash } = require('crypto');

function getHwid() {
  const raw = os.hostname() + os.platform() + (os.userInfo?.().username || 'user') + os.arch();
  return createHash('sha256').update(raw).digest('hex').substring(0, 32);
}

const OWNER_ID = 'oolRt5ONdT';
const APP_NAME = 'Finora';
const APP_SECRET = '59e3c1a824affec6a0ed4a30017905307ad8751deb6902dfc8d7d51cf8dc0a75';
const APP_VERSION = '1.0';
const API_URL = 'https://keyauth.win/api/1.2/';

function post(data) {
  return new Promise((resolve, reject) => {
    const body = Object.entries(data).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
    const u = new URL(API_URL);
    const req = https.request({
      hostname: u.hostname, path: u.pathname, method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10000,
    }, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => resolve(raw));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.write(body);
    req.end();
  });
}

function parse(raw) {
  try { return JSON.parse(raw); } catch {}
  if (raw.includes('#')) {
    const p = raw.split('#');
    return { success: p[0] === 'true', message: p[1], subscription: p[2], level: p[3], expiry: p[4] };
  }
  return { success: false, message: raw };
}

let sessionId = null;

async function ensureInit() {
  if (sessionId) return true;
  try {
    const raw = await post({ type: 'init', ownerid: OWNER_ID, name: APP_NAME, ver: APP_VERSION, secret: APP_SECRET });
    const r = parse(raw);
    if (r.success) { sessionId = r.sessionid || r.message; return true; }
    return false;
  } catch { return false; }
}

async function call(method, extra) {
  if (!await ensureInit()) return { success: false, message: 'Failed to connect to KeyAuth' };
  try {
    const raw = await post({
      type: method, ownerid: OWNER_ID, name: APP_NAME, sessionid: sessionId, hwid: getHwid(),
      ...Object.fromEntries(Object.entries(extra || {}).map(([k, v]) => [k, String(v)])),
    });
    return parse(raw);
  } catch (err) {
    return { success: false, message: err.message || 'Request failed' };
  }
}

async function login(username, password, licenseKey) {
  const r = await call('login', { username, pass: password, key: licenseKey || '' });
  if (r.success) return { success: true, subscription: r.subscription || '', expiry: r.expiry || '', user: { id: username, username, email: r.email || '' } };
  return { success: false, error: r.message || 'Login failed' };
}

async function register(username, password, licenseKey) {
  const r = await call('register', { username, pass: password, key: licenseKey });
  if (r.success) return { success: true, subscription: r.subscription || '', expiry: r.expiry || '', message: 'Registration successful' };
  return { success: false, error: r.message || 'Registration failed' };
}

async function license(licenseKey) {
  const r = await call('license', { key: licenseKey });
  if (r.success) return { success: true, subscription: r.subscription || '', expiry: r.expiry || '' };
  return { success: false, error: r.message || 'Invalid license' };
}

async function fetchUser(username) {
  const r = await call('fetch', { username });
  if (r.success) return { success: true, subscription: r.subscription || '', level: r.level || '', expiry: r.expiry || '' };
  return { success: false, error: r.message || 'User not found' };
}

async function forgot(username, email) {
  const r = await call('forgot', { username, email });
  if (r.success) return { success: true, message: 'Reset email sent' };
  return { success: false, error: r.message || 'Failed to send reset' };
}

module.exports = { login, register, license, fetchUser, forgot };
