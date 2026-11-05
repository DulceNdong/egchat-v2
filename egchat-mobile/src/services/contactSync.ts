// ══════════════════════════════════════════════════════════════════
// contactSync.ts — Sincronización automática de contactos del teléfono
//
// Igual que WhatsApp: detecta automáticamente qué contactos
// de la agenda ya tienen cuenta en EGChat y los agrega.
//
// Flujo:
//  1. Pide permiso de Contacts
//  2. Lee todos los contactos del teléfono
//  3. Envía los números (hasheados) al backend
//  4. El backend retorna qué números tienen cuenta
//  5. Agrega automáticamente los que no están en contactos
//  6. Notifica si hay nuevos contactos encontrados
// ══════════════════════════════════════════════════════════════════
import * as Contacts from 'expo-contacts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken, getApiBase } from '../api';

const LAST_SYNC_KEY = 'egchat_contacts_last_sync';
const KNOWN_EGCHAT_KEY = 'egchat_known_phones';
const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 horas

export interface SyncResult {
  newContacts: number;
  totalFound: number;
  permissionDenied: boolean;
}

// ── Normalización de teléfonos ────────────────────────────────────

function normalizePhone(raw: string): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;

  if (raw.trim().startsWith('+')) return `+${digits}`;
  // Números de Guinea Ecuatorial (GQ): 9 dígitos → +240
  if (digits.length === 9) return `+240${digits}`;
  // Si ya tiene código de país
  if (digits.length >= 10) return `+${digits}`;
  return null;
}

// ── API pública ───────────────────────────────────────────────────

/**
 * ¿Cuándo fue la última sincronización?
 */
export async function getLastSyncTime(): Promise<Date | null> {
  try {
    const ts = await AsyncStorage.getItem(LAST_SYNC_KEY);
    return ts ? new Date(parseInt(ts, 10)) : null;
  } catch {
    return null;
  }
}

/**
 * ¿Es necesario sincronizar? (han pasado más de 24h)
 */
export async function shouldSync(): Promise<boolean> {
  const last = await getLastSyncTime();
  if (!last) return true;
  return Date.now() - last.getTime() > SYNC_INTERVAL_MS;
}

/**
 * Sincroniza los contactos del teléfono con EGChat.
 * Detecta automáticamente qué contactos ya tienen cuenta.
 *
 * @param force Forzar sincronización aunque no hayan pasado 24h
 */
export async function syncPhoneContacts(force = false): Promise<SyncResult> {
  const result: SyncResult = {
    newContacts: 0,
    totalFound: 0,
    permissionDenied: false,
  };

  try {
    // Verificar si es necesario
    if (!force && !(await shouldSync())) {
      return result;
    }

    // Pedir permisos
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      result.permissionDenied = true;
      return result;
    }

    // Leer contactos del teléfono
    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
    });

    if (!data || data.length === 0) return result;

    // Extraer y normalizar números
    const phoneMap: Record<string, string> = {};
    for (const contact of data) {
      const name = contact.name || 'Sin nombre';
      for (const ph of contact.phoneNumbers || []) {
        const normalized = normalizePhone(ph.number || '');
        if (normalized && !phoneMap[normalized]) {
          phoneMap[normalized] = name;
        }
      }
    }

    const phones = Object.keys(phoneMap);
    if (phones.length === 0) return result;

    // Consultar al backend qué números tienen cuenta
    const BASE = getApiBase();
    const token = await getToken();
    if (!token) return result;

    const res = await fetch(`${BASE}/api/contacts/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ phones }),
    });

    if (!res.ok) return result;

    const data2 = await res.json();
    const found: Array<{ phone: string; user_id: string; full_name: string }> = data2.found || [];

    result.totalFound = found.length;

    if (found.length === 0) {
      await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
      return result;
    }

    // Obtener contactos ya guardados para no duplicar
    const existingRes = await fetch(`${BASE}/api/contacts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const existing: any[] = existingRes.ok ? await existingRes.json() : [];
    const existingIds = new Set(
      (existing || []).map((c: any) => String(c.contact_user_id))
    );

    // Agregar los nuevos contactos encontrados
    let newCount = 0;
    const toAdd = found.filter(f => !existingIds.has(String(f.user_id)));

    for (const contact of toAdd) {
      try {
        await fetch(`${BASE}/api/contacts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            contact_user_id: contact.user_id,
            // Preferir el nombre de la agenda del teléfono
            display_name: phoneMap[contact.phone] || contact.full_name,
          }),
        });
        newCount++;
      } catch {
        // silencioso — continuar con el siguiente
      }
    }

    result.newContacts = newCount;

    // Guardar los teléfonos conocidos para detectar cambios futuros
    const knownPhones = found.map(f => f.phone);
    await AsyncStorage.setItem(KNOWN_EGCHAT_KEY, JSON.stringify(knownPhones));
    await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());

    return result;
  } catch {
    return result;
  }
}

/**
 * Verifica si hay permisos de contactos ya concedidos.
 */
export async function hasContactsPermission(): Promise<boolean> {
  try {
    const { status } = await Contacts.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Formatea el tiempo relativo de la última sincronización.
 */
export function formatLastSync(date: Date | null): string {
  if (!date) return 'Nunca';
  const ms = Date.now() - date.getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor(ms / 60000);

  if (m < 1) return 'Hace un momento';
  if (m < 60) return `Hace ${m} min`;
  if (h < 24) return `Hace ${h}h`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}
