import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Wake up Render backend on load (free tier sleeps after 15 min)
const API_URL = import.meta.env.VITE_ADMIN_API_URL || 'https://egchat-api.onrender.com';
fetch(`${API_URL}/health`).catch(() => {});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
