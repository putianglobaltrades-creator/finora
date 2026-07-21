const { app, BrowserWindow, ipcMain, dialog, shell, net } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
const DATA_DIR = path.join(app.getPath('userData'), 'finora-data');
const DATA_FILE = path.join(DATA_DIR, 'budget.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const LOG_FILE = path.join(DATA_DIR, 'app.log');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function log(level, message) {
  ensureDataDir();
  const entry = `[${new Date().toISOString()}] [${level}] ${message}\n`;
  try { fs.appendFileSync(LOG_FILE, entry); } catch {}
}

function getDefaultData() {
  return {
    users: [],
    transactions: [],
    budgets: [],
    accounts: [],
    categories: [],
    savingsGoals: [],
    recurringPayments: [],
    investments: [],
    limits: {},
    sessions: {},
    profiles: {},
    settings: {
      theme: 'light',
      currency: 'USD',
      language: 'en',
      animations: true,
      notifications: true,
    },
  };
}

function loadData() {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    const data = getDefaultData();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    log('INFO', 'Created default data file');
    return data;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const data = JSON.parse(raw);
    const defaults = getDefaultData();
    return { ...defaults, ...data };
  } catch (err) {
    log('ERROR', `Failed to load data: ${err.message}`);
    return getDefaultData();
  }
}

function saveData(data) {
  ensureDataDir();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    log('INFO', 'Data saved successfully');
    return true;
  } catch (err) {
    log('ERROR', `Failed to save data: ${err.message}`);
    return false;
  }
}

function loadSettings() {
  ensureDataDir();
  if (!fs.existsSync(SETTINGS_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')); } catch { return {}; }
}

function saveSettings(settings) {
  ensureDataDir();
  try { fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2)); return true; } catch { return false; }
}

app.setAppUserModelId('Finora');

function createWindow() {
  const isMac = process.platform === 'darwin';
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    frame: false,
    titleBarStyle: isMac ? 'hiddenInset' : 'hidden',
    title: 'Finora',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    backgroundColor: '#ffffff',
    show: false,
    icon: path.join(__dirname, '..', 'public', 'icon.png'),
  });
  mainWindow.setTitle('Finora');

  const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  log('INFO', `Finora v${app.getVersion()} starting`);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  log('INFO', 'Application shutting down');
});

// Window controls
ipcMain.handle('window:minimize', () => mainWindow?.minimize());
ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
  return mainWindow?.isMaximized();
});
ipcMain.handle('window:close', () => mainWindow?.close());
ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized());

// Data operations
ipcMain.handle('data:load', () => loadData());
ipcMain.handle('data:save', (_, data) => saveData(data));
ipcMain.handle('data:backup', async () => {
  const data = loadData();
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: `finora-backup-${new Date().toISOString().split('T')[0]}.json`,
    filters: [{ name: 'JSON Backup', extensions: ['json'] }],
  });
  if (filePath) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    log('INFO', `Backup saved to ${filePath}`);
    return true;
  }
  return false;
});
ipcMain.handle('data:restore', async () => {
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    filters: [{ name: 'JSON Backup', extensions: ['json'] }],
    properties: ['openFile'],
  });
  if (filePaths?.[0]) {
    try {
      const content = fs.readFileSync(filePaths[0], 'utf8');
      const data = JSON.parse(content);
      saveData(data);
      log('INFO', `Backup restored from ${filePaths[0]}`);
      return { success: true, data };
    } catch (err) {
      log('ERROR', `Failed to restore backup: ${err.message}`);
      return { success: false, error: err.message };
    }
  }
  return null;
});
ipcMain.handle('data:export:csv', async (_, transactions) => {
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: `transactions-export-${new Date().toISOString().split('T')[0]}.csv`,
    filters: [{ name: 'CSV', extensions: ['csv'] }],
  });
  if (filePath) {
    const Papa = require('papaparse');
    const csv = Papa.unparse(transactions);
    fs.writeFileSync(filePath, '\uFEFF' + csv, 'utf8');
    return true;
  }
  return false;
});
ipcMain.handle('data:import:csv', async () => {
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    filters: [{ name: 'CSV', extensions: ['csv'] }, { name: 'JSON', extensions: ['json'] }],
    properties: ['openFile'],
  });
  if (filePaths?.[0]) {
    const content = fs.readFileSync(filePaths[0], 'utf8');
    return { filePath: filePaths[0], content };
  }
  return null;
});

