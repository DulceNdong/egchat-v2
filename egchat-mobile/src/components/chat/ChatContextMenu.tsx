/**
 * ChatContextMenu — Menú contextual moderno al hacer long-press en un mensaje.
 *
 * Diseño:
 *  1. Barra de acceso rápido (Copiar / Responder / Traducir / ›)
 *  2. Fila de reacciones rápidas
 *  3. Cuadrícula 4 columnas con íconos Material coloridos
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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { ChatMessage } from '../../types/chat';

// ─── Constantes ────────────────────────────────────────────────────────────────
const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
const { width: SCREEN_W } = Dimensions.get('window');
const PANEL_W = Math.min(SCREEN_W - 32, 360);

// ─── Tipos ─────────────────────────────────────────────────────────────────────
type MIconName = React.ComponentProps<typeof MaterialIcons>['name'];

interface ActionItem {
  key: string;
  icon: MIconName;
  label: string;
  iconBg: string;
  iconColor: string;
  danger?: boolean;
  onPress: () => void;
}

interface Props {
  visible: boolean;
  message: ChatMessage | null;
  isOwn: boolean;
  onClose: () => void;
  onCopy: () => void;
  onReply: () => void;
  onStar: () => void;
  onDelete: () => void;
  onDeleteForMe: () => void;
  onReaction: (emoji: string) => void;
  onTranslate?: () => void;
  onPin?: () => void;
  onEphemeral?: () => void;
  onEdit?: () => void;
  onForward?: () => void;
  onEditHistory?: () => void;
  onSelectMode?: () => void;
}

// ─── Componente ────────────────────────────────────────────────────────────────
export function ChatContextMenu({
  visible,
  message,
  isOwn,
  onClose,
  onCopy,
  onReply,
  onStar,
  onDelete,
  onDeleteForMe,
  onReaction,
  onTranslate,
  onPin,
  onEphemeral,
  onEdit,
  onForward,
  onEditHistory,
  onSelectMode,
}: Props) {
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 160,
          friction: 14,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.88);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim]);

  if (!message) return null;

  const isTextMsg = message.type === 'text' || !message.type;
  const wasEdited = !!(message as any).edited;

  // ── Acciones rápidas superiores ─────────────────────────────────
  type QuickAction = { key: string; label: string; onPress: () => void };
  const quickActions: QuickAction[] = [
    ...(isTextMsg ? [{ key: 'copy', label: 'Copiar', onPress: () => { onCopy(); } }] : []),
    { key: 'reply', label: 'Responder', onPress: () => { onReply(); onClose(); } },
    ...(isTextMsg ? [{ key: 'translate', label: 'Traducir', onPress: () => { onTranslate?.(); } }] : []),
  ];

  // ── Cuadrícula de acciones ───────────────────────────────────────
  const buildActions = (): ActionItem[] => {
    const items: ActionItem[] = [];

    if (isTextMsg) {
      items.push({
        key: 'copy', icon: 'content-copy', label: 'Copiar',
        iconBg: '#E8F5E9', iconColor: '#2E7D32',
        onPress: () => { onCopy(); },
      });
    }

    items.push({
      key: 'reply', icon: 'reply', label: 'Responder',
      iconBg: '#E3F2FD', iconColor: '#1565C0',
      onPress: () => { onReply(); onClose(); },
    });

    if (isOwn && isTextMsg) {
      items.push({
        key: 'edit', icon: 'edit', label: 'Editar',
        iconBg: '#E3F2FD', iconColor: '#0277BD',
        onPress: () => { onEdit?.(); },
      });
    }

    items.push({
      key: 'star', icon: 'star', label: 'Destacar',
      iconBg: '#FFFDE7', iconColor: '#F9A825',
      onPress: () => { onStar(); onClose(); },
    });

    if (onForward) {
      items.push({
        key: 'forward', icon: 'forward', label: 'Reenviar',
        iconBg: '#E0F7FA', iconColor: '#00695C',
        onPress: () => { onForward(); },
      });
    }

    items.push({
      key: 'select', icon: 'checklist', label: 'Seleccionar',
      iconBg: '#EDE7F6', iconColor: '#6A1B9A',
      onPress: () => { onSelectMode?.(); onClose(); },
    });

    items.push({
      key: 'info', icon: 'info-outline', label: 'Info del\nmensaje',
      iconBg: '#FCE4EC', iconColor: '#AD1457',
      onPress: () => { onClose(); },
    });

    items.push({
      key: 'pin', icon: 'push-pin', label: 'Fijar\nmensaje',
      iconBg: '#E8F5E9', iconColor: '#2E7D32',
      onPress: () => { onPin?.(); onClose(); },
    });

    if (isTextMsg) {
      items.push({
        key: 'translate', icon: 'language', label: 'Traducir',
        iconBg: '#E0F7FA', iconColor: '#00838F',
        onPress: () => { onTranslate?.(); },
      });
    }

    if (wasEdited && onEditHistory) {
      items.push({
        key: 'history', icon: 'history', label: 'Historial',
        iconBg: '#FFF3E0', iconColor: '#E65100',
        onPress: () => { onEditHistory(); },
      });
    }

    // Eliminar para mí — siempre
    items.push({
      key: 'deleteMe', icon: 'cancel', label: 'Para mí',
      iconBg: '#FFEBEE', iconColor: '#C62828',
      danger: true,
      onPress: () => { onDeleteForMe(); },
    });

    // Eliminar para todos — solo si soy el dueño
    if (isOwn) {
      items.push({
        key: 'deleteAll', icon: 'delete', label: 'Para\ntodos',
        iconBg: '#FFEBEE', iconColor: '#B71C1C',
        danger: true,
        onPress: () => { onDelete(); },
      });
    }

    return items;
  };

  const actions = buildActions();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={s.overlay} onPress={onClose}>
        <Animated.View
          style={[
            s.panelWrap,
            { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* ── 1. Acciones rápidas superiores ── */}
          {quickActions.length > 0 && (
            <View style={s.quickBar}>
              {quickActions.map((qa, idx) => (
                <React.Fragment key={qa.key}>
                  {idx > 0 && <View style={s.quickDivider} />}
                  <TouchableOpacity
                    style={s.quickBtn}
                    onPress={qa.onPress}
                    activeOpacity={0.65}
                  >
                    <Text style={s.quickLabel}>{qa.label}</Text>
                  </TouchableOpacity>
                </React.Fragment>
              ))}
              <View style={s.quickDivider} />
              <TouchableOpacity style={s.quickBtn} activeOpacity={0.65}>
                <MaterialIcons name="chevron-right" size={18} color="#555" />
              </TouchableOpacity>
            </View>
          )}

          {/* ── 2. Reacciones rápidas ── */}
          <View style={s.reactionsBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.reactionsContent}
            >
              {QUICK_REACTIONS.map(e => (
                <TouchableOpacity
                  key={e}
                  style={s.reactionBtn}
                  onPress={() => { onReaction(e); onClose(); }}
                  activeOpacity={0.7}
                >
                  <Text style={s.reactionEmoji}>{e}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* ── 3. Cuadrícula de acciones ── */}
          <View style={s.grid}>
            {actions.map((action, idx) => {
              const isLastRow = idx >= actions.length - (actions.length % 4 || 4);
              return (
                <TouchableOpacity
                  key={action.key}
                  style={[
                    s.gridItem,
                    isLastRow && s.gridItemLastRow,
                  ]}
                  onPress={action.onPress}
                  activeOpacity={0.7}
                >
                  <View style={[s.iconCircle, { backgroundColor: action.iconBg }]}>
                    <MaterialIcons
                      name={action.icon}
                      size={22}
                      color={action.iconColor}
                    />
                  </View>
                  <Text
                    style={[s.actionLabel, action.danger && s.dangerLabel]}
                    numberOfLines={2}
                  >
                    {action.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── 4. Botón Cancelar ── */}
          <TouchableOpacity
            style={s.cancelBtn}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={s.cancelLabel}>Cancelar</Text>
          </TouchableOpacity>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

// ─── Estilos ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  panelWrap: {
    width: PANEL_W,
    gap: 10,
  },

  // ── Acciones rápidas ──────────────────────────────────────────
  quickBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 6,
  },
  quickBtn: {
    flex: 1,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a2e',
    letterSpacing: 0.1,
  },
  quickDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#e5e7eb',
  },

  // ── Reacciones ────────────────────────────────────────────────
  reactionsBar: {
    backgroundColor: '#fff',
    borderRadius: 50,
    paddingVertical: 6,
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 5,
  },
  reactionsContent: {
    paddingHorizontal: 6,
    gap: 2,
  },
  reactionBtn: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 40,
  },
  reactionEmoji: {
    fontSize: 28,
    lineHeight: 34,
  },

  // ── Cuadrícula ────────────────────────────────────────────────
  grid: {
    backgroundColor: '#fff',
    borderRadius: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 5,
  },
  gridItem: {
    width: '25%',
    paddingVertical: 18,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    borderRightWidth: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  gridItemLastRow: {
    borderBottomWidth: 0,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 15,
  },
  dangerLabel: {
    color: '#C62828',
  },

  // ── Cancelar ─────────────────────────────────────────────────
  cancelBtn: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  cancelLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    letterSpacing: 0.2,
  },
});
