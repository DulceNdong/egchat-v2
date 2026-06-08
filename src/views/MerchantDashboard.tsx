/**
 * MerchantDashboard.tsx — Merchant Dashboard EgChat
 *
 * ¿Por qué existe?
 * Los merchants (vendedores verificados) necesitan gestionar su tienda
 * directamente desde EgChat: crear productos, ver pedidos de clientes,
 * revisar ingresos y solicitar el cobro de sus ventas.
 * Todo integrado con el sistema de chat para atender a los clientes.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { useRole } from '../hooks/useRole';

interface MerchantDashboardProps {
  isAuthenticated: boolean;
  onBack: () => void;
  viewPadding: { top: string; bottom: string };
  onOpenWallet?: () => void; // abre el monedero EgChat real para recibir pagos
}

const API_BASE = ((import.meta as any).env?.VITE_API_URL || 'https://egchat-api.onrender.com').replace(/\/+$/, '');
const getToken = () => localStorage.getItem('token') || '';
const apiFetch = (path: string, opts?: RequestInit) =>
  fetch(`${API_BASE}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...(opts?.headers || {}) } });

const COLORS = {
  merchant: '#FA8C16',
  success:  '#52C41A',
  danger:   '#FF4D4F',
  blue:     '#5B8DEF',
  purple:   '#722ED1',
  teal:     '#13C2C2',
  bg:       '#FFFCF5',
  card:     '#FFFFFF',
  text:     '#1A1D23',
  subtext:  '#8C8FA3',
  border:   '#F0E8D8',
};

type Tab = 'analytics' | 'products' | 'orders' | 'payouts';

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  pending:   { color: '#FA8C16', bg: '#FFF7E6', label: 'Pendiente' },
  confirmed: { color: '#5B8DEF', bg: '#EBF0FF', label: 'Confirmado' },
  preparing: { color: '#722ED1', bg: '#F3E8FF', label: 'Preparando' },
  shipped:   { color: '#13C2C2', bg: '#E6FFFB', label: 'Enviado' },
  delivered: { color: '#52C41A', bg: '#F6FFED', label: 'Entregado' },
  cancelled: { color: '#FF4D4F', bg: '#FFF1F0', label: 'Cancelado' },
};

const NEXT_STATUS: Record<string, string> = {
  pending: 'confirmed', confirmed: 'preparing', preparing: 'shipped', shipped: 'delivered',
};

export const MerchantDashboard: React.FC<MerchantDashboardProps> = ({ isAuthenticated, onBack, viewPadding, onOpenWallet }) => {
  const { role, hasPermission, is_verified, isAtLeast } = useRole(isAuthenticated);
  const [tab, setTab] = useState<Tab>('analytics');
  const [analytics, setAnalytics] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', price: '', category: '', stock: '1' });
  const [payoutAmount, setPayoutAmount] = useState('');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };

  // super_admin tiene todos los permisos — forzar acceso
  const canView = isAtLeast('merchant') || isAtLeast('super_admin');

  const loadData = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    try {
      if (tab === 'analytics') {
        const r = await apiFetch('/api/merchant/analytics');
        if (r.ok) setAnalytics(await r.json());
        else setAnalytics({ products_active: 0, orders_total: 0, revenue_total: 0, orders_pending: 0, daily_stats: [] });
      } else if (tab === 'products') {
        const r = await apiFetch('/api/merchant/products');
        if (r.ok) setProducts(await r.json()); else setProducts([]);
      } else if (tab === 'orders') {
        const r = await apiFetch('/api/merchant/orders');
        if (r.ok) setOrders(await r.json()); else setOrders([]);
      } else if (tab === 'payouts') {
        const r = await apiFetch('/api/merchant/payouts');
        if (r.ok) setPayouts(await r.json()); else setPayouts([]);
      }
    } catch {}
    setLoading(false);
  }, [tab, canView]);

  useEffect(() => { loadData(); }, [loadData]);

  const createProduct = async () => {
    if (!form.name || !form.price) return showToast('Nombre y precio son requeridos', false);
    const r = await apiFetch('/api/merchant/products', {
      method: 'POST',
      body: JSON.stringify({ ...form, price: parseFloat(form.price), stock: parseInt(form.stock) || 1 }),
    });
    if (r.ok) { showToast('Producto creado'); setShowForm(false); setForm({ name: '', description: '', price: '', category: '', stock: '1' }); loadData(); }
    else { const d = await r.json(); showToast(d.message || 'Error', false); }
  };

  const updateOrder = async (id: string, status: string) => {
    const r = await apiFetch(`/api/merchant/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
    if (r.ok) { showToast(`Pedido → ${STATUS_CONFIG[status]?.label}`); loadData(); }
  };

  const requestPayout = async () => {
    const amt = parseFloat(payoutAmount);
    if (!amt || amt < 5000) return showToast('Mínimo 5,000 XAF', false);
    const r = await apiFetch('/api/merchant/payouts/request', { method: 'POST', body: JSON.stringify({ amount: amt }) });
    if (r.ok) { showToast('Solicitud enviada'); setPayoutAmount(''); loadData(); }
    else { const d = await r.json(); showToast(d.message || 'Error', false); }
  };

  if (!canView) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: COLORS.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 32 }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🏪</div>
        <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 8, color: COLORS.text }}>Merchant Dashboard</div>
        <div style={{ color: COLORS.subtext, textAlign: 'center', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
          Disponible solo para cuentas Merchant verificadas. Contacta al administrador para activar este plan.
        </div>
        <button onClick={onBack} style={{ padding: '13px 36px', background: COLORS.merchant, color: '#fff', border: 'none', borderRadius: 14, fontWeight: 700, cursor: 'pointer', fontSize: 15 }}>Volver</button>
      </div>
    );
  }

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'analytics', label: 'Resumen', icon: '📊' },
    { id: 'products',  label: 'Productos', icon: '📦' },
    { id: 'orders',    label: 'Pedidos', icon: '🛒' },
    { id: 'payouts',   label: 'Cobros', icon: '💳' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: COLORS.bg, display: 'flex', flexDirection: 'column', zIndex: 2000, fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>

      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, #FA8C16 0%, #F57C00 100%)`,
        paddingTop: viewPadding.top,
        padding: `calc(${viewPadding.top} + 10px) 20px 16px`,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 17, display: 'flex', alignItems: 'center', gap: 8 }}>
            🏪 Merchant Dashboard
            {is_verified && <VerifiedBadge type="merchant" size={18} />}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 }}>Gestiona tu tienda en EgChat</div>
        </div>
        <button onClick={loadData} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: COLORS.card, borderBottom: `1px solid ${COLORS.border}`, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: '0 0 auto', padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer',
            fontWeight: tab === t.id ? 700 : 400,
            color: tab === t.id ? COLORS.merchant : COLORS.subtext,
            borderBottom: tab === t.id ? `2.5px solid ${COLORS.merchant}` : '2.5px solid transparent',
            fontSize: 13, display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', transition: 'all 0.15s',
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {loading && <div style={{ textAlign: 'center', padding: 40, color: COLORS.subtext }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>Cargando...
        </div>}

        {/* ANALYTICS */}
        {!loading && tab === 'analytics' && (
          <>
            <div style={{ background: '#FFF7E6', borderRadius: 14, padding: '12px 16px', border: '1px solid #FFD591', fontSize: 13, color: '#7D4E00', lineHeight: 1.6 }}>
              <b>¿Cómo funciona el Merchant?</b><br/>
              Crea productos → Los clientes los descubren y hacen pedidos por chat → Gestionas el estado de cada pedido → Solicitas el cobro cuando quieras.
            </div>

            {analytics && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Productos activos', value: analytics.products_active ?? 0, icon: '📦', color: COLORS.merchant, bg: '#FFF7E6', desc: 'Productos visibles en tu tienda' },
                  { label: 'Pedidos totales', value: analytics.orders_total ?? 0, icon: '🛒', color: COLORS.blue, bg: '#EBF0FF', desc: 'Pedidos recibidos en total' },
                  { label: 'Pendientes', value: analytics.orders_pending ?? 0, icon: '⏳', color: COLORS.danger, bg: '#FFF1F0', desc: 'Pedidos que necesitan atención' },
                  { label: 'Ingresos XAF', value: Number(analytics.revenue_total ?? 0).toLocaleString(), icon: '💰', color: COLORS.success, bg: '#F6FFED', desc: 'Total cobrado por pedidos entregados' },
                ].map(kpi => (
                  <div key={kpi.label} style={{ background: COLORS.card, borderRadius: 18, padding: '16px 12px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', border: `1px solid ${COLORS.border}`, textAlign: 'center' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 13, background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, margin: '0 auto 8px' }}>{kpi.icon}</div>
                    <div style={{ fontSize: typeof kpi.value === 'string' && kpi.value.length > 6 ? 15 : 24, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginTop: 3 }}>{kpi.label}</div>
                    <div style={{ fontSize: 10, color: COLORS.subtext, marginTop: 2, lineHeight: 1.4 }}>{kpi.desc}</div>
                  </div>
                ))}
              </div>
            )}

            {analytics?.daily_stats?.length > 0 && (
              <div style={{ background: COLORS.card, borderRadius: 18, padding: 16, border: `1px solid ${COLORS.border}`, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.subtext, marginBottom: 12, letterSpacing: 0.5, textTransform: 'uppercase' }}>Últimos 7 días</div>
                {analytics.daily_stats.map((d: any) => (
                  <div key={d.date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${COLORS.border}`, fontSize: 13 }}>
                    <span style={{ color: COLORS.subtext }}>{new Date(d.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                    <span style={{ color: COLORS.text }}>{d.orders} pedido{d.orders !== 1 ? 's' : ''}</span>
                    <span style={{ fontWeight: 700, color: COLORS.success }}>{Number(d.revenue).toLocaleString()} XAF</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* PRODUCTS */}
        {!loading && tab === 'products' && (
          <>
            <button onClick={() => setShowForm(true)} style={{ width: '100%', padding: '13px', background: `linear-gradient(135deg,${COLORS.merchant},#F57C00)`, color: '#fff', border: 'none', borderRadius: 14, fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 14px rgba(250,140,22,0.35)' }}>
              + Crear nuevo producto
            </button>

            {showForm && (
              <div style={{ background: COLORS.card, borderRadius: 18, padding: 20, border: `1px solid ${COLORS.border}`, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text, marginBottom: 14 }}>Nuevo producto</div>
                {[
                  { key: 'name', placeholder: 'Nombre del producto *', type: 'text' },
                  { key: 'price', placeholder: 'Precio en XAF *', type: 'number' },
                  { key: 'stock', placeholder: 'Unidades disponibles', type: 'number' },
                  { key: 'category', placeholder: 'Categoría (ej: Ropa, Electrónica)', type: 'text' },
                ].map(f => (
                  <input key={f.key} type={f.type} placeholder={f.placeholder} value={(form as any)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: `1.5px solid ${COLORS.border}`, marginBottom: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: COLORS.bg, color: COLORS.text }}
                  />
                ))}
                <textarea placeholder="Descripción del producto (opcional)" value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={3} style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: `1.5px solid ${COLORS.border}`, marginBottom: 14, fontSize: 14, outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: COLORS.bg, color: COLORS.text }}
                />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: 11, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 12, cursor: 'pointer', fontWeight: 600, color: COLORS.subtext, fontSize: 14 }}>Cancelar</button>
                  <button onClick={createProduct} style={{ flex: 2, padding: 11, background: COLORS.merchant, color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 14, boxShadow: '0 4px 12px rgba(250,140,22,0.3)' }}>Crear producto</button>
                </div>
              </div>
            )}

            {products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: COLORS.subtext }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>📦</div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Aún no tienes productos</div>
                <div style={{ fontSize: 13 }}>Crea tu primer producto para empezar a vender</div>
              </div>
            ) : products.map(p => (
              <div key={p.id} style={{ background: COLORS.card, borderRadius: 16, padding: 16, border: `1px solid ${COLORS.border}`, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.text }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: COLORS.subtext, marginTop: 3 }}>{p.category || 'Sin categoría'} • {p.stock} uds.</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: COLORS.merchant }}>{Number(p.price).toLocaleString()} XAF</div>
                  <div style={{ fontSize: 11, marginTop: 3, padding: '2px 8px', borderRadius: 10, display: 'inline-block', background: p.status === 'active' ? '#F6FFED' : '#FFF1F0', color: p.status === 'active' ? COLORS.success : COLORS.danger, fontWeight: 600 }}>
                    {p.status === 'active' ? '● Activo' : '● Inactivo'}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ORDERS */}
        {!loading && tab === 'orders' && (
          <>
            <div style={{ background: '#EBF0FF', borderRadius: 14, padding: '12px 16px', border: '1px solid #C7D9FF', fontSize: 13, color: '#1A3A6B', lineHeight: 1.6 }}>
              Gestiona el estado de cada pedido: Pendiente → Confirmado → Preparando → Enviado → Entregado. Los clientes son notificados automáticamente.
            </div>
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: COLORS.subtext }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🛒</div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Sin pedidos todavía</div>
                <div style={{ fontSize: 13 }}>Cuando los clientes hagan pedidos, aparecerán aquí</div>
              </div>
            ) : orders.map(o => {
              const sc = STATUS_CONFIG[o.status] || STATUS_CONFIG.pending;
              return (
                <div key={o.id} style={{ background: COLORS.card, borderRadius: 16, padding: 16, border: `1px solid ${COLORS.border}`, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.text }}>{o.customer_name || 'Cliente'}</div>
                      <div style={{ fontSize: 12, color: COLORS.subtext, marginTop: 2 }}>{o.customer_phone}</div>
                    </div>
                    <div style={{ background: sc.bg, color: sc.color, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{sc.label}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: 15, color: COLORS.success }}>{Number(o.total_amount || 0).toLocaleString()} XAF</span>
                    {NEXT_STATUS[o.status] && (
                      <button onClick={() => updateOrder(o.id, NEXT_STATUS[o.status])}
                        style={{ padding: '7px 14px', background: STATUS_CONFIG[NEXT_STATUS[o.status]]?.color || COLORS.merchant, color: '#fff', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        → {STATUS_CONFIG[NEXT_STATUS[o.status]]?.label}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* PAYOUTS */}
        {!loading && tab === 'payouts' && (
          <>
              <div style={{ background: COLORS.card, borderRadius: 18, padding: 20, border: `1px solid ${COLORS.border}`, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text, marginBottom: 6 }}>💳 Recibir pago</div>
              <div style={{ fontSize: 13, color: COLORS.subtext, marginBottom: 16, lineHeight: 1.6 }}>
                El cliente paga directamente desde su monedero EgChat al tuyo. El pago llega al instante y recibirás una notificación.
              </div>
              {onOpenWallet ? (
                <button onClick={onOpenWallet} style={{ width: '100%', padding: 13, background: `linear-gradient(135deg,${COLORS.success},#389E0D)`, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 14px rgba(82,196,26,0.35)', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                  Abrir Monedero EgChat
                </button>
              ) : (
                <div style={{ fontSize: 13, color: COLORS.subtext, background: '#F5F6FA', borderRadius: 10, padding: '10px 14px' }}>
                  Accede al monedero EgChat desde la pestaña Cartera para ver tus cobros
                </div>
              )}
            </div>

            {payouts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 30, color: COLORS.subtext }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>💳</div>
                <div style={{ fontSize: 13 }}>No hay solicitudes de cobro todavía</div>
              </div>
            ) : payouts.map(p => {
              const sc = STATUS_CONFIG[p.status] || { color: COLORS.subtext, bg: COLORS.bg, label: p.status };
              return (
                <div key={p.id} style={{ background: COLORS.card, borderRadius: 14, padding: 14, border: `1px solid ${COLORS.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text }}>{Number(p.amount).toLocaleString()} XAF</div>
                    <div style={{ fontSize: 12, color: COLORS.subtext, marginTop: 2 }}>{new Date(p.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  </div>
                  <div style={{ background: sc.bg, color: sc.color, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{sc.label}</div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: toast.ok ? '#1A1D23' : '#CF1322', color: '#fff', padding: '10px 22px', borderRadius: 24, fontSize: 13, fontWeight: 600, zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}>
          {toast.ok ? '✓' : '✗'} {toast.msg}
        </div>
      )}
    </div>
  );
};

export default MerchantDashboard;
