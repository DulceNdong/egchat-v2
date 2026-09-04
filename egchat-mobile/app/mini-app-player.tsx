/**
 * EGChat — Player de Mini-App v2
 * Recibe url, title, appId, permissions como params.
 */
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { authAPI } from '../src/api';
import { MiniAppRuntime } from '../src/miniapps/MiniAppRuntime';
import { addRecentApp, getMiniAppById, type MiniAppPermission } from '../src/miniapps/miniAppsStore';
import { router } from 'expo-router';
import { toast } from '../src/components/Toast';

export default function MiniAppPlayerScreen() {
  const { url, title, appId, permissions: permStr } = useLocalSearchParams<{
    url: string;
    title: string;
    appId: string;
    permissions?: string; // JSON array de MiniAppPermission
  }>();

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    authAPI.me().then(setUser).catch(() => {});
    // Registrar en historial de recientes
    if (appId) addRecentApp(appId);
  }, [appId]);

  // Obtener permisos: del param, o del catálogo local
  const permissions: MiniAppPermission[] = (() => {
    if (permStr) {
      try { return JSON.parse(permStr) as MiniAppPermission[]; } catch {}
    }
    if (appId) {
      return getMiniAppById(appId)?.permissions || [];
    }
    return [];
  })();

  const handlePayment = (amount: number, description: string) => {
    toast.info('💳 Pago', `${description} — ${amount} XAF`);
    router.push('/(tabs)/monedero' as any);
  };

  const handleShare = (content: string) => {
    router.push({
      pathname: '/(tabs)/mensajeria',
      params: { sharedContent: content },
    } as any);
  };

  return (
    <MiniAppRuntime
      url={url || 'https://egchat-v2.vercel.app'}
      title={title || 'Mini-App'}
      appId={appId || 'unknown'}
      permissions={permissions}
      userId={user?.id}
      userName={user?.full_name}
      userAvatar={user?.avatar_url}
      userPhone={user?.phone}
      onPayment={handlePayment}
      onShareToChat={handleShare}
      onClose={() => router.back()}
    />
  );
}
