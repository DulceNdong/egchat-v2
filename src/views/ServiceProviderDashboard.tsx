/**
 * ServiceProviderDashboard.tsx
 * Dashboard para proveedores de servicios (Recarga, Internet, Canales, etc.)
 *
 * ¿Para quién es?
 * Para las empresas registradas en EgChat como proveedores:
 * GETESA, Orange GE, MUNI, Canal Sol, GECOMSA, etc.
 * Cada empresa recibe sus credenciales y entra aquí para ver y procesar
 * los pedidos que los usuarios de EgChat hacen a través de la app.
 *
 * ¿Por qué está aquí?
 * En vez de que cada empresa construya su propio sistema, EgChat les
 * proporciona el panel. Ellos solo necesitan iniciar sesión y gestionar
 * sus pedidos. Si tienen API propia, EgChat la llama automáticamente.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { useRole } from '../hooks/useRole';

interface ServiceProviderDashboardProps {
  userProfile: any;
  isAuthenticated: boolean;
  onBack: () => void;
  viewPadding: { top: string; bottom: string };
}

const API_BASE = ((import.meta as any).env?.VITE_API_URL || 'https://egchat-api.onrender.com').replace(/\/+$/, '');
const getToken = () => localStorage.getItem('token') || '';
const apiFetch = (path: string, opts?: RequestInit) =>
  fetch(`${API_BASE}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...(opts?.headers || {}) } });

// Colores por categoría — mismos que en ServiciosModules
const CAT_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  recarga:    { label: 'Recarga',   color: '#2E9E6B', bg: '#F0FAF5', icon: '📱' },
  internet:   { label: 'Internet',  color: '#1485EE', bg: '#EFF5FD', icon: '🌐' },
  canales:    { label: 'Canales TV',color: '#8B5CF6', bg: '#F3F1FD', icon: '📺' },
  banco:      { label: 'Banco',     color: '#003082', bg: '#EBF0FF', icon: '🏦' },
  seguros:    { label: 'Seguros',   color: '#C47D2A', bg: '#FDF6EE', icon: '🛡️' },
  facturas:   { label: 'Facturas',  color: '#DC2626', bg: '#FFF1F0', icon: '🧾' },
  salud:      { label: 'Salud',     color: '#10B981', bg: '#F0FAF5', icon: '🏥' },
  transporte: { label: 'Transporte',color: '#F59E0B', bg: '#FFFBE6', icon: '🚗' },
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  pending:    { color: '#F59E0B', bg: '#FFFBE6', label: 'Pendiente' },
  processing: { color: '#1485EE', bg: '#EFF5FD', label: 'Procesando' },
  completed:  { color: '#52C41A', bg: '#F6FFED', label: 'Completado' },
  failed:     { color: '#FF4D4F', bg: '#FFF1F0', label: 'Fallido' },
  refunded:   { color: '#8B5CF6', bg: '#F3F1FD', label: 'Reembolsado' },
};

type Tab = 'analytics' | 'orders' | 'profile';

export const ServiceProviderDashboard: React.FC<ServiceProviderDashboardProps> = ({
  userProfile, isAuthenticated, onBack, viewPadding,
}) => {
  const { role, hasPermission, is_verified, isAtLeast } = useRole(isAuthenticated);
  const [tab, setTab] = useState<Tab>('analytics');
  const [analytics, setAnalytics] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };

  const canAccess = hasPermission('services.view_orders') || isAtLeast('admin');

  const loadData = useCallback(async () => {
    if (!canAccess) return;
    setLoading(true);
    try {
      if (tab === 'analytics') {
        const r = await apiFetch('/api/services/analytics');
        if (r.ok) setAnalytics(await r.json());
      } else if (tab === 'orders') {
        let url = '/api/services/orders/provider?limit=100';
        if (filterStatus) url += `&status=${filterStatus}`;
        if (filterCat) url += `&category=${filterCat}`;
        const r = await apiFetch(url);
        if (r.ok) setOrders(await r.json()); else setOrders([]);
      }
    } catch {}
    setLoading(false);
  }, [tab, canAccess, filterStatus, filterCat]);

  useEffect(() => { loadData(); }, [loadData]);

  const processOrder = async (orderId: string, status: string) => {
    setProcessing(orderId);
    try {
      const r = await apiFetch(`/api/services/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      if (r.ok) {
        showToast(`Pedido → ${STATUS_CONFIG[status]?.label}`);
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      } else {
        const d = await r.json();
        showToast(d.message || 'Error', false);
      }
    } catch { showToast('Error de conexión', false); }
    setProcessing(null);
  };

  if (!canAccess) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#F8FAFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 32 }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🏢</div>
        <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 8, textAlign: 'center' }}>Panel de Proveedor</div>
        <div style={{ color: '#8C8FA3', textAlign: 'center', fontSize: 14, marginBottom: 28, lineHeight: 1.6, maxWidth: 300 }}>
          Este panel es exclusivo para empresas registradas como proveedores en EgChat. Contacta al administrador para activar tu acceso.
        </div>
        <button onClick={onBack} style={{ padding: '13px 36px', background: '#1485EE', color: '#fff', border: 'none', borderRadius: 14, fontWeight: 700, cursor: 'pointer', fontSize: 15 }}>Volver</button>
      </div>
    );
  }

  const TABS = [
    { id: 'analytics' as Tab, label: 'Resumen', icon: '📊' },
    { id: 'orders'    as Tab, label: 'Pedidos', icon: '📋' },
    { id: 'profile'   as Tab, label: 'Mi empresa', icon: '🏢' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#F8FAFF', display: 'flex', flexDirection: 'column', zIndex: 2000, fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg,#1485EE 0%,#0066CC 100%)',
        paddingTop: viewPadding.top,
        padding: `calc(${viewPadding.top} + 10px) 20px 16px`,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            Panel de Proveedor
            {is_verified && <VerifiedBadge type={role as any} size={16} />}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 }}>{userProfile?.name} • Servicios EgChat</div>
        </div>
        <button onClick={loadData} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #EEF0F6' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer',
            fontWeight: tab === t.id ? 700 : 400,
            color: tab === t.id ? '#1485EE' : '#8C8FA3',
            borderBottom: tab === t.id ? '2.5px solid #1485EE' : '2.5px solid transparent',
            fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {loading && <div style={{ textAlign: 'center', padding: 40, color: '#8C8FA3' }}>Cargando...</div>}

        {/* ANALYTICS */}
        {!loading && tab === 'analytics' && (
          <>
            <div style={{ background: '#EFF5FD', borderRadius: 14, padding: '12px 16px', border: '1px solid #C7D9FF', fontSize: 13, color: '#1A3A6B', lineHeight: 1.6 }}>
              <b>¿Qué ves aquí?</b> Todos los pedidos que los usuarios de EgChat han hecho a través de tus servicios. Cuando aparece un pedido nuevo, tú lo procesas y confirmas.
            </div>
            {analytics && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Total pedidos', value: analytics.total ?? 0, icon: '📋', color: '#1485EE', bg: '#EFF5FD', desc: 'Pedidos recibidos en total' },
                    { label: 'Pendientes', value: analytics.pending ?? 0, icon: '⏳', color: '#F59E0B', bg: '#FFFBE6', desc: 'Requieren tu atención ahora' },
                    { label: 'Completados', value: analytics.completed ?? 0, icon: '✅', color: '#52C41A', bg: '#F6FFED', desc: 'Pedidos procesados con éxito' },
                    { label: 'Ingresos XAF', value: Number(analytics.revenue ?? 0).toLocaleString(), icon: '💰', color: '#2E9E6B', bg: '#F0FAF5', desc: 'Total facturado a través de EgChat' },
                  ].map(kpi => (
                    <div key={kpi.label} style={{ background: '#fff', borderRadius: 18, padding: '14px 12px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', border: '1px solid #EEF0F6', textAlign: 'center' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 13, background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, margin: '0 auto 8px' }}>{kpi.icon}</div>
                      <div style={{ fontSize: typeof kpi.value === 'string' && kpi.value.length > 6 ? 14 : 22, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#1A1D23', marginTop: 3 }}>{kpi.label}</div>
                      <div style={{ fontSize: 10, color: '#8C8FA3', marginTop: 2, lineHeight: 1.4 }}>{kpi.desc}</div>
                    </div>
                  ))}
                </div>

                {/* Por categoría */}
                {analytics.by_category?.length > 0 && (
                  <div style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #EEF0F6', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#8C8FA3', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Por tipo de servicio</div>
                    {analytics.by_category.map((cat: any) => {
                      const cfg = CAT_CONFIG[cat.category] || { label: cat.category, color: '#1485EE', bg: '#EFF5FD', icon: '📦' };
                      return (
                        <div key={cat.category} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #F5F6FA' }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{cfg.icon}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: '#1A1D23' }}>{cfg.label}</div>
                            <div style={{ fontSize: 11, color: '#8C8FA3' }}>{cat.count} pedidos</div>
                          </div>
                          <div style={{ fontWeight: 800, color: cfg.color, fontSize: 14 }}>{Number(cat.revenue).toLocaleString()} XAF</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ORDERS */}
        {!loading && tab === 'orders' && (
          <>
            {/* Filtros */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {['', 'pending', 'processing', 'completed', 'failed'].map(s => (
                <button key={s} onClick={() => setFilterStatus(s)} style={{
                  flexShrink: 0, padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  background: filterStatus === s ? '#1485EE' : '#fff',
                  color: filterStatus === s ? '#fff' : '#8C8FA3',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}>
                  {s === '' ? 'Todos' : STATUS_CONFIG[s]?.label || s}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {['', 'recarga', 'internet', 'canales'].map(c => {
                const cfg = CAT_CONFIG[c];
                return (
                  <button key={c} onClick={() => setFilterCat(c)} style={{
                    flexShrink: 0, padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    background: filterCat === c ? (cfg?.color || '#1485EE') : '#fff',
                    color: filterCat === c ? '#fff' : '#8C8FA3',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  }}>
                    {c === '' ? '📦 Todos' : `${cfg?.icon} ${cfg?.label}`}
                  </button>
                );
              })}
            </div>

            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#8C8FA3' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>📋</div>
                <div style={{ fontWeight: 600, marginBottom: 6, color: '#1A1D23' }}>Sin pedidos</div>
                <div style={{ fontSize: 13 }}>{filterStatus || filterCat ? 'Cambia los filtros para ver más' : 'Los pedidos de tus servicios aparecerán aquí'}</div>
              </div>
            ) : orders.map(order => {
              const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const cat = CAT_CONFIG[order.category] || { label: order.category, color: '#1485EE', bg: '#EFF5FD', icon: '📦' };
              const isPending = order.status === 'pending' || order.status === 'processing';
              return (
                <div key={order.id} style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #EEF0F6', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                  {/* Cabecera del pedido */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{cat.icon}</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#1A1D23' }}>{order.package_name || cat.label}</div>
                        <div style={{ fontSize: 11, color: '#8C8FA3' }}>{cat.label} • {new Date(order.created_at).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                    <div style={{ background: sc.bg, color: sc.color, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{sc.label}</div>
                  </div>

                  {/* Info del cliente */}
                  <div style={{ background: '#F8FAFF', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
                    <div style={{ fontSize: 12, color: '#8C8FA3', marginBottom: 4 }}>Cliente</div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#1A1D23' }}>{order.user_name || 'Usuario EgChat'}</div>
                    <div style={{ fontSize: 12, color: '#8C8FA3' }}>{order.user_phone}</div>
                    {order.phone_target && <div style={{ fontSize: 12, color: '#1485EE', marginTop: 4 }}>📱 Número a recargar: <b>{order.phone_target}</b></div>}
                  </div>

                  {/* Monto y acciones */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: '#2E9E6B' }}>{Number(order.amount).toLocaleString()} XAF</div>
                    {isPending && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => processOrder(order.id, 'failed')}
                          disabled={processing === order.id}
                          style={{ padding: '7px 12px', background: '#FFF1F0', color: '#FF4D4F', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                        >✗ Rechazar</button>
                        <button
                          onClick={() => processOrder(order.id, 'completed')}
                          disabled={processing === order.id}
                          style={{ padding: '7px 14px', background: 'linear-gradient(135deg,#52C41A,#389E0D)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(82,196,26,0.3)' }}
                        >
                          {processing === order.id ? '...' : '✓ Confirmar'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* PROFILE */}
        {tab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#fff', borderRadius: 18, padding: 20, border: '1px solid #EEF0F6', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg,#1485EE,#0066CC)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff', overflow: 'hidden', flexShrink: 0 }}>
                  {userProfile?.avatarUrl ? <img src={userProfile.avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : (userProfile?.avatar || 'E')}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#1A1D23', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {userProfile?.name}
                    {is_verified && <VerifiedBadge type="official" size={16} />}
                  </div>
                  <div style={{ fontSize: 13, color: '#8C8FA3' }}>{userProfile?.phone}</div>
                  <div style={{ marginTop: 6, background: '#EFF5FD', color: '#1485EE', padding: '3px 10px', borderRadius: 20, display: 'inline-block', fontSize: 11, fontWeight: 700 }}>Proveedor de servicios</div>
                </div>
              </div>
              <div style={{ background: '#F8FAFF', borderRadius: 12, padding: '14px 16px', fontSize: 13, color: '#374151', lineHeight: 1.7 }}>
                <b>Cómo funciona tu panel:</b>
                <ul style={{ margin: '8px 0 0', padding: '0 0 0 18px' }}>
                  <li>Los usuarios de EgChat solicitan tus servicios desde la app</li>
                  <li>Los pedidos aparecen aquí en tiempo real</li>
                  <li>Tú los confirmas o rechazas desde este panel</li>
                  <li>El usuario recibe la confirmación automáticamente</li>
                  <li>Si tienes API propia, EgChat la conecta y el proceso es automático</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: toast.ok ? '#1A1D23' : '#CF1322', color: '#fff', padding: '10px 22px', borderRadius: 24, fontSize: 13, fontWeight: 600, zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}>
          {toast.ok ? '✓' : '✗'} {toast.msg}
        </div>
      )}
    </div>
  );
};

export default ServiceProviderDashboard;
