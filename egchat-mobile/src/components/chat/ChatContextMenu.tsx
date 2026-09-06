/**
 * ChatContextMenu — Menú contextual moderno al hacer long-press en un mensaje.
 *
 * Diseño (referencia imagen 2):
 *  1. Barra de acceso rápido  (Copiar · Responder · Traducir · ›)
 *  2. Fila de reacciones rápidas con emojis
 *  3. Cuadrícula 4 columnas con íconos Material coloridos + etiquetas
 *  4. Botón "Cancelar" al fondo
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { ChatMessage } from '../../types/chat';

// ─── Constantes ────────────────────────────────────────────────────────────────
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
const { width: SCREEN_W } = Dimensions.get('window');
const PANEL_W = Math.min(SCREEN_W - 32, 380);

type MIconName = React.ComponentProps<typeof MaterialIcons>['name'];

// ─── Props ─────────────────────────────────────────────────────────────────────
export interface ChatContextMenuProps {
  visible: boolean;
  message: ChatMessage | null;
  isOwn: boolean;
  onClose: () => void;
  // acciones obligatorias
  onCopy: () => void;
  onReply: () => void;
  onStar: () => void;
  onDelete: () => void;
  onDeleteForMe: () => void;
  onReaction: (emoji: string) => void;
  // acciones opcionales
  onTranslate?: () => void;
  onPin?: () => void;
  onEphemeral?: () => void;
  onEdit?: () => void;
  onForward?: () => void;
  onEditHistory?: () => void;
  onSelectMode?: () => void;
  onDownload?: () => void;
  /** Eliminar contacto desde la pantalla de chat (solo chats privados) */
  onDeleteContact?: () => void;
}

// ─── Tipo interno para cada celda de la cuadrícula ────────────────────────────
interface GridAction {
  key: string;
  icon: MIconName;
  label: string;
  bg: string;
  color: string;
  danger?: boolean;
  onPress: () => void;
}

