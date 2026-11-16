// Tipos del Centro Legal. El contenido vive en el bundle para abrir sin conexión.

export type LegalLang = 'es' | 'fr' | 'en' | 'zh';

export type LegalDocId = 'terms' | 'privacy';

export interface LegalSection {
  /** Ancla estable: no cambia entre idiomas. */
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface LegalDocContent {
  /** Nombre del documento en este idioma. */
  title: string;
  /** Subtítulo: naturaleza del documento. */
  subtitle: string;
  /** Párrafos previos al articulado (identificación y alcance). */
  preamble: string[];
  sections: LegalSection[];
  /** Cierre: contacto, idiomas, advertencia de revisión local. */
  closing: string[];
}

export interface LegalVersionEntry {
  version: string;
  publishedAt: string;
  effectiveAt: string;
  summary: Record<LegalLang, string>;
}

export interface LegalDocMeta {
  id: LegalDocId;
  version: string;
  publishedAt: string;
  effectiveAt: string;
  status: 'published' | 'draft' | 'archived';
  /** Versión sustancial: obliga a volver a aceptar. */
  substantial: boolean;
  /** Ruta de la versión web externa (cuando el despliegue web la incluya). */
  externalPath: string;
  history: LegalVersionEntry[];
}
