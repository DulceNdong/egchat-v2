/**
 * EGChat — Traducción automática de mensajes
 * Usa la API gratuita de LibreTranslate (open source, sin API key para uso básico)
 * o MyMemory API (100.000 palabras/día gratis)
 *
 * Soporta: es, fr, en, pt, ar, zh, de, it, ru, ja, ko
 */

const MYMEMORY_API = 'https://api.mymemory.translated.net/get';

export const SUPPORTED_LANGUAGES = [
  { code: 'es', label: '🇪🇸 Español' },
  { code: 'en', label: '🇬🇧 English' },
  { code: 'fr', label: '🇫🇷 Français' },
  { code: 'pt', label: '🇧🇷 Português' },
  { code: 'ar', label: '🇸🇦 العربية' },
  { code: 'zh', label: '🇨🇳 中文' },
  { code: 'de', label: '🇩🇪 Deutsch' },
  { code: 'it', label: '🇮🇹 Italiano' },
  { code: 'ru', label: '🇷🇺 Русский' },
];

// Cache simple para no retranducir el mismo texto
const cache = new Map<string, string>();

/**
 * Traduce un texto al idioma destino.
 * @param text   Texto a traducir
 * @param toLang Idioma destino (ej: 'en', 'fr')
 * @param fromLang Idioma origen (auto por defecto)
 */
export async function translateText(
  text: string,
  toLang: string,
  fromLang = 'auto',
): Promise<string> {
  if (!text.trim() || text.length > 500) return text;

  const key = `${text}_${toLang}`;
  if (cache.has(key)) return cache.get(key)!;

  try {
    const langPair = fromLang === 'auto' ? `es|${toLang}` : `${fromLang}|${toLang}`;
    const url = `${MYMEMORY_API}?q=${encodeURIComponent(text)}&langpair=${langPair}`;
    const res  = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();

    const translated = data?.responseData?.translatedText;
    if (translated && translated !== text) {
      cache.set(key, translated);
      return translated;
    }
    return text;
  } catch { return text; }
}

/**
 * Detecta el idioma de un texto (heurística simple)
 */
export function detectLanguage(text: string): string {
  // Patrones básicos
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
  if (/[\u0600-\u06ff]/.test(text)) return 'ar';
  if (/[\u0400-\u04ff]/.test(text)) return 'ru';
  if (/[\u3040-\u30ff]/.test(text)) return 'ja';
  if (/[\uac00-\ud7af]/.test(text)) return 'ko';
  // Palabras clave español/inglés/francés
  if (/\b(el|la|los|las|que|es|por|para|con|como)\b/i.test(text)) return 'es';
  if (/\b(the|is|are|was|were|have|has|with|for)\b/i.test(text)) return 'en';
  if (/\b(le|la|les|est|sont|avec|pour|dans)\b/i.test(text)) return 'fr';
  return 'es'; // default
}
