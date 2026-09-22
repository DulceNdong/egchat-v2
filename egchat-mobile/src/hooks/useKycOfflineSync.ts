/**
 * useKycOfflineSync — Cola offline para pasos KYC pendientes de sync
 *
 * Si el usuario completa un paso sin conexión, se guarda localmente.
 * Al reconectar, se sincronizan automáticamente con el backend.
 */
import { useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { subscribeNetworkStatus, getNetworkStatus } from '../store/offlineStore';
import { savePersonalData, saveFinancialData, uploadDocumentImage, screenKycApplication, submitKycApplication } from '../services/kycService';
import type { PersonalData, FinancialData, DocumentType } from '../store/kycStore';

const QUEUE_KEY = 'egchat_kyc_offline_queue';

type KycQueueItem =
  | { type: 'personal';   applicationId: string; data: PersonalData }
  | { type: 'financial';  applicationId: string; data: FinancialData }
  | { type: 'document';   applicationId: string; side: 'front' | 'back' | 'selfie'; enc: string; docType: DocumentType }
  | { type: 'screening';  applicationId: string; fullName?: string; nationality?: string }
  | { type: 'submit';     applicationId: string };

async function loadQueue(): Promise<KycQueueItem[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function saveQueue(q: KycQueueItem[]): Promise<void> {
  try { await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch {}
}

export async function enqueueKycAction(item: KycQueueItem): Promise<void> {
  const q = await loadQueue();
  q.push(item);
  await saveQueue(q);
}

export async function clearKycQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}

export function useKycOfflineSync() {
  const processingRef = useRef(false);

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    const { isOnline } = getNetworkStatus();
    if (!isOnline) return;

    const queue = await loadQueue();
    if (!queue.length) return;

    processingRef.current = true;
    const failed: KycQueueItem[] = [];

    for (const item of queue) {
      try {
        if (item.type === 'personal')  await savePersonalData(item.applicationId, item.data);
        if (item.type === 'financial') await saveFinancialData(item.applicationId, item.data);
        if (item.type === 'document')  await uploadDocumentImage(item.applicationId, item.side, item.enc, item.docType);
        if (item.type === 'screening') await screenKycApplication(item.applicationId, { fullName: item.fullName, nationality: item.nationality });
        if (item.type === 'submit')    await submitKycApplication(item.applicationId);
      } catch {
        failed.push(item);
      }
    }

    await saveQueue(failed);
    processingRef.current = false;
  }, []);

  // Procesar al reconectar
  useEffect(() => {
    const unsub = subscribeNetworkStatus(() => {
      const { isOnline } = getNetworkStatus();
      if (isOnline) setTimeout(processQueue, 1000);
    });
    return () => { unsub(); };
  }, [processQueue]);

  // Procesar al montar si hay conexión
  useEffect(() => {
    const { isOnline } = getNetworkStatus();
    if (isOnline) setTimeout(processQueue, 500);
  }, [processQueue]);

  return { processQueue, enqueueKycAction };
}
