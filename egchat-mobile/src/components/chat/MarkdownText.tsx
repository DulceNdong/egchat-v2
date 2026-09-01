/**
 * MarkdownText — renderiza texto con formato inline estilo WhatsApp/Telegram
 *
 * Soporta:
 *  *negrita*        → bold
 *  _cursiva_        → italic
 *  ~tachado~        → strikethrough
 *  `monospace`      → monospace
 *
 * No depende de librerías externas, usa Text anidados de React Native.
 */
import React from 'react';
import { Text, StyleSheet } from 'react-native';

interface MarkdownTextProps {
  text: string;
  style?: object;
}

type Token =
  | { type: 'bold';   content: string }
  | { type: 'italic'; content: string }
  | { type: 'strike'; content: string }
  | { type: 'code';   content: string }
  | { type: 'plain';  content: string };

/** Tokeniza el texto con reglas de prioridad: code > bold > italic > strike */
function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  // Orden: code primero para que `*texto*` dentro de backticks no se procese
  const re = /(`[^`]+`)|(\*[^*]+\*)|(_[^_]+_)|(~[^~]+~)/g;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      tokens.push({ type: 'plain', content: text.slice(last, m.index) });
    }
    const match = m[0];
    if (match.startsWith('`')) {
      tokens.push({ type: 'code',   content: match.slice(1, -1) });
    } else if (match.startsWith('*')) {
      tokens.push({ type: 'bold',   content: match.slice(1, -1) });
    } else if (match.startsWith('_')) {
      tokens.push({ type: 'italic', content: match.slice(1, -1) });
    } else if (match.startsWith('~')) {
      tokens.push({ type: 'strike', content: match.slice(1, -1) });
    }
    last = m.index + match.length;
  }

  if (last < text.length) {
    tokens.push({ type: 'plain', content: text.slice(last) });
  }

  return tokens;
}

export function MarkdownText({ text, style }: MarkdownTextProps) {
  // Si no hay marcadores, devuelve Text simple para no penalizar render
  if (!/[*_~`]/.test(text)) {
    return <Text style={[s.base, style]}>{text}</Text>;
  }

  const tokens = tokenize(text);

  return (
    <Text style={[s.base, style]}>
      {tokens.map((tok, i) => {
        switch (tok.type) {
          case 'bold':
            return <Text key={i} style={s.bold}>{tok.content}</Text>;
          case 'italic':
            return <Text key={i} style={s.italic}>{tok.content}</Text>;
          case 'strike':
            return <Text key={i} style={s.strike}>{tok.content}</Text>;
          case 'code':
            return <Text key={i} style={s.code}>{tok.content}</Text>;
          default:
            return <Text key={i}>{tok.content}</Text>;
        }
      })}
    </Text>
  );
}

const s = StyleSheet.create({
  base:   { fontSize: 15, color: '#111827', lineHeight: 21 },
  bold:   { fontWeight: '700' },
  italic: { fontStyle: 'italic' },
  strike: { textDecorationLine: 'line-through', color: '#6b7280' },
  code:   {
    fontFamily: 'monospace',
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 3,
    paddingHorizontal: 3,
    fontSize: 13,
    color: '#374151',
  },
});
