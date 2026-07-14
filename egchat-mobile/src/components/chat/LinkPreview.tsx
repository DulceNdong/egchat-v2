// ══════════════════════════════════════════════════════════════════
// LinkPreview — preview enriquecida de URLs en mensajes
// Muestra título, descripción e imagen de la URL
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Linking, ActivityIndicator } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

interface LinkMeta {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  domain?: string;
}

interface Props {
  url: string;
  isOwn: boolean;
}

// Extrae la primera URL de un texto
export function extractUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s]+/);
  return match ? match[0] : null;
}

// Obtiene metadatos básicos de una URL usando un proxy público
async function fetchLinkMeta(url: string): Promise<LinkMeta | null> {
  try {
    // Usamos la API de Open Graph de microlink (gratuita)
    const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined,
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 'success') return null;
    const { title, description, image, url: finalUrl } = data.data;
    return {
      url: finalUrl || url,
      title: title || '',
      description: description || '',
      image: image?.url || '',
      domain: new URL(finalUrl || url).hostname.replace('www.', ''),
    };
  } catch {
    // Fallback mínimo: solo dominio
    try {
      return { url, domain: new URL(url).hostname.replace('www.', '') };
    } catch { return null; }
  }
}

export function LinkPreview({ url, isOwn }: Props) {
  const [meta, setMeta] = useState<LinkMeta | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchLinkMeta(url).then(data => {
      if (!cancelled) { setMeta(data); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [url]);

  if (loading) {
    return (
      <View style={[s.card, isOwn ? s.own : s.their]}>
        <ActivityIndicator size="small" color="#07a472" />
      </View>
    );
  }

  if (!meta) return null;
  if (!meta.title && !meta.image && !meta.domain) return null;

  return (
    <TouchableOpacity
      style={[s.card, isOwn ? s.own : s.their]}
      onPress={() => Linking.openURL(url).catch(() => {})}
      activeOpacity={0.8}
    >
      {!!meta.image && (
        <Image source={{ uri: meta.image }} style={s.image} resizeMode="cover" />
      )}
      <View style={s.body}>
        {!!meta.domain && (
          <Text style={s.domain} numberOfLines={1}>{meta.domain}</Text>
        )}
        {!!meta.title && (
          <Text style={s.title} numberOfLines={2}>{meta.title}</Text>
        )}
        {!!meta.description && (
          <Text style={s.desc} numberOfLines={2}>{meta.description}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: 10, overflow: 'hidden', marginTop: 6,
    borderWidth: 1, maxWidth: 260,
  },
  own: { borderColor: 'rgba(0,200,160,0.2)', backgroundColor: 'rgba(0,200,160,0.05)' },
  their: { borderColor: 'rgba(0,0,0,0.07)', backgroundColor: 'rgba(0,0,0,0.02)' },
  image: { width: '100%', height: 130 },
  body: { padding: 10, gap: 3 },
  domain: { fontSize: 11, color: '#07a472', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  title: { fontSize: 13, fontWeight: '700', color: '#111827', lineHeight: 18 },
  desc: { fontSize: 12, color: '#6b7280', lineHeight: 17 },
});
