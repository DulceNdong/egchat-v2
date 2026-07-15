// ══════════════════════════════════════════════════════════════════
// MessageReadReceiptsModal — quién ha leído un mensaje en un grupo
// Se abre al hacer long-press en un mensaje propio en un grupo
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Pressable,
} from 'react-native';
import Svg, { Line, Path, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { getToken, getApiBase } from '../../api';
import { EGAvatar } from '../ui';
import { useThemeContext } from '../../theme/ThemeContext';
import { Colors } from '../../theme/colors';
import { DarkColors } from '../../theme/darkMode';

interface ReadReceipt {
  user_id: string;
  full_name?: string;
  avatar_url?: string;
  read_at?: string;
  delivered_at?: string;
}

interface Props {
  visible: boolean;
  messageId: string;
  chatParticipants: Array<{ user_id: string; full_name?: string; avatar_url?: string }>;
  currentUserId: string;
  onClose: () => void;
}

const formatTime = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
};

export function MessageReadReceiptsModal({ visible, messageId, chatParticipants, currentUserId, onClose }: Props) {
  const [receipts, setReceipts] = useState<ReadReceipt[]>([]);
  const [loading, setLoading] = useState(false);
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  useEffect(() => {
    if (!visible || !messageId) return;
    setLoading(true);
    const fetch_ = async () => {
      try {
        const BASE = getApiBase();
        const token = await getToken();
        const res = await fetch(`${BASE}/api/messages/${messageId}/receipts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setReceipts(Array.isArray(data) ? data : []);
        } else {
          // Fallback: marcar todos los participantes como sin leer
          setReceipts(chatParticipants.filter(p => p.user_id !== currentUserId).map(p => ({
            user_id: p.user_id,
            full_name: p.full_name,
            avatar_url: p.avatar_url,
          })));
        }
      } catch {
        setReceipts([]);
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, [visible, messageId]);

  const read = receipts.filter(r => !!r.read_at);
  const delivered = receipts.filter(r => !r.read_at && !!r.delivered_at);
  const pending = chatParticipants
    .filter(p => p.user_id !== currentUserId)
    .filter(p => !receipts.find(r => r.user_id === p.user_id));

  const Section = ({ title, items, color }: { title: string; items: typeof read; color: string }) => {
    if (items.length === 0) return null;
    return (
      <>
        <View style={[s.sectionHeader, { backgroundColor: C.bgSecondary }]}>
          <Text style={[s.sectionTitle, { color }]}>{title} ({items.length})</Text>
        </View>
        {items.map(r => (
          <View key={r.user_id} style={[s.row, { borderBottomColor: C.borderLight }]}>
            <EGAvatar src={r.avatar_url} name={r.full_name || 'U'} size={40} />
            <Text style={[s.name, { color: C.textPrimary }]}>{r.full_name || 'Usuario'}</Text>
            {r.read_at && <Text style={[s.time, { color: C.textTertiary }]}>{formatTime(r.read_at)}</Text>}
          </View>
        ))}
      </>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={[s.sheet, { backgroundColor: C.bgPrimary }]} onPress={e => e.stopPropagation()}>
          <View style={s.handle} />
          <View style={s.header}>
            <Text style={[s.headerTitle, { color: C.textPrimary }]}>Visto por</Text>
            <TouchableOpacity onPress={onClose}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.textTertiary} strokeWidth={2} strokeLinecap="round">
                <Line x1="18" y1="6" x2="6" y2="18"/><Line x1="6" y1="6" x2="18" y2="18"/>
              </Svg>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={Colors.accent} />
          ) : (
            <FlatList
              data={[]}
              keyExtractor={() => ''}
              renderItem={null}
              ListHeaderComponent={
                <>
                  <Section title="✓✓ Leído" items={read} color="#07a472" />
                  <Section title="✓✓ Entregado" items={delivered} color="#9ca3af" />
                  {pending.length > 0 && (
                    <>
                      <View style={[s.sectionHeader, { backgroundColor: C.bgSecondary }]}>
                        <Text style={[s.sectionTitle, { color: C.textTertiary }]}>✓ Pendiente ({pending.length})</Text>
                      </View>
                      {pending.map(p => (
                        <View key={p.user_id} style={[s.row, { borderBottomColor: C.borderLight }]}>
                          <EGAvatar src={p.avatar_url} name={p.full_name || 'U'} size={40} />
                          <Text style={[s.name, { color: C.textPrimary }]}>{p.full_name || 'Usuario'}</Text>
                        </View>
                      ))}
                    </>
                  )}
                  {read.length === 0 && delivered.length === 0 && pending.length === 0 && (
                    <Text style={[s.empty, { color: C.textTertiary }]}>Sin datos de lectura</Text>
                  )}
                </>
              }
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%', minHeight: 200 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#d1d5db', alignSelf: 'center', marginTop: 10, marginBottom: 6 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  sectionHeader: { paddingHorizontal: 16, paddingVertical: 6 },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  name: { flex: 1, fontSize: 15, fontWeight: '600' },
  time: { fontSize: 12 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 15 },
});
