import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Wake up Render backend on load (free tier sleeps after 15 min)
const API_URL = import.meta.env.VITE_ADMIN_API_URL || 'https://egchat-api.onrender.com';
fetch(`${API_URL}/health`).catch(() => {});

// Top-level error boundary to catch white/black screen crashes
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: string | null }
> {
  constructor(p: any) { super(p); this.state = { error: null }; }
  static getDerivedStateFromError(e: Error) { return { error: e.message + '\n' + e.stack }; }
  render() {
    if (this.state.error) return (
      <div style={{ padding: 32, background: '#0a0f1a', minHeight: '100vh', color: '#f1f5f9', fontFamily: 'monospace' }}>
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef444450', borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#ef4444', marginBottom: 12 }}>
            ⚠️ Error de inicialización del portal
          </div>
          <pre style={{ color: '#94a3b8', fontSize: 12, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {this.state.error}
          </pre>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            style={{ marginTop: 16, padding: '8px 20px', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>
            Recargar
          </button>
        </div>
      </div>
    );
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <RootErrorBoundary>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </RootErrorBoundary>
);
