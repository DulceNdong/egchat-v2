import { TERMS } from './content/terms';
import { PRIVACY } from './content/privacy';
import type { LegalDocContent, LegalDocId, LegalDocMeta, LegalLang } from './types';

export const LEGAL_LANGS: LegalLang[] = ['es', 'fr', 'en', 'zh'];

export const LEGAL_LANG_LABEL: Record<LegalLang, string> = {
  es: 'Español',
  fr: 'Français',
  en: 'English',
  zh: '中文',
};

/** Base pública de la versión web. Se activa al desplegar las páginas legales. */
export const LEGAL_EXTERNAL_BASE = (process.env.EXPO_PUBLIC_LEGAL_SITE_URL || '').replace(/\/$/, '');

const history = [
  {
    version: '1.1.0',
    publishedAt: '2026-11-12',
    effectiveAt: '2026-11-12',
    summary: {
      es: 'Redacción revisada, más breve y explicativa, con el mismo alcance.',
      fr: 'Rédaction revue, plus concise et explicite, avec la même portée.',
      en: 'Revised wording, shorter and clearer, with the same scope.',
      zh: '措辞修订，更简洁清晰，适用范围不变。',
    },
  },
  {
    version: '1.0.0',
    publishedAt: '2026-11-12',
    effectiveAt: '2026-11-12',
    summary: {
      es: 'Versión inicial del Centro Legal.',
      fr: 'Version initiale du Centre juridique.',
      en: 'Initial version of the Legal Center.',
      zh: '法律中心初始版本。',
    },
  },
];

const meta = (id: LegalDocId, externalPath: string): LegalDocMeta => ({
  id,
  version: '1.1.0',
  publishedAt: '2026-11-12',
  effectiveAt: '2026-11-12',
  status: 'published',
  substantial: true,
  externalPath,
  history,
});

export const LEGAL_DOCS: Record<LegalDocId, { meta: LegalDocMeta; content: Record<LegalLang, LegalDocContent> }> = {
  terms: { meta: meta('terms', '/terms'), content: TERMS },
  privacy: { meta: meta('privacy', '/privacy'), content: PRIVACY },
};

export const LEGAL_DOC_ORDER: LegalDocId[] = ['terms', 'privacy'];

export function isLegalDocId(value: unknown): value is LegalDocId {
  return value === 'terms' || value === 'privacy';
}

/**
 * Idioma del documento: el elegido por el usuario, si no el de la app y, en último
 * término, el del sistema. PT no tiene documento propio y cae en español.
 */
export function resolveLegalLang(preferred?: string | null, device?: string | null): LegalLang {
  const code = (value?: string | null) => (value || '').toLowerCase().replace('_', '-').split('-')[0];
  for (const candidate of [code(preferred), code(device)]) {
    if (candidate === 'es' || candidate === 'fr' || candidate === 'en' || candidate === 'zh') {
      return candidate;
    }
  }
  return code(preferred) === 'pt' ? 'es' : 'en';
}

export function deviceLocale(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale || null;
  } catch {
    return null;
  }
}

export function formatLegalDate(iso: string, lang: LegalLang): string {
  try {
    return new Date(`${iso}T12:00:00Z`).toLocaleDateString(
      lang === 'zh' ? 'zh-CN' : lang === 'en' ? 'en-GB' : lang === 'fr' ? 'fr-FR' : 'es-ES',
      { day: 'numeric', month: 'long', year: 'numeric' },
    );
  } catch {
    return iso;
  }
}
