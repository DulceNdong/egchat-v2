import AsyncStorage from '@react-native-async-storage/async-storage';
import { legalAPI, type LegalAcceptancePayload } from '../api';
import { LEGAL_DOCS, LEGAL_DOC_ORDER } from './registry';
import type { LegalDocId, LegalLang } from './types';

// Libro local de aceptaciones. Es la copia de confianza en el dispositivo:
// el servidor recibe el mismo registro sin IP y es la fuente entre dispositivos.
const LEDGER_KEY = 'legal_acceptances_v1';
const PENDING_KEY = 'legal_acceptances_pending_v1';

export type AcceptanceRecord = LegalAcceptancePayload;

type Ledger = Record<string, AcceptanceRecord>;

export async function loadLedger(): Promise<Ledger> {
  try {
    const raw = await AsyncStorage.getItem(LEDGER_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? (parsed as Ledger) : {};
  } catch {
    return {};
  }
}

async function saveLedger(ledger: Ledger): Promise<void> {
  try {
    await AsyncStorage.setItem(LEDGER_KEY, JSON.stringify(ledger));
  } catch {
    // Sin almacenamiento la aceptación se envía igualmente al servidor.
  }
}

async function loadPending(): Promise<AcceptanceRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as AcceptanceRecord[]) : [];
  } catch {
    return [];
  }
}

async function savePending(records: AcceptanceRecord[]): Promise<void> {
  try {
    if (records.length === 0) await AsyncStorage.removeItem(PENDING_KEY);
    else await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(records));
  } catch {}
}

export function isCurrentVersion(record: AcceptanceRecord | undefined, docId: LegalDocId): boolean {
  return !!record && record.version === LEGAL_DOCS[docId].meta.version;
}

export async function getAcceptance(docId: LegalDocId): Promise<AcceptanceRecord | null> {
  const ledger = await loadLedger();
  return ledger[docId] ?? null;
}

/** Documentos cuya versión vigente no consta como aceptada en este dispositivo. */
export async function pendingDocuments(): Promise<LegalDocId[]> {
  const ledger = await loadLedger();
  return LEGAL_DOC_ORDER.filter((id) => !isCurrentVersion(ledger[id], id));
}

/**
 * Guarda la aceptación en el dispositivo y la envía al servidor. Si no hay
 * conexión o el endpoint aún no está desplegado, queda en cola para reintentar.
 */
export async function recordAcceptances(
  entries: { documentId: LegalDocId; language: LegalLang }[],
): Promise<{ synced: boolean }> {
  if (entries.length === 0) return { synced: true };

  const acceptedAt = new Date().toISOString();
  const records: AcceptanceRecord[] = entries.map((entry) => ({
    documentId: entry.documentId,
    version: LEGAL_DOCS[entry.documentId].meta.version,
    language: entry.language,
    acceptedAt,
  }));

  const ledger = await loadLedger();
  for (const record of records) ledger[record.documentId] = record;
  await saveLedger(ledger);

  try {
    await legalAPI.accept(records);
    return { synced: true };
  } catch {
    const pending = await loadPending();
    const merged = [
      ...pending.filter((p) => !records.some((r) => r.documentId === p.documentId)),
      ...records,
    ];
    await savePending(merged);
    return { synced: false };
  }
}

/** Reintenta los envíos pendientes y trae las aceptaciones hechas en otros dispositivos. */
export async function synchronizeAcceptances(): Promise<void> {
  const pending = await loadPending();
  if (pending.length > 0) {
    try {
      await legalAPI.accept(pending);
      await savePending([]);
    } catch {
      // Sigue en cola.
    }
  }

  try {
    const remote = await legalAPI.requirements();
    if (!Array.isArray(remote?.accepted) || remote.accepted.length === 0) return;
    const ledger = await loadLedger();
    for (const record of remote.accepted) {
      const docId = record.documentId as LegalDocId;
      if (!LEGAL_DOCS[docId]) continue;
      const local = ledger[docId];
      if (!local || new Date(record.acceptedAt).getTime() > new Date(local.acceptedAt).getTime()) {
        ledger[docId] = record;
      }
    }
    await saveLedger(ledger);
  } catch {
    // Sin servidor se mantiene la copia local.
  }
}
