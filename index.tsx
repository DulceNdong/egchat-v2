import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Interceptor global desactivado:
// estaba forzando logout ante ciertos 401 secundarios.

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