// Settings
ipcMain.handle('settings:load', () => loadSettings());
ipcMain.handle('settings:save', (_, settings) => saveSettings(settings));

// App info
ipcMain.handle('app:version', () => app.getVersion());
ipcMain.handle('app:name', () => 'Finora');
ipcMain.handle('app:dataPath', () => DATA_DIR);
ipcMain.handle('app:logs', () => {
  ensureDataDir();
  if (fs.existsSync(LOG_FILE)) {
    return fs.readFileSync(LOG_FILE, 'utf8');
  }
  return 'No logs available.';
});

// Open external links
ipcMain.handle('shell:openExternal', (_, url) => shell.openExternal(url));

// KeyAuth (runs in Node.js — no CORS issues)
const keyauth = require('./keyauth');
ipcMain.handle('keyauth:login', (_, { username, password, key }) => keyauth.login(username, password, key));
ipcMain.handle('keyauth:register', (_, { username, password, key }) => keyauth.register(username, password, key));
ipcMain.handle('keyauth:license', (_, { key }) => keyauth.license(key));
ipcMain.handle('keyauth:fetch', (_, { username }) => keyauth.fetchUser(username));
ipcMain.handle('keyauth:forgot', (_, { username, email }) => keyauth.forgot(username, email));

// Supabase (main process only — service_role key never exposed to renderer)
const SUPABASE_URL = 'https://qchxwrtehhljkiownfyg.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjaHh3cnRlaGhsamtpb3duZnlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDU4NDc1MCwiZXhwIjoyMTAwMTYwNzUwfQ.WlxlTFsfLc6VQRg2ZQEg_nkI4oq52yW1vXWuWu1Z0Xs';

function supFetch(method, path, body) {
  return new Promise((resolve, reject) => {
    const req = net.request({ method, url: `${SUPABASE_URL}${path}`,
      headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' },
    });
    req.on('response', (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) return reject(new Error(`${res.statusCode}: ${data.slice(0, 300)}`));
        try { resolve(JSON.parse(data)); } catch { resolve(data); }
      });
    });
    req.on('error', reject);
    req.on('abort', () => reject(new Error('aborted')));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

const ALLOWED_TABLES = ['transactions', 'budgets', 'accounts', 'savings_goals', 'recurring_payments', 'investments', 'crypto'];

// Health check — verify Supabase is reachable
ipcMain.handle('supabase:health', async () => {
  try {
    const res = await supFetch('GET', '/rest/v1/profiles?select=id&limit=1');
    log('INFO', `Supabase health check OK`);
    return { success: true };
  } catch (err) {
    log('ERROR', `Supabase health check FAILED: ${err.message}`);
    return { success: false, error: err.message };
  }
});

// Create or update user record (stores KeyAuth info)
ipcMain.handle('supabase:createUser', async (_, { user }) => {
  if (!user?.id) return { success: false, error: 'No user id' };
  try {
    await supFetch('POST', '/rest/v1/profiles', {
      id: user.id,
      username: user.username || user.id,
      email: user.email || '',
      keyauth_username: user.keyauthUsername || user.username || user.id,
      keyauth_key: user.keyauthKey || '',
      last_login: new Date().toISOString(),
      account_created: user.accountCreated || new Date().toISOString(),
      app_version: user.appVersion || '4.2.8',
    });
    log('INFO', `Supabase createUser: ${user.id}`);
    return { success: true };
  } catch (err) {
    log('ERROR', `Supabase createUser: ${err.message}`);
    return { success: false, error: err.message };
  }
});

// Load ALL user data in one call
ipcMain.handle('supabase:loadAll', async (_, { userId }) => {
  if (!userId) return { success: false, error: 'No user ID' };
  const result = {};
  try {
    const results = await Promise.all(ALLOWED_TABLES.map(table =>
      supFetch('GET', `/rest/v1/${table}?user_id=eq.${encodeURIComponent(userId)}&select=*`).then(d => ({ table, data: d || [] }))
    ));
    for (const { table, data } of results) result[table] = data;
    log('INFO', `Supabase loadAll: ${userId} (${ALLOWED_TABLES.length} tables)`);
    return { success: true, data: result };
  } catch (err) {
    log('ERROR', `Supabase loadAll: ${err.message}`);
    return { success: false, error: err.message };
  }
});

