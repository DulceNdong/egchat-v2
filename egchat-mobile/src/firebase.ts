// Cliente Firebase para React Native
// Reemplaza supabase.ts — usa Firebase Realtime DB para presencia y Firestore queries desde el backend

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getDatabase, ref, onValue, set, onDisconnect, serverTimestamp } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChatMessage } from './types/chat';

// ── Config Firebase (obtener de Firebase Console > Project Settings) ─
const FIREBASE_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSy...',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'egchat-xxxxx.firebaseapp.com',
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || 'https://egchat-xxxxx-default-rtdb.firebaseio.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'egchat-xxxxx',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'egchat-xxxxx.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abc123',
};

// Inicializar Firebase
const app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApp();
const rtdb = getDatabase(app);

// ══════════════════════════════════════════════════════════════════
// REALTIME DB: Presencia (online/offline)
// ══════════════════════════════════════════════════════════════════

export const trackUserPresence = (userId: string) => {
  const presenceRef = ref(rtdb, `presence/${userId}`);

  // Marcar online
  set(presenceRef, {
    online: true,
    last_seen: serverTimestamp(),
  });

  // Auto-disconnect al cerrar app
  onDisconnect(presenceRef).set({
    online: false,
    last_seen: serverTimestamp(),
  });

  return () => {
    set(presenceRef, { online: false, last_seen: Date.now() });
  };
};

export const subscribeToOnlineUsers = (onSync: (onlineUserIds: string[]) => void) => {
  const presenceRef = ref(rtdb, 'presence');

  const unsubscribe = onValue(presenceRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) { onSync([]); return; }

    const onlineUsers = Object.entries(data)
      .filter(([_, value]: [string, any]) => value?.online === true)
      .map(([userId]) => userId);

    onSync(onlineUsers);
  });

  return unsubscribe;
};

// ══════════════════════════════════════════════════════════════════
// NOTA: Los demás features de realtime (mensajes, typing, read receipts)
// ahora se manejan via SSE desde el backend (api.ts: /api/chat/stream)
// ══════════════════════════════════════════════════════════════════

