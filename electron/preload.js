const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('finora', {
  // Window
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),

  // Data
  loadData: () => ipcRenderer.invoke('data:load'),
  saveData: (d) => ipcRenderer.invoke('data:save', d),
  backup: () => ipcRenderer.invoke('data:backup'),
  restore: () => ipcRenderer.invoke('data:restore'),
  exportCSV: (tx) => ipcRenderer.invoke('data:export:csv', tx),
  importCSV: () => ipcRenderer.invoke('data:import:csv'),

  // Settings
  loadSettings: () => ipcRenderer.invoke('settings:load'),
  saveSettings: (s) => ipcRenderer.invoke('settings:save', s),

  // App
  getVersion: () => ipcRenderer.invoke('app:version'),
  getName: () => ipcRenderer.invoke('app:name'),
  getDataPath: () => ipcRenderer.invoke('app:dataPath'),
  getLogs: () => ipcRenderer.invoke('app:logs'),
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),

  // KeyAuth (runs in main process — no CORS)
  keyauth: {
    login: (u, p, k) => ipcRenderer.invoke('keyauth:login', { username: u, password: p, key: k }),
    register: (u, p, k) => ipcRenderer.invoke('keyauth:register', { username: u, password: p, key: k }),
    license: (k) => ipcRenderer.invoke('keyauth:license', { key: k }),
    fetch: (u) => ipcRenderer.invoke('keyauth:fetch', { username: u }),
    forgot: (u, e) => ipcRenderer.invoke('keyauth:forgot', { username: u, email: e }),
  },

  // Supabase (main process only — keys never exposed)
  supabase: {
    health: () => ipcRenderer.invoke('supabase:health'),
    createUser: (user) => ipcRenderer.invoke('supabase:createUser', { user }),
    loadAll: (userId) => ipcRenderer.invoke('supabase:loadAll', { userId }),
    loadProfile: (userId) => ipcRenderer.invoke('supabase:loadProfile', { userId }),
    loadSettings: (userId) => ipcRenderer.invoke('supabase:loadSettings', { userId }),
    sync: (table, rows) => ipcRenderer.invoke('supabase:sync', { table, rows }),
    delete: (table, ids) => ipcRenderer.invoke('supabase:delete', { table, ids }),
    upsertSettings: (userId, settings) => ipcRenderer.invoke('supabase:upsertSettings', { userId, settings }),
    upsertBalances: (userId, balances) => ipcRenderer.invoke('supabase:upsertBalances', { userId, balances }),
    upsertProfile: (profile) => ipcRenderer.invoke('supabase:upsertProfile', { profile }),
  },
});
