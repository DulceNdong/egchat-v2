import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import initSelectionErrorHandler from './selectionErrorHandler';

// Initialize error handlers before mounting the app
initSelectionErrorHandler();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
