import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { StoreProvider } from './store/StoreContext';
import { ThemeProvider } from './store/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <StoreProvider>
      <ThemeProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </ThemeProvider>
    </StoreProvider>
  </ErrorBoundary>
);