// ─── Componente principal ──────────────────────────────────────────────────────
export function ChatContextMenu(props: ChatContextMenuProps) {
  const {
    visible, message, isOwn, onClose,
    onCopy, onReply, onStar, onDelete, onDeleteForMe, onReaction,
    onTranslate, onPin, onEphemeral, onEdit, onForward,
    onEditHistory, onSelectMode, onDownload, onDeleteContact,
  } = props;

  // ── Animación de entrada ────────────────────────────────────────
  const scale   = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1, tension: 180, friction: 15, useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1, duration: 170, useNativeDriver: true,
        }),
      ]).start();
    } else {
      scale.setValue(0.9);
      opacity.setValue(0);
    }
  }, [visible, scale, opacity]);

  if (!message) return null;

  const isText  = message.type === 'text' || !message.type;
  const isMedia = message.type === 'image' || message.type === 'video' || message.type === 'audio' || message.type === 'file';
  const wasEdited = !!(message as any).edited;

  // ── Barra superior de acceso rápido ─────────────────────────────
  interface QuickItem { key: string; label: string; action: () => void }
  const quickItems: QuickItem[] = [];
  if (isText)            quickItems.push({ key: 'copy',      label: 'Copiar',     action: onCopy });
  quickItems.push(        { key: 'reply',     label: 'Responder', action: () => { onReply(); onClose(); } });
  if (isText && onTranslate) quickItems.push({ key: 'translate', label: 'Traducir', action: () => { onTranslate(); } });

  // ── Cuadrícula de acciones ───────────────────────────────────────
  const grid: GridAction[] = [];

  if (isText) grid.push({
    key: 'copy',      icon: 'content-copy', label: 'Copiar',
    bg: '#E8F5E9',    color: '#2E7D32',
    onPress: () => { onCopy(); },
  });

  grid.push({
    key: 'reply',     icon: 'reply',        label: 'Responder',
    bg: '#E3F2FD',    color: '#1565C0',
    onPress: () => { onReply(); onClose(); },
  });

  if (isOwn && isText) grid.push({
    key: 'edit',      icon: 'edit',         label: 'Editar',
    bg: '#E3F2FD',    color: '#0277BD',
    onPress: () => { onEdit?.(); },
  });

  grid.push({
    key: 'star',      icon: 'star',         label: 'Destacar',
    bg: '#FFFDE7',    color: '#F9A825',
    onPress: () => { onStar(); onClose(); },
  });

  if (onForward) grid.push({
    key: 'forward',   icon: 'forward',      label: 'Reenviar',
    bg: '#E0F7FA',    color: '#00695C',
    onPress: () => { onForward(); },
  });

  if (onSelectMode) grid.push({
    key: 'select',    icon: 'checklist',    label: 'Seleccionar',
    bg: '#EDE7F6',    color: '#6A1B9A',
    onPress: () => { onSelectMode(); onClose(); },
  });

  grid.push({
    key: 'info',      icon: 'info-outline', label: 'Info del\nmensaje',
    bg: '#FCE4EC',    color: '#AD1457',
    onPress: () => onClose(),
  });

  if (onPin) grid.push({
    key: 'pin',       icon: 'push-pin',     label: 'Fijar\nmensaje',
    bg: '#E8F5E9',    color: '#2E7D32',
    onPress: () => { onPin(); onClose(); },
  });

  if (isText && onTranslate) grid.push({
    key: 'translate', icon: 'language',     label: 'Traducir',
    bg: '#E0F7FA',    color: '#00838F',
    onPress: () => { onTranslate(); },
  });

  if (isMedia && onDownload) grid.push({
    key: 'download',  icon: 'download',     label: 'Guardar',
    bg: '#E8EAF6',    color: '#283593',
    onPress: () => { onDownload(); },
  });

  if (wasEdited && onEditHistory) grid.push({
    key: 'history',   icon: 'history',      label: 'Historial',
    bg: '#FFF3E0',    color: '#E65100',
    onPress: () => { onEditHistory(); },
  });

  if (onEphemeral && isOwn) grid.push({
    key: 'ephemeral', icon: 'timer',        label: 'Temporales',
    bg: '#F3E5F5',    color: '#7B1FA2',
    onPress: () => { onEphemeral(); onClose(); },
  });

  // Eliminar para mí — siempre visible
  grid.push({
    key: 'deleteMe',  icon: 'cancel',       label: 'Para mí',
    bg: '#FFEBEE',    color: '#C62828', danger: true,
    onPress: () => { onDeleteForMe(); },
  });

  // Eliminar para todos — solo si soy el autor
  if (isOwn) grid.push({
    key: 'deleteAll', icon: 'delete',       label: 'Para\ntodos',
    bg: '#FFEBEE',    color: '#B71C1C', danger: true,
    onPress: () => { onDelete(); },
  });

  // ── Render ───────────────────────────────────────────────────────
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={s.overlay} onPress={onClose}>
        {/* Evitar que el toque en el panel cierre el modal */}
        <Pressable>
          <Animated.View
            style={[s.panel, { width: PANEL_W, opacity, transform: [{ scale }] }]}
          >

            {/* 1 ── Barra de acceso rápido */}
            {quickItems.length > 0 && (
              <View style={s.quickBar}>
                {quickItems.map((qi, idx) => (
                  <React.Fragment key={qi.key}>
                    {idx > 0 && <View style={s.quickSep} />}
                    <TouchableOpacity
                      style={s.quickBtn}
                      onPress={qi.action}
                      activeOpacity={0.6}
                    >
                      <Text style={s.quickLabel}>{qi.label}</Text>
                    </TouchableOpacity>
                  </React.Fragment>
                ))}
                <View style={s.quickSep} />
                <TouchableOpacity style={s.quickMoreBtn} activeOpacity={0.6}>
                  <MaterialIcons name="chevron-right" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            )}

            {/* 2 ── Reacciones rápidas */}
            <View style={s.reactionsCard}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.reactionsContent}
              >
                {QUICK_REACTIONS.map(emoji => (
                  <TouchableOpacity
                    key={emoji}
                    style={s.emojiBtn}
                    onPress={() => { onReaction(emoji); onClose(); }}
                    activeOpacity={0.65}
                  >
                    <Text style={s.emoji}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* 3 ── Cuadrícula de acciones */}
            <View style={s.gridCard}>
              {grid.map((action, idx) => {
                // Calcula si está en la última fila (filas completas de 4)
                const totalRows = Math.ceil(grid.length / 4);
                const currentRow = Math.floor(idx / 4);
                const isLastRow = currentRow === totalRows - 1;
                const colIdx = idx % 4;
                const isLastCol = colIdx === 3 || idx === grid.length - 1;

                return (
                  <TouchableOpacity
                    key={action.key}
                    style={[
                      s.gridCell,
                      isLastRow  && s.noBorderBottom,
                      isLastCol  && s.noBorderRight,
                    ]}
                    onPress={action.onPress}
                    activeOpacity={0.65}
                  >
                    <View style={[s.iconBox, { backgroundColor: action.bg }]}>
                      <MaterialIcons name={action.icon} size={22} color={action.color} />
                    </View>
                    <Text
                      style={[s.cellLabel, action.danger && s.dangerLabel]}
                      numberOfLines={2}
                    >
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 4 ── Cancelar */}
            <TouchableOpacity
              style={s.cancelCard}
              onPress={onClose}
              activeOpacity={0.75}
            >
              <Text style={s.cancelLabel}>Cancelar</Text>
            </TouchableOpacity>

          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Estilos ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // Fondo oscuro semitransparente
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    paddingHorizontal: 16,
  },
  // Panel completo
  panel: {
    gap: 10,
  },

  // ── 1. Barra rápida ──────────────────────────────────────────────
  quickBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    // sombra iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    // sombra Android
    elevation: 5,
  },
  quickBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  quickMoreBtn: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  quickLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    letterSpacing: 0.1,
  },
  quickSep: {
    width: StyleSheet.hairlineWidth,
    height: 22,
    backgroundColor: '#D1D5DB',
  },

  // ── 2. Reacciones ────────────────────────────────────────────────
  reactionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  reactionsContent: {
    paddingHorizontal: 10,
    gap: 0,
  },
  emojiBtn: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 40,
  },
  emoji: {
    fontSize: 30,
    lineHeight: 38,
  },

  // ── 3. Cuadrícula ────────────────────────────────────────────────
  gridCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  gridCell: {
    width: '25%',
    paddingVertical: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    gap: 8,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#F0F0F0',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  noBorderBottom: { borderBottomWidth: 0 },
  noBorderRight:  { borderRightWidth: 0 },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellLabel: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 15,
  },
  dangerLabel: { color: '#B71C1C' },

  // ── 4. Cancelar ──────────────────────────────────────────────────
  cancelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cancelLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: 0.2,
  },
});
