/**
 * ProviderServicesDashboard.tsx
 * Panel de Servicios adaptado a cada proveedor
 *
 * Para SEGESA (electricidad):  pedidos de pago de facturas por contrato/medidor
 * Para GETESA/GECOMSA (recarga): pedidos de recarga móvil y datos
 * Para Canal Sol, Canal+ (canales): suscripciones a paquetes de TV
 * etc.
 *
 * Muestra los pedidos que los usuarios de EgChat han realizado,
 * con los datos específicos de cada servicio.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

interface Props {
  isAuthenticated: boolean;
  onBack: () => void;
  viewPadding: { top: string; bottom: string };
  userProfile: any;
}

const API_BASE = ((import.meta as any).env?.VITE_API_URL || 'https://egchat-api.onrender.com').replace(/\/+$/, '');
const getToken = () => localStorage.getItem('token') || '';
const apiFetch = (path: string, opts?: RequestInit) =>
  fetch(`${API_BASE}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...(opts?.headers || {}) } });

// Colores por categoría de proveedor
const CAT_THEME: Record<string, { color: string; bg: string; label: string; icon: string }> = {
  facturas:      { color: '#F59E0B', bg: '#FFF7E6', label: 'Pago de facturas', icon: '⚡' },
  electricidad:  { color: '#F59E0B', bg: '#FFF7E6', label: 'Electricidad',     icon: '⚡' },
  recarga:       { color: '#2E9E6B', bg: '#F0FAF5', label: 'Recarga móvil',    icon: '📱' },
  internet:      { color: '#1485EE', bg: '#EFF5FD', label: 'Internet',          icon: '🌐' },
  canales:       { color: '#722ED1', bg: '#F3E8FF', label: 'Canales TV',        icon: '📺' },
  agua:          { color: '#0EA5E9', bg: '#E0F7FA', label: 'Agua',              icon: '💧' },
  banco:         { color: '#003082', bg: '#EBF0FF', label: 'Servicios bancarios',icon: '🏦' },
  seguros:       { color: '#10B981', bg: '#F0FAF5', label: 'Seguros',           icon: '🛡️' },
  transporte:    { color: '#8B5CF6', bg: '#F3E8FF', label: 'Transporte',        icon: '🚗' },
};

const STATUS_CFG: Record<string, { color: string; bg: string; label: string }> = {
  pending:    { color: '#F59E0B', bg: '#FFFBE6', label: 'Pendiente' },
  processing: { color: '#1485EE', bg: '#EFF5FD', label: 'Procesando' },
  completed:  { color: '#52C41A', bg: '#F6FFED', label: 'Completado' },
  failed:     { color: '#FF4D4F', bg: '#FFF1F0', label: 'Rechazado' },
};

// Metadatos específicos de cada tipo de servicio a mostrar en el pedido
function renderMetadata(order: any) {
  const m = order.metadata || {};
  const items: Array<{ label: string; value: string }> = [];

  if (order.category === 'facturas' || order.category === 'electricidad') {
    if (m.client_type)  items.push({ label: 'Tipo cliente', value: m.client_type });
    if (m.contract_ref) items.push({ label: 'Nº contrato', value: m.contract_ref });
    if (m.bill_amount)  items.push({ label: 'Importe factura', value: `${Number(m.bill_amount).toLocaleString()} XAF` });
    if (m.period)       items.push({ label: 'Período', value: m.period });
  } else if (order.category === 'recarga') {
    if (m.type)     items.push({ label: 'Tipo',    value: m.type });
    if (m.validity) items.push({ label: 'Validez', value: m.validity });
    if (order.phone_target) items.push({ label: 'Número',  value: order.phone_target });
  } else if (order.category === 'internet') {
    if (m.speed)  items.push({ label: 'Velocidad', value: m.speed });
    if (m.type)   items.push({ label: 'Tipo',      value: m.type });
  } else if (order.category === 'canales') {
    if (m.duration) items.push({ label: 'Duración', value: m.duration });
    if (m.channels?.length) items.push({ label: 'Canales', value: m.channels.slice(0, 3).join(', ') + (m.channels.length > 3 ? '...' : '') });
  }
  return items;
}

export const ProviderServicesDashboard: React.FC<Props> = ({ isAuthenticated, onBack, viewPadding, userProfile }) => {
  const [providerInfo, setProviderInfo] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [tab, setTab] = useState<'orders' | 'stats'>('orders');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [autoMode, setAutoMode] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  // Cargar info del proveedor
  useEffect(() => {
    apiFetch('/api/provider/me').then(r => r.ok ? r.json() : null).then(d => {
      if (d) { setProviderInfo(d); setAutoMode(d.auto_process || false); }
    }).catch(() => {});
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'orders') {
        let url = '/api/provider/orders?limit=100';
        if (filterStatus) url += `&status=${filterStatus}`;
        const r = await apiFetch(url);
        if (r.ok) setOrders(await r.json()); else setOrders([]);
      } else {
        const r = await apiFetch('/api/provider/stats/director');
        if (r.ok) setStats(await r.json());
      }
    } catch {}
    setLoading(false);
  }, [tab, filterStatus]);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-refresh pedidos cada 30s
  useEffect(() => {
    if (tab !== 'orders') return;
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => loadData(), 30000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [loadData, tab]);

  const processOrder = async (id: string, status: string) => {
    setProcessing(id);
    const r = await apiFetch(`/api/provider/orders/${id}/process`, { method: 'PUT', body: JSON.stringify({ status }) });
    if (r.ok) {
      showToast(status === 'completed' ? '✓ Pago confirmado' : '✗ Pedido rechazado', status === 'completed');
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    } else { const d = await r.json(); showToast(d.message || 'Error', false); }
    setProcessing(null);
  };

  const toggleAuto = async () => {
    const newVal = !autoMode;
    const r = await apiFetch('/api/provider/auto-process', { method: 'PUT', body: JSON.stringify({ auto_process: newVal }) });
    if (r.ok) { setAutoMode(newVal); showToast(newVal ? '🤖 Procesamiento automático activado' : '⏸ Modo manual activado', newVal); }
  };

  const cat = providerInfo?.category || 'facturas';
  const theme = CAT_THEME[cat] || CAT_THEME.facturas;
  const pname = providerInfo?.name || userProfile?.name || 'Mi empresa';
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const fmt = (n: number) => Number(n || 0).toLocaleString('es-GQ');

  const FILTER_TABS = [
    { k: '',          label: `Todos (${orders.length})` },
    { k: 'pending',   label: `Pendientes${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
    { k: 'completed', label: 'Completados' },
    { k: 'failed',    label: 'Rechazados' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', zIndex: 2000, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', background: '#F5F7FF' }}>

      {/* Header con branding del proveedor */}
      <div style={{
        background: `linear-gradient(135deg, #1B2B6B 0%, #0D1B4B 100%)`,
        paddingTop: viewPadding.top,
        padding: `calc(${viewPadding.top} + 10px) 20px 0`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Logo / icono del proveedor */}
            <div style={{ width: 44, height: 44, borderRadius: 12, background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
              {theme.icon}
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>{pname}</div>
              <div style={{ color: theme.color, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#52C41A', display: 'inline-block' }}/>
                {theme.label} • Servicio disponible 24h
              </div>
            </div>
          </div>
          {/* Toggle automático */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <button onClick={toggleAuto} style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: autoMode ? '#52C41A' : 'rgba(255,255,255,0.2)', position: 'relative', transition: 'background 0.2s' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: autoMode ? 22 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}/>
            </button>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: 600 }}>{autoMode ? 'AUTO' : 'MANUAL'}</span>
          </div>
        </div>

        {/* Stats rápidas */}
        <div style={{ display: 'flex', gap: 1, background: 'rgba(255,255,255,0.08)', borderRadius: '12px 12px 0 0', overflow: 'hidden' }}>
          {[
            { label: 'Pendientes', value: orders.filter(o => o.status === 'pending').length, color: '#F59E0B' },
            { label: 'Hoy completados', value: orders.filter(o => o.status === 'completed').length, color: '#52C41A' },
            { label: 'Total pedidos', value: orders.length, color: '#fff' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, padding: '10px 0', textAlign: 'center' }}>
              <div style={{ color: s.color, fontWeight: 800, fontSize: 18 }}>{s.value}</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #E8ECF4' }}>
        {[
          { id: 'orders', label: '📋 Pedidos' },
          { id: 'stats', label: '📊 Estadísticas' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)} style={{
            flex: 1, padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer',
            fontWeight: tab === t.id ? 700 : 400,
            color: tab === t.id ? theme.color : '#8C8FA3',
            borderBottom: tab === t.id ? `2.5px solid ${theme.color}` : '2.5px solid transparent',
            fontSize: 13,
          }}>{t.label}</button>
        ))}
      </div>

      {/* Filtros de estado (solo en tab orders) */}
      {tab === 'orders' && (
        <div style={{ background: '#fff', padding: '8px 12px', borderBottom: '1px solid #E8ECF4', display: 'flex', gap: 6, overflowX: 'auto' }}>
          {FILTER_TABS.map(f => (
            <button key={f.k} onClick={() => setFilterStatus(f.k)} style={{
              flexShrink: 0, padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: filterStatus === f.k ? 700 : 500,
              background: filterStatus === f.k ? theme.color : '#F5F7FF',
              color: filterStatus === f.k ? '#fff' : '#8C8FA3',
            }}>{f.label}</button>
          ))}
          <button onClick={loadData} style={{ flexShrink: 0, padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, background: '#F5F7FF', color: '#8C8FA3', marginLeft: 'auto' }}>
            🔄
          </button>
        </div>
      )}

      {/* Contenido */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading && <div style={{ textAlign: 'center', padding: 40, color: '#8C8FA3' }}>Cargando...</div>}

        {/* PEDIDOS */}
        {!loading && tab === 'orders' && (
          <>
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: '#8C8FA3' }}>
                <div style={{ fontSize: 44, marginBottom: 10 }}>{theme.icon}</div>
                <div style={{ fontWeight: 600, color: '#1A1D23', marginBottom: 6 }}>Sin pedidos{filterStatus ? ` ${STATUS_CFG[filterStatus]?.label?.toLowerCase()}` : ''}</div>
                <div style={{ fontSize: 13 }}>Los pedidos de tus clientes aparecerán aquí en tiempo real</div>
              </div>
            ) : orders.map(order => {
              const sc = STATUS_CFG[order.status] || STATUS_CFG.pending;
              const isPending = order.status === 'pending';
              const meta = renderMetadata(order);
              const elapsed = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000);

              return (
                <div key={order.id} style={{ background: '#fff', borderRadius: 16, padding: 16, border: `1px solid ${isPending ? '#FFD591' : '#E8ECF4'}`, boxShadow: isPending ? '0 2px 12px rgba(245,158,11,0.12)' : '0 2px 8px rgba(0,0,0,0.04)' }}>
                  {/* Cabecera */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#1A1D23' }}>{order.package_name || theme.label}</div>
                      <div style={{ fontSize: 11, color: '#8C8FA3', marginTop: 2 }}>
                        {elapsed < 60 ? `Hace ${elapsed} min` : elapsed < 1440 ? `Hace ${Math.floor(elapsed/60)}h` : new Date(order.created_at).toLocaleDateString('es-ES')}
                      </div>
                    </div>
                    <div style={{ background: sc.bg, color: sc.color, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{sc.label}</div>
                  </div>

                  {/* Info del cliente */}
                  <div style={{ background: '#F8FAFF', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#1A1D23' }}>{order.user_name || 'Cliente EgChat'}</div>
                        <div style={{ fontSize: 12, color: '#8C8FA3' }}>{order.user_phone}</div>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 16, color: '#52C41A' }}>{fmt(parseFloat(order.amount))} XAF</div>
                    </div>
                    {/* Datos específicos del servicio */}
                    {meta.length > 0 && (
                      <div style={{ borderTop: '1px solid #E8ECF4', paddingTop: 6, display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
                        {meta.map(m => (
                          <div key={m.label} style={{ fontSize: 11 }}>
                            <span style={{ color: '#8C8FA3' }}>{m.label}: </span>
                            <span style={{ fontWeight: 700, color: '#1A1D23' }}>{m.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  {isPending && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => processOrder(order.id, 'failed')} disabled={processing === order.id}
                        style={{ flex: 1, padding: '9px 0', background: '#FFF1F0', color: '#FF4D4F', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                        ✗ Rechazar
                      </button>
                      <button onClick={() => processOrder(order.id, 'completed')} disabled={processing === order.id}
                        style={{ flex: 2, padding: '9px 0', background: `linear-gradient(135deg,#52C41A,#389E0D)`, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 3px 10px rgba(82,196,26,0.35)' }}>
                        {processing === order.id ? 'Procesando...' : '✓ Confirmar pago'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* ESTADÍSTICAS */}
        {!loading && tab === 'stats' && stats && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Ingresos brutos', value: `${fmt(stats.total?.revenue)} XAF`, icon: '💰', color: theme.color, desc: 'Total facturado' },
                { label: 'Comisión EgChat', value: `${fmt(stats.total?.commission)} XAF`, icon: '📊', color: '#FF4D4F', desc: '1.5% por transacción' },
                { label: 'Ingresos netos', value: `${fmt(stats.total?.net)} XAF`, icon: '✅', color: '#52C41A', desc: 'Después de comisión' },
                { label: 'Pedidos totales', value: stats.total?.orders ?? 0, icon: '🧾', color: '#1485EE', desc: 'Transacciones procesadas' },
              ].map(kpi => (
                <div key={kpi.label} style={{ background: '#fff', borderRadius: 16, padding: '14px 12px', border: '1px solid #E8ECF4', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{kpi.icon}</div>
                  <div style={{ fontSize: typeof kpi.value === 'string' && kpi.value.length > 10 ? 13 : 20, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#1A1D23', marginTop: 3 }}>{kpi.label}</div>
                  <div style={{ fontSize: 10, color: '#8C8FA3', marginTop: 2 }}>{kpi.desc}</div>
                </div>
              ))}
            </div>

            {/* Gráfico últimos 7 días */}
            {stats.daily?.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #E8ECF4' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#1A1D23', marginBottom: 14 }}>Últimos 7 días</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
                  {(() => {
                    const maxRev = Math.max(...stats.daily.map((d: any) => parseFloat(d.revenue) || 0), 1);
                    return stats.daily.map((day: any) => {
                      const h = Math.max(4, Math.round((parseFloat(day.revenue) || 0) / maxRev * 72));
                      return (
                        <div key={day.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                          <div style={{ width: '100%', height: `${h}px`, background: theme.color + 'cc', borderRadius: '3px 3px 0 0' }}/>
                          <div style={{ fontSize: 9, color: '#8C8FA3' }}>{new Date(day.date).toLocaleDateString('es-ES', { weekday: 'short' })}</div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Auto mode banner */}
      {autoMode && (
        <div style={{ background: '#F6FFED', borderTop: '1px solid #B7EB8F', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#135200' }}>
          <span>🤖</span>
          <span><b>Procesamiento automático activo</b> — los pedidos se confirman sin intervención manual</span>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: toast.ok ? '#1A1D23' : '#CF1322', color: '#fff', padding: '10px 22px', borderRadius: 24, fontSize: 13, fontWeight: 600, zIndex: 9999, whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default ProviderServicesDashboard;
