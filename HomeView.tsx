/**
 * HomeView.tsx
 * Vista de inicio extraída de App.tsx.
 * Recibe todo por props — sin estado propio, sin efectos.
 * Esto reduce App.tsx en ~243 líneas.
 */

import React from 'react';

interface HomeViewProps {
  viewPadding:          { top: string; bottom: string; left: string; right: string };
  homeLayout:           string;
  userBalance:          number;
  isBalanceVisible:     (key: string) => boolean;
  toggleBalanceVisible: (key: string) => void;
  setCurrentView:       (view: string) => void;
  setPreviousView:      (view: string) => void;
  currentView:          string;
  renderIcon:           (icon: string, size: number) => React.ReactNode;
}

export const HomeView: React.FC<HomeViewProps> = React.memo(({
  viewPadding,
  homeLayout,
  userBalance,
  isBalanceVisible,
  toggleBalanceVisible,
  setCurrentView,
  setPreviousView,
  currentView,
  renderIcon,
}) => {
  const containerStyle: React.CSSProperties = {
    paddingTop:    viewPadding.top,
    paddingLeft:   '16px',
    paddingRight:  '16px',
    paddingBottom: viewPadding.bottom,
    height:        '100vh',
    overflowY:     'auto',
    background:    'transparent',
  };

  // ── Layout: Minimal ──────────────────────────────────────────────
  if (homeLayout === 'minimal') return (
    <div style={containerStyle}>
      <div style={{ background: 'linear-gradient(135deg,#1A3A6B,#0E5F8A,#0A7A8A)', borderRadius: '20px', padding: '20px 18px 18px', boxShadow: '0 6px 24px rgba(14,95,138,0.25)' }}>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', marginBottom: '6px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Saldo disponible</div>
        <div style={{ fontSize: '32px', fontWeight: '800', color: '#fff', marginBottom: '18px', letterSpacing: '-1px', cursor: 'pointer' }}
          onClick={() => toggleBalanceVisible('home-minimal')}>
          {isBalanceVisible('home-minimal')
            ? <>{userBalance.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.6)' }}>XAF</span></>
            : <span style={{ letterSpacing: '4px', color: 'rgba(255,255,255,0.4)' }}>● ● ● ●</span>}
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginLeft: '8px' }}>
            {isBalanceVisible('home-minimal') ? '🙈' : '👁'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setCurrentView('monedero')} style={{ flex: 1, background: 'rgba(255,255,255,0.92)', border: 'none', color: '#1A2B4A', padding: '11px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
            RECARGAR
          </button>
          <button onClick={() => setCurrentView('monedero')} style={{ flex: 1, background: 'rgba(255,255,255,0.92)', border: 'none', color: '#1A2B4A', padding: '11px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
            ENVIAR
          </button>
        </div>
      </div>
    </div>
  );

  // ── Layout: Compact ──────────────────────────────────────────────
  if (homeLayout === 'compact') return (
    <div style={containerStyle}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {[
          { label: 'Mensajes', icon: 'mensajes', view: 'Mensajería', color: '#00b4e6' },
          { label: 'Cartera',  icon: 'wallet',   view: 'monedero',   color: '#00c8a0' },
          { label: 'Servicios',icon: 'services', view: 'servicios',  color: '#8b5cf6' },
          { label: 'Noticias', icon: 'noticias', view: 'news',       color: '#ef4444' },
          { label: 'ID Digital',icon:'id-card',  view: 'id-digital', color: '#f59e0b' },
          { label: 'Ajustes',  icon: 'ajustes',  view: 'ajustes',    color: '#6b7280' },
        ].map(item => (
          <button key={item.view} onClick={() => setCurrentView(item.view)}
            style={{ background: 'rgba(243,244,246,0.85)', border: `1.5px solid ${item.color}30`, borderRadius: '12px', padding: '16px 8px', cursor: 'pointer', outline: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ color: item.color }}>{renderIcon(item.icon, 22)}</div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#0d0d0d' }}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  // ── Layout: News ─────────────────────────────────────────────────
  if (homeLayout === 'news') return (
    <div style={containerStyle}>
      <div style={{ background: 'rgba(243,244,246,0.85)', borderRadius: '12px', padding: '14px', marginBottom: '12px', border: '1px solid rgba(0,0,0,0.07)' }}>
        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>SALDO</div>
        <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#0d0d0d' }}>{userBalance.toLocaleString()} XAF</div>
      </div>
      <div style={{ fontSize: '12px', fontWeight: '700', color: '#0d0d0d', marginBottom: '10px' }}>ÚLTIMAS NOTICIAS</div>
      {['Nuevas inversiones en Malabo', 'Actualización del sistema bancario', 'Festival cultural de Bata'].map((n, i) => (
        <button key={i} onClick={() => setCurrentView('news')}
          style={{ width: '100%', background: 'rgba(243,244,246,0.85)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '10px', padding: '12px', marginBottom: '8px', cursor: 'pointer', outline: 'none', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
          <span style={{ fontSize: '12px', color: '#0d0d0d', fontWeight: '500' }}>{n}</span>
        </button>
      ))}
    </div>
  );

  // ── Layout: Finance ──────────────────────────────────────────────
  if (homeLayout === 'finance') return (
    <div style={containerStyle}>
      <div style={{ background: 'linear-gradient(135deg,#1A3A6B,#0E5F8A,#0A7A8A)', borderRadius: '16px', padding: '16px', marginBottom: '12px', boxShadow: '0 6px 24px rgba(14,95,138,0.25)' }}>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', marginBottom: '4px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Saldo Total</div>
        <div style={{ fontSize: '28px', fontWeight: '800', color: '#fff', marginBottom: '14px', cursor: 'pointer' }} onClick={() => toggleBalanceVisible('home-finance')}>
          {isBalanceVisible('home-finance')
            ? <>{userBalance.toLocaleString()} <span style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)' }}>XAF</span></>
            : <span style={{ letterSpacing: '4px', color: 'rgba(255,255,255,0.4)' }}>● ● ● ●</span>}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['RECARGAR','ENVIAR','HISTORIAL'].map(lbl => (
            <button key={lbl} onClick={() => setCurrentView('monedero')}
              style={{ flex: 1, background: 'rgba(255,255,255,0.92)', border: 'none', color: '#1A2B4A', padding: '9px 6px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
              {lbl}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Layout: Default / Cards ──────────────────────────────────────
  const APPS = [
    { id: 'estados',  label: 'Estados', bg: '#FFF0F7', border: '#FECDD3', stroke: '#DB2777' },
    { id: 'apuestas', label: 'Juegos',  bg: '#F5F0FF', border: '#DDD6FE', stroke: '#7C3AED' },
    { id: 'cemac',    label: 'Cemac',   bg: '#F0FDF4', border: '#BBF7D0', stroke: '#059669' },
    { id: 'mitaxi',   label: 'MiTaxi', bg: '#FFFBEB', border: '#FDE68A', stroke: '#D97706' },
  ] as const;

  return (
    <div style={{
      paddingTop: viewPadding.top, paddingLeft: viewPadding.left,
      paddingRight: viewPadding.right, paddingBottom: viewPadding.bottom,
      height: '100vh', overflowY: 'auto', overflowX: 'hidden',
      background: 'transparent', display: 'flex', flexDirection: 'column',
    }}>
      {/* Tarjeta de balance */}
      <div style={{ background: 'linear-gradient(160deg,#0d3b6e 0%,#0a5a8a 55%,#0a7a8a 100%)', borderRadius: '18px', padding: '20px 18px 18px', marginBottom: '12px', boxShadow: '0 8px 28px rgba(10,90,138,0.30)' }}>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Saldo disponible</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', cursor: 'pointer', userSelect: 'none' }}
          onClick={() => toggleBalanceVisible('home-default')}>
          {isBalanceVisible('home-default')
            ? <span style={{ fontSize: '30px', fontWeight: '800', color: '#fff', letterSpacing: '-1px', lineHeight: 1 }}>{userBalance.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.55)' }}>XAF</span></span>
            : <>{[0,1,2,3].map(i => <div key={i} style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)' }} />)}</>
          }
          <div style={{ marginLeft: 'auto', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round">
              {isBalanceVisible('home-default')
                ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
            </svg>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setCurrentView('monedero')} style={{ flex: 1, background: '#fff', border: 'none', color: '#1A2B4A', padding: '11px 8px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }}>
            RECARGAR
          </button>
          <button onClick={() => setCurrentView('monedero')} style={{ flex: 1, background: '#fff', border: 'none', color: '#1A2B4A', padding: '11px 8px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }}>
            ENVIAR
          </button>
        </div>
      </div>

      {/* ID Digital + Noticias */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
        <button onClick={() => setCurrentView('id-digital')} style={{ background: '#fff', borderRadius: '12px', padding: '14px', border: '1px solid #EAECF0', cursor: 'pointer', textAlign: 'left', outline: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>ID Digital</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Verificado ✓</div>
        </button>
        <button onClick={() => setCurrentView('news')} style={{ background: '#fff', borderRadius: '12px', padding: '14px', border: '1px solid #EAECF0', cursor: 'pointer', textAlign: 'left', outline: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>Noticias</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>8 nuevas</div>
        </button>
      </div>

      {/* Apps */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '12px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Apps</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', justifyItems: 'center' }}>
          {APPS.map(item => (
            <button key={item.id} onClick={() => { setPreviousView(currentView); setCurrentView(item.id); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', outline: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px', padding: '4px 0', width: '100%', WebkitTapHighlightColor: 'transparent' }}>
              <div style={{ width: '62px', height: '62px', borderRadius: '16px', background: item.bg, border: `1.5px solid ${item.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {renderIcon(item.id, 28)}
              </div>
              <span style={{ fontSize: '12px', color: '#374151', fontWeight: '600', textAlign: 'center', lineHeight: '1.2' }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

HomeView.displayName = 'HomeView';
