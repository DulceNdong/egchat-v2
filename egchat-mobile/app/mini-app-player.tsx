/**
 * EGChat — Player de Mini-App
 * Recibe url, title, appId como params y renderiza el MiniAppRuntime
 */
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { authAPI } from '../src/api';
import { MiniAppRuntime } from '../src/miniapps/MiniAppRuntime';
import { router } from 'expo-router';
import { toast } from '../src/components/Toast';

export default function MiniAppPlayerScreen() {
  const { url, title, appId } = useLocalSearchParams<{
    url: string; title: string; appId: string;
  }>();

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    authAPI.me().then(setUser).catch(() => {});
  }, []);

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
