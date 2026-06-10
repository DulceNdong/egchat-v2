/**
 * serviceOrders.ts
 * Crea pedidos de servicios en el backend sin bloquear el flujo del usuario.
 * Se llama en paralelo cuando el usuario confirma un pedido en RecargaModal,
 * InternetModal o CanalesModal. El proveedor los recibe en su dashboard.
 */

const API_BASE = ((import.meta as any).env?.VITE_API_URL || 'https://egchat-api.onrender.com').replace(/\/+$/, '');
const getToken = () => localStorage.getItem('token') || localStorage.getItem('egchat_token_backup') || '';

export interface ServiceOrderPayload {
  provider_id:    string;   // mo1, ip1, cc1, etc.
  provider_name:  string;   // GETESA, Orange GE, Canal Sol...
  provider_color: string;   // color del proveedor
  category:       'recarga' | 'internet' | 'canales' | 'banco' | 'seguros' | 'facturas' | 'salud' | 'transporte';
  package_id?:    string;
  package_name?:  string;
  amount:         number;
  phone_target?:  string;   // número a recargar / cuenta destino
  notes?:         string;
  metadata?:      Record<string, any>;  // velocidad, canales, validez, etc.
}

/**
 * Crea un pedido en el backend. Fire-and-forget: no bloquea la UI.
 * Si falla, se reintenta una vez en background.
 */
export async function createServiceOrder(payload: ServiceOrderPayload): Promise<string | null> {
  const token = getToken();
  if (!token) return null;

  const attempt = async (): Promise<string | null> => {
    const res = await fetch(`${API_BASE}/api/services/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.id || null;
  };

  try {
    return await attempt();
  } catch {
    // Reintento silencioso tras 3s
    return new Promise(resolve => {
      setTimeout(async () => {
        try { resolve(await attempt()); }
        catch { resolve(null); }
      }, 3000);
    });
  }
}

/** Helper para recargas móviles */
export const orderRecarga = (op: { id: string; name: string; color: string }, pkg: { id: string; name: string; price: number; type: string; validity: string }, phone: string) =>
  createServiceOrder({
    provider_id:   op.id,
    provider_name: op.name,
    provider_color: op.color,
    category:      'recarga',
    package_id:    pkg.id,
    package_name:  pkg.name,
    amount:        pkg.price,
    phone_target:  phone,
    metadata:      { type: pkg.type, validity: pkg.validity },
  });

/** Helper para internet */
export const orderInternet = (prov: { id: string; name: string; color: string }, svc: { id: string; name: string; price: string; speed: string; type: string }, notes?: string) =>
  createServiceOrder({
    provider_id:   prov.id,
    provider_name: prov.name,
    provider_color: prov.color,
    category:      'internet',
    package_id:    svc.id,
    package_name:  svc.name,
    amount:        parseFloat(svc.price.replace(/[^\d]/g, '')) || 0,
    notes,
    metadata:      { speed: svc.speed, type: svc.type, price_text: svc.price },
  });

/** Helper para canales de TV */
export const orderCanales = (ch: { id: string; name: string; color: string }, pkg: { id: string; name: string; price: string; duration: string; channels: string[] }) =>
  createServiceOrder({
    provider_id:   ch.id,
    provider_name: ch.name,
    provider_color: ch.color,
    category:      'canales',
    package_id:    pkg.id,
    package_name:  pkg.name,
    amount:        parseFloat(pkg.price.replace(/[^\d]/g, '')) || 0,
    metadata:      { duration: pkg.duration, channels: pkg.channels, price_text: pkg.price },
  });

/** Helper para pago de facturas (SEGESA electricidad, SNGE agua, etc.) */
export const orderFactura = (bill: {
  ref: string; service: string; provider: string;
  amount: number; providerKey?: string; color?: string;
  clientType?: string; period?: string;
}) =>
  createServiceOrder({
    provider_id:    bill.providerKey || 'segesa',
    provider_name:  bill.provider,
    provider_color: bill.color || '#F59E0B',
    category:       'facturas',
    package_name:   bill.service,
    amount:         bill.amount,
    metadata: {
      contract_ref: bill.ref,
      client_type:  bill.clientType || 'residencial',
      period:       bill.period || new Date().toLocaleDateString('es-GQ', { month: 'long', year: 'numeric' }),
      bill_amount:  bill.amount,
    },
  });
