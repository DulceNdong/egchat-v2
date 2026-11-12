import { formatLegalDate } from './registry';
import { LEGAL_UI } from './strings';
import type { LegalDocContent, LegalDocMeta, LegalLang } from './types';

export interface LegalTheme {
  background: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  accent: string;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function paragraphs(items: string[]): string {
  return items.map((p) => `<p>${escapeHtml(p)}</p>`).join('\n');
}

/**
 * Documento HTML autocontenido para el WebView. Sin scripts, sin recursos remotos:
 * funciona sin conexión y conserva el índice y las anclas internas.
 */
export function buildLegalHtml(
  content: LegalDocContent,
  meta: LegalDocMeta,
  lang: LegalLang,
  theme: LegalTheme,
  dark: boolean,
): string {
  const ui = LEGAL_UI[lang];
  const langTag = lang === 'zh' ? 'zh-CN' : lang;

  const toc = content.sections
    .map((s, i) => `<li><a href="#${s.id}"><span class="n">${i + 1}</span><span>${escapeHtml(s.title)}</span></a></li>`)
    .join('\n');

  const body = content.sections
    .map((s, i) => {
      const bullets = s.bullets?.length
        ? `<ul>${s.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>`
        : '';
      return `
      <section id="${s.id}">
        <h2><span class="num">${i + 1}</span>${escapeHtml(s.title)}</h2>
        ${paragraphs(s.paragraphs)}
        ${bullets}
        <a class="top" href="#toc">↑ ${escapeHtml(ui.backToIndex)}</a>
      </section>`;
    })
    .join('\n');

  return `<!doctype html>
<html lang="${langTag}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:;" />
<title>${escapeHtml(content.title)} · EGCHAT</title>
<style>
  :root { color-scheme: ${dark ? 'dark' : 'light'}; }
  * { box-sizing: border-box; }
  html { -webkit-text-size-adjust: 100%; }
  body {
    margin: 0; padding: 20px 18px 48px;
    background: ${theme.background}; color: ${theme.text};
    font: 17px/1.65 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif;
    word-wrap: break-word;
  }
  .wrap { max-width: 720px; margin: 0 auto; }
  .eyebrow { font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: ${theme.accent}; font-weight: 700; }
  h1 { font-size: 30px; line-height: 1.15; margin: 8px 0 6px; letter-spacing: -0.02em; }
  .sub { color: ${theme.muted}; font-size: 15px; margin: 0 0 14px; }
  .chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 18px; }
  .chip {
    font-size: 12px; color: ${theme.muted}; border: 1px solid ${theme.border};
    border-radius: 999px; padding: 4px 10px; background: ${theme.surface};
  }
  .preamble p { color: ${theme.text}; }
  .preamble { border-left: 3px solid ${theme.accent}; padding-left: 14px; margin: 0 0 22px; }
  #toc {
    background: ${theme.surface}; border: 1px solid ${theme.border}; border-radius: 16px;
    padding: 16px 18px; margin: 0 0 30px;
  }
  #toc h2 { font-size: 13px; letter-spacing: .1em; text-transform: uppercase; color: ${theme.muted}; margin: 0 0 10px; }
  #toc ol { list-style: none; margin: 0; padding: 0; }
  #toc li { border-top: 1px solid ${theme.border}; }
  #toc li:first-child { border-top: 0; }
  #toc a { display: flex; gap: 10px; align-items: baseline; padding: 9px 0; color: ${theme.text}; text-decoration: none; font-size: 15px; }
  #toc .n { color: ${theme.accent}; font-variant-numeric: tabular-nums; font-weight: 700; min-width: 20px; }
  section { margin: 0 0 26px; scroll-margin-top: 12px; }
  h2 { font-size: 19px; line-height: 1.3; margin: 0 0 8px; display: flex; gap: 10px; align-items: baseline; }
  h2 .num {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 26px; height: 26px; border-radius: 8px; background: ${theme.accent};
    color: #fff; font-size: 13px; font-weight: 800; flex: none;
  }
  p {
    margin: 0 0 10px;
    text-align: justify;
    text-justify: inter-word;
    -webkit-hyphens: auto;
    hyphens: auto;
  }
  ul { margin: 0 0 10px; padding-left: 22px; }
  li {
    margin: 0 0 6px;
    text-align: justify;
    text-justify: inter-word;
    -webkit-hyphens: auto;
    hyphens: auto;
  }
  a { color: ${theme.accent}; }
  .top { display: inline-block; font-size: 12px; text-decoration: none; color: ${theme.muted}; margin-top: 2px; }
  footer { margin-top: 34px; padding-top: 16px; border-top: 1px solid ${theme.border}; color: ${theme.muted}; font-size: 13px; }
  footer p { margin: 0 0 6px; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="eyebrow">EGCHAT · ${escapeHtml(ui.centerTitle)}</div>
    <h1>${escapeHtml(content.title)}</h1>
    <p class="sub">${escapeHtml(content.subtitle)}</p>
    <div class="chips">
      <span class="chip">${escapeHtml(ui.version)} ${escapeHtml(meta.version)}</span>
      <span class="chip">${escapeHtml(ui.updated)} ${escapeHtml(formatLegalDate(meta.publishedAt, lang))}</span>
      <span class="chip">${escapeHtml(ui.effective)} ${escapeHtml(formatLegalDate(meta.effectiveAt, lang))}</span>
      <span class="chip">${escapeHtml(ui.language)}: ${escapeHtml(lang === 'zh' ? '中文' : lang.toUpperCase())}</span>
    </div>
    <div class="preamble">${paragraphs(content.preamble)}</div>
    <nav id="toc">
      <h2>${escapeHtml(ui.contents)}</h2>
      <ol>${toc}</ol>
    </nav>
    ${body}
    <footer>${paragraphs(content.closing)}</footer>
  </div>
</body>
</html>`;
}