// Upsert rows into a table
ipcMain.handle('supabase:sync', async (_, { table, rows }) => {
  if (!ALLOWED_TABLES.includes(table)) return { success: false, error: `Invalid table: ${table}` };
  if (!rows || !rows.length) return { success: true };
  try {
    await supFetch('POST', `/rest/v1/${table}`, rows);
    log('INFO', `Supabase sync ${table}: ${rows.length} rows`);
    return { success: true };
  } catch (err) {
    log('ERROR', `Supabase sync ${table}: ${err.message}`);
    return { success: false, error: err.message };
  }
});

// Delete rows by IDs
ipcMain.handle('supabase:delete', async (_, { table, ids }) => {
  if (!ALLOWED_TABLES.includes(table)) return { success: false, error: `Invalid table: ${table}` };
  if (!ids || !ids.length) return { success: true };
  try {
    const idList = ids.map(id => `id=eq.${encodeURIComponent(id)}`).join(',');
    await supFetch('DELETE', `/rest/v1/${table}?${idList}`);
    log('INFO', `Supabase delete ${table}: ${ids.length} rows`);
    return { success: true };
  } catch (err) {
    log('ERROR', `Supabase delete ${table}: ${err.message}`);
    return { success: false, error: err.message };
  }
});

// Upsert settings (special handling — uses DELETE+INSERT for SERIAL PK)
ipcMain.handle('supabase:upsertSettings', async (_, { userId, settings }) => {
  if (!userId) return { success: false, error: 'No user ID' };
  try {
    await supFetch('DELETE', `/rest/v1/settings?user_id=eq.${encodeURIComponent(userId)}`);
    await supFetch('POST', '/rest/v1/settings', { user_id: userId, ...settings });
    log('INFO', `Supabase upsertSettings: ${userId}`);
    return { success: true };
  } catch (err) {
    log('ERROR', `Supabase upsertSettings: ${err.message}`);
    return { success: false, error: err.message };
  }
});

// Upsert opening_balances (special handling — same SERIAL PK issue)
ipcMain.handle('supabase:upsertBalances', async (_, { userId, balances }) => {
  if (!userId) return { success: false, error: 'No user ID' };
  try {
    await supFetch('DELETE', `/rest/v1/opening_balances?user_id=eq.${encodeURIComponent(userId)}`);
    await supFetch('POST', '/rest/v1/opening_balances', { user_id: userId, ...balances });
    log('INFO', `Supabase upsertBalances: ${userId}`);
    return { success: true };
  } catch (err) {
    log('ERROR', `Supabase upsertBalances: ${err.message}`);
    return { success: false, error: err.message };
  }
});

// Load profile for a user
ipcMain.handle('supabase:loadProfile', async (_, { userId }) => {
  if (!userId) return { success: false, error: 'No user ID' };
  try {
    const res = await supFetch('GET', `/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=*`);
    log('INFO', `Supabase loadProfile: ${userId}`);
    return { success: true, data: res?.[0] || null };
  } catch (err) {
    log('ERROR', `Supabase loadProfile: ${err.message}`);
    return { success: false, error: err.message };
  }
});

// Load settings for a user
ipcMain.handle('supabase:loadSettings', async (_, { userId }) => {
  if (!userId) return { success: false, error: 'No user ID' };
  try {
    const res = await supFetch('GET', `/rest/v1/settings?user_id=eq.${encodeURIComponent(userId)}&select=*`);
    log('INFO', `Supabase loadSettings: ${userId}`);
    return { success: true, data: res?.[0] || null };
  } catch (err) {
    log('ERROR', `Supabase loadSettings: ${err.message}`);
    return { success: false, error: err.message };
  }
});

// Upsert profile
ipcMain.handle('supabase:upsertProfile', async (_, { profile }) => {
  if (!profile?.id) return { success: false, error: 'No profile id' };
  try {
    await supFetch('POST', '/rest/v1/profiles', profile);
    log('INFO', `Supabase upsertProfile: ${profile.id}`);
    return { success: true };
  } catch (err) {
    log('ERROR', `Supabase upsertProfile: ${err.message}`);
    return { success: false, error: err.message };
  }
});
