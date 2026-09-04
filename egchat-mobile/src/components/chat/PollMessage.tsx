/**
 * EGChat — Encuesta/Poll en mensajes de grupo
 * Formato del mensaje: type='poll', text=JSON stringificado
 * {
 *   question: string,
 *   options: [{ id, text, votes: string[] }],
 *   createdBy: string,
 *   multipleChoice: boolean
 * }
 */
import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export interface PollData {
  question: string;
  options: Array<{ id: string; text: string; votes: string[] }>;
  createdBy: string;
  multipleChoice: boolean;
}

interface Props {
  poll: PollData;
  currentUserId: string;
  isOwn: boolean;
  onVote: (optionId: string) => void;
}

export function PollMessage({ poll, currentUserId, isOwn, onVote }: Props) {
  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes.length, 0);
  const myVotes    = poll.options.filter(o => o.votes.includes(currentUserId)).map(o => o.id);
  const hasVoted   = myVotes.length > 0;
  const accent     = isOwn ? '#00c8a0' : '#00b4e6';

  return (
    <View style={ps.card}>
      {/* Header */}
      <View style={ps.header}>
        <Text style={ps.pollIcon}>📊</Text>
        <Text style={ps.pollLabel}>ENCUESTA</Text>
      </View>

      {/* Pregunta */}
      <Text style={ps.question}>{poll.question}</Text>

      {/* Opciones */}
      {poll.options.map(option => {
        const pct     = totalVotes > 0 ? Math.round((option.votes.length / totalVotes) * 100) : 0;
        const voted   = myVotes.includes(option.id);
        return (
          <TouchableOpacity
            key={option.id}
            style={ps.option}
            onPress={() => onVote(option.id)}
            activeOpacity={0.75}
            disabled={hasVoted && !poll.multipleChoice}
          >
            <View style={ps.optionBg}>
              {/* Barra de progreso */}
              {hasVoted && (
                <View style={[ps.progressBar, { width: `${pct}%` as any, backgroundColor: accent + '30' }]} />
              )}
              {/* Contenido */}
              <View style={ps.optionRow}>
                <View style={[ps.radio, voted && { borderColor: accent, backgroundColor: accent }]}>
                  {voted && <View style={ps.radioDot} />}
                </View>
                <Text style={[ps.optionText, voted && { color: accent, fontWeight: '600' }]}>
                  {option.text}
                </Text>
                {hasVoted && (
                  <Text style={[ps.pct, { color: accent }]}>{pct}%</Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Footer */}
      <Text style={ps.footer}>
        {totalVotes} {totalVotes === 1 ? 'voto' : 'votos'}
        {poll.multipleChoice ? ' · Respuesta múltiple' : ''}
      </Text>
    </View>
  );
}

/** Parsea el JSON de la encuesta desde el texto del mensaje */
export function parsePoll(text: string): PollData | null {
  try {
    if (!text.startsWith('📊')) return null;
    const json = text.slice(1).trim();
    return JSON.parse(json) as PollData;
  } catch { return null; }
}

/** Serializa la encuesta para enviarla como mensaje */
export function serializePoll(poll: PollData): string {
  return '📊' + JSON.stringify(poll);
}

/** Crea una nueva encuesta */
export function createPoll(
  question: string,
  options: string[],
  createdBy: string,
  multipleChoice = false,
): PollData {
  return {
    question,
    options: options.map((text, i) => ({ id: String(i), text, votes: [] })),
    createdBy,
    multipleChoice,
  };
}

/** Registra el voto de un usuario en una opción */
export function registerVote(poll: PollData, optionId: string, userId: string): PollData {
  return {
    ...poll,
    options: poll.options.map(opt => {
      if (opt.id !== optionId) return opt;
      const already = opt.votes.includes(userId);
      return {
        ...opt,
        votes: already
          ? opt.votes.filter(v => v !== userId)   // quitar voto
          : [...opt.votes, userId],                // añadir voto
      };
    }),
  };
}

const ps = StyleSheet.create({
  card: { minWidth: 220, maxWidth: 290 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  pollIcon: { fontSize: 14 },
  pollLabel: { fontSize: 10, fontWeight: '800', color: '#9ca3af', letterSpacing: 1 },
  question: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 10, lineHeight: 20 },
  option: { marginBottom: 6 },
  optionBg: {
    borderRadius: 8, borderWidth: 1.5, borderColor: '#e5e7eb',
    overflow: 'hidden', position: 'relative',
  },
  progressBar: { position: 'absolute', top: 0, bottom: 0, left: 0, borderRadius: 6 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10 },
  radio: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: '#d1d5db',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  optionText: { flex: 1, fontSize: 13, color: '#374151' },
  pct: { fontSize: 12, fontWeight: '700', minWidth: 32, textAlign: 'right' },
  footer: { fontSize: 11, color: '#9ca3af', marginTop: 6, textAlign: 'right' },
});
