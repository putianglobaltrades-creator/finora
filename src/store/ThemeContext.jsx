import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

const LIGHT_THEME = {
  '--primary': '#4F8CFF',
  '--primary-light': '#7BA7FF',
  '--primary-dark': '#3A6FD6',
  '--primary-glow': 'rgba(79, 140, 255, 0.2)',
  '--secondary': '#67E8F9',
  '--success': '#34D399',
  '--success-bg': 'rgba(52, 211, 153, 0.12)',
  '--danger': '#EF4444',
  '--danger-bg': 'rgba(239, 68, 68, 0.12)',
  '--warning': '#F59E0B',
  '--warning-bg': 'rgba(245, 158, 11, 0.12)',
  '--bg-primary': '#FFFFFF',
  '--bg-secondary': '#F8FAFC',
  '--bg-tertiary': '#F1F5F9',
  '--bg-card': 'rgba(255, 255, 255, 0.72)',
  '--bg-card-hover': 'rgba(255, 255, 255, 0.88)',
  '--bg-glass': 'rgba(255, 255, 255, 0.6)',
  '--bg-glass-strong': 'rgba(255, 255, 255, 0.85)',
  '--bg-sidebar': 'rgba(248, 250, 252, 0.85)',
  '--bg-titlebar': 'rgba(255, 255, 255, 0.9)',
  '--bg-tooltip': 'rgba(15, 23, 42, 0.9)',
  '--bg-input': 'rgba(241, 245, 249, 0.8)',
  '--border-color': 'rgba(79, 140, 255, 0.2)',
  '--border-subtle': 'rgba(148, 163, 184, 0.2)',
  '--border-light': 'rgba(226, 232, 240, 0.6)',
  '--text-primary': '#0F172A',
  '--text-secondary': '#475569',
  '--text-muted': '#94A3B8',
  '--chart-grid': '#E2E8F0',
  '--shadow-sm': '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
  '--shadow-md': '0 4px 16px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
  '--shadow-lg': '0 8px 32px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)',
  '--shadow-xl': '0 20px 60px rgba(0,0,0,0.1), 0 8px 24px rgba(0,0,0,0.06)',
  '--shadow-glow': '0 0 24px rgba(79, 140, 255, 0.25)',
  '--shadow-glass': '0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
  '--shadow-glass-hover': '0 12px 40px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9)',
};

const DARK_THEME = {
  '--primary': '#4F8CFF',
  '--primary-light': '#7BA7FF',
  '--primary-dark': '#3A6FD6',
  '--primary-glow': 'rgba(79, 140, 255, 0.25)',
  '--secondary': '#67E8F9',
  '--success': '#34D399',
  '--success-bg': 'rgba(52, 211, 153, 0.15)',
  '--danger': '#EF4444',
  '--danger-bg': 'rgba(239, 68, 68, 0.15)',
  '--warning': '#F59E0B',
  '--warning-bg': 'rgba(245, 158, 11, 0.15)',
  '--bg-primary': '#0A0E17',
  '--bg-secondary': '#111827',
  '--bg-tertiary': '#1A2234',
  '--bg-card': 'rgba(26, 34, 52, 0.75)',
  '--bg-card-hover': 'rgba(30, 41, 59, 0.85)',
  '--bg-glass': 'rgba(15, 23, 42, 0.6)',
  '--bg-glass-strong': 'rgba(15, 23, 42, 0.85)',
  '--bg-sidebar': 'rgba(17, 24, 39, 0.85)',
  '--bg-titlebar': 'rgba(17, 24, 39, 0.9)',
  '--bg-tooltip': 'rgba(15, 23, 42, 0.95)',
  '--bg-input': 'rgba(30, 41, 59, 0.8)',
  '--border-color': 'rgba(79, 140, 255, 0.15)',
  '--border-subtle': 'rgba(148, 163, 184, 0.1)',
  '--border-light': 'rgba(51, 65, 85, 0.4)',
  '--text-primary': '#F1F5F9',
  '--text-secondary': '#94A3B8',
  '--text-muted': '#64748B',
  '--chart-grid': '#1E293B',
  '--shadow-sm': '0 1px 3px rgba(0,0,0,0.3)',
  '--shadow-md': '0 4px 16px rgba(0,0,0,0.4)',
  '--shadow-lg': '0 8px 32px rgba(0,0,0,0.5)',
  '--shadow-xl': '0 20px 60px rgba(0,0,0,0.6)',
  '--shadow-glow': '0 0 24px rgba(79, 140, 255, 0.3)',
  '--shadow-glass': '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
  '--shadow-glass-hover': '0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('finora_theme') || 'light'; }
    catch { return 'light'; }
  });

  useEffect(() => {
    const vars = theme === 'dark' ? DARK_THEME : LIGHT_THEME;
    const root = document.documentElement;
    Object.entries(vars).forEach(([key, val]) => root.style.setProperty(key, val));
    try { localStorage.setItem('finora_theme', theme); } catch {}
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
