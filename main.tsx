import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import initSelectionErrorHandler from './selectionErrorHandler';
import { WalletProvider } from './WalletSystem';

initSelectionErrorHandler();

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WalletProvider>
      <App />
    </WalletProvider>
  </React.StrictMode>
);
