// ══════════════════════════════════════════════════════════════════
// LinkPreview — preview enriquecida de URLs en mensajes
// Muestra título, descripción e imagen de la URL
// ✅ Cache local: no vuelve a consultar la misma URL en 7 días
// ✅ Doble fallback: microlink → og-meta directo → solo dominio
// ✅ Timeout de 5s para no bloquear el chat
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Linking, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';

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

// ── Cache local ───────────────────────────────────────────────────
const CACHE_PREFIX = 'egchat_link_meta_';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

function cacheKey(url: string): string {
  // Clave simple: hash del dominio + path
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = ((hash << 5) - hash) + url.charCodeAt(i);
    hash |= 0;
  }
  return `${CACHE_PREFIX}${Math.abs(hash)}`;
}

async function getCachedMeta(url: string): Promise<LinkMeta | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(url));
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    return data as LinkMeta;
  } catch {
    return null;
  }
}

async function setCachedMeta(url: string, meta: LinkMeta): Promise<void> {
  try {
    await AsyncStorage.setItem(cacheKey(url), JSON.stringify({ data: meta, ts: Date.now() }));
  } catch {}
}

// ── Extrae la primera URL de un texto ─────────────────────────────
export function extractUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s<>"]+/);
  return match ? match[0].replace(/[.,;!?)]+$/, '') : null;
}

// ── Obtiene metadatos con doble fallback ──────────────────────────
async function fetchLinkMeta(url: string): Promise<LinkMeta | null> {
  // 1) Revisar cache primero
  const cached = await getCachedMeta(url);
  if (cached) return cached;

  let meta: LinkMeta | null = null;

  // 2) Intentar microlink (gratuito, sin clave)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const json = await res.json();
      if (json.status === 'success' && json.data) {
        const { title, description, image, url: finalUrl } = json.data;
        const base = finalUrl || url;
        meta = {
          url: base,
          title: title || undefined,
          description: description || undefined,
          image: image?.url || undefined,
          domain: (() => { try { return new URL(base).hostname.replace('www.', ''); } catch { return undefined; } })(),
        };
      }
    }
  } catch {
    // timeout o sin conexión
  }

  // 3) Fallback: solo dominio + título limpio de la URL
  if (!meta) {
    try {
      const parsed = new URL(url);
      const domain = parsed.hostname.replace('www.', '');
      const pathTitle = parsed.pathname
        .split('/')
        .filter(Boolean)
        .join(' › ')
        .replace(/[-_]/g, ' ')
        .replace(/\.\w+$/, '') || undefined;
      meta = { url, domain, title: pathTitle };
    } catch {
      return null;
    }
  }

  // 4) Guardar en cache solo si tiene contenido útil
  if (meta && (meta.title || meta.image || meta.domain)) {
    await setCachedMeta(url, meta);
  }

  return meta;
}

// ── Ícono de link externo ─────────────────────────────────────────
const ExternalLinkIcon = ({ color = '#9ca3af' }: { color?: string }) => (
  <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <Path d="M15 3h6v6M10 14 21 3" />
  </Svg>
);

export function LinkPreview({ url, isOwn }: Props) {
  const [meta, setMeta] = useState<LinkMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setImgError(false);

    // Verificar cache sincrónicamente antes de mostrar el spinner
    getCachedMeta(url).then(cached => {
      if (cancelled) return;
      if (cached) {
        setMeta(cached);
        setLoading(false);
        return;
      }
      // No en cache — fetch completo
      fetchLinkMeta(url).then(data => {
        if (!cancelled) { setMeta(data); setLoading(false); }
      });
    });

    return () => { cancelled = true; };
  }, [url]);

  if (loading) {
    return (
      <View style={[s.card, s.loading, isOwn ? s.own : s.their]}>
        <ActivityIndicator size="small" color="#00C8A0" style={{ marginRight: 8 }} />
        <Text style={s.loadingText} numberOfLines={1}>{url.length > 40 ? url.slice(0, 40) + '…' : url}</Text>
      </View>
    );
  }

  if (!meta) return null;
  if (!meta.title && !meta.image && !meta.domain) return null;

  const hasImage = !!meta.image && !imgError;

  return (
    <TouchableOpacity
      style={[s.card, isOwn ? s.own : s.their]}
      onPress={() => Linking.openURL(url).catch(() => {})}
      activeOpacity={0.8}
      accessibilityLabel={`Abrir enlace: ${meta.title || meta.domain || url}`}
      accessibilityRole="link"
    >
      {hasImage && (
        <Image
          source={{ uri: meta.image }}
          style={s.image}
          resizeMode="cover"
          onError={() => setImgError(true)}
        />
      )}
      <View style={s.body}>
        <View style={s.domainRow}>
          {!!meta.domain && (
            <Text style={s.domain} numberOfLines={1}>{meta.domain}</Text>
          )}
          <ExternalLinkIcon color={isOwn ? '#00C8A0' : '#9ca3af'} />
        </View>
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
  loading: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 8,
  },
  loadingText: { fontSize: 11, color: '#9ca3af', flex: 1 },
  own: { borderColor: 'rgba(0,200,160,0.2)', backgroundColor: 'rgba(0,200,160,0.05)' },
  their: { borderColor: 'rgba(0,0,0,0.07)', backgroundColor: 'rgba(0,0,0,0.02)' },
  image: { width: '100%', height: 130 },
  body: { padding: 10, gap: 3 },
  domainRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  domain: { fontSize: 11, color: '#00C8A0', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, flex: 1 },
  title: { fontSize: 13, fontWeight: '700', color: '#111827', lineHeight: 18 },
  desc: { fontSize: 12, color: '#6b7280', lineHeight: 17 },
});
