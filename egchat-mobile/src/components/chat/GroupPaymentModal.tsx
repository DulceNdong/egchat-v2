// ══════════════════════════════════════════════════════════════════
// GroupPaymentModal — Split payment / solicitud de pago grupal
// Permite pedir dinero a múltiples miembros del grupo a la vez
// ══════════════════════════════════════════════════════════════════
import React, { useState, useCallback } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  TextInput, FlatList, Pressable, ActivityIndicator,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import Svg, { Path, Line, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { EGAvatar } from '../ui';
import { toast } from '../Toast';
import { chatAPI } from '../../api';
import { useThemeContext } from '../../theme/ThemeContext';
import { Colors } from '../../theme/colors';
import { DarkColors } from '../../theme/darkMode';

export interface GroupMember {
  user_id: string;
  full_name?: string;
  avatar_url?: string;
}

interface Props {
  visible: boolean;
  chatId: string;
  members: GroupMember[];
  currentUserId: string;
  onClose: () => void;
  onSent: (message: string) => void;
}

export function GroupPaymentModal({ visible, chatId, members, currentUserId, onClose, onSent }: Props) {
  const [totalAmount, setTotalAmount] = useState('');
  const [concept, setConcept] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [splitMode, setSplitMode] = useState<'equal' | 'custom'>('equal');
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  const otherMembers = members.filter(m => m.user_id !== currentUserId);

  const toggleMember = useCallback((userId: string) => {
    setSelectedMembers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  }, []);

  const selectAll = () => setSelectedMembers(otherMembers.map(m => m.user_id));
  const deselectAll = () => setSelectedMembers([]);

  const getAmountPerPerson = (): number => {
    const total = parseFloat(totalAmount) || 0;
    if (splitMode === 'equal' && selectedMembers.length > 0) {
      return Math.round((total / selectedMembers.length) * 100) / 100;
    }
    return total;
  };

  const getTotal = (): number => {
    if (splitMode === 'equal') return parseFloat(totalAmount) || 0;
    return selectedMembers.reduce((sum, id) => sum + (parseFloat(customAmounts[id] || '0') || 0), 0);
  };

  const handleSend = useCallback(async () => {
    if (selectedMembers.length === 0) { toast.error('Selecciona al menos un miembro'); return; }
    const total = getTotal();
    if (total <= 0) { toast.error('El importe debe ser mayor que 0'); return; }

    setSending(true);
    try {
      const perPerson = splitMode === 'equal' ? getAmountPerPerson() : null;
      const lines = selectedMembers.map(uid => {
        const member = members.find(m => m.user_id === uid);
        const name = member?.full_name || 'Usuario';
        const amount = splitMode === 'equal'
          ? perPerson!
          : (parseFloat(customAmounts[uid] || '0') || 0);
        return `  • ${name}: ${amount.toLocaleString('es-ES')} XAF`;
      });

      const msg = [
        `💰 Solicitud de pago grupal`,
        concept ? `📝 Concepto: ${concept}` : '',
        `👥 Participantes (${selectedMembers.length}):`,
        ...lines,
        `💵 Total: ${total.toLocaleString('es-ES')} XAF`,
      ].filter(Boolean).join('\n');

      await chatAPI.sendMessage(chatId, { text: msg, type: 'text' });
      toast.success('Solicitud enviada');
      onSent(msg);
      onClose();
      // Reset
      setTotalAmount('');
      setConcept('');
      setSelectedMembers([]);
      setCustomAmounts({});
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo enviar la solicitud');
    } finally {
      setSending(false);
    }
  }, [selectedMembers, splitMode, totalAmount, customAmounts, concept, chatId, members]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ width: '100%', justifyContent: 'flex-end' }}
        >
          <Pressable style={[s.sheet, { backgroundColor: C.bgPrimary }]} onPress={e => e.stopPropagation()}>
            {/* Handle */}
            <View style={s.handle} />

            {/* Header */}
            <View style={s.header}>
              <View style={s.headerIcon}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#07a472" strokeWidth={2} strokeLinecap="round">
                  <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <Circle cx="9" cy="7" r="4"/>
                  <Path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <Path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </Svg>
              </View>
              <Text style={[s.title, { color: C.textPrimary }]}>Dividir pago</Text>
              <TouchableOpacity onPress={onClose}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={C.textTertiary} strokeWidth={2} strokeLinecap="round">
                  <Line x1="18" y1="6" x2="6" y2="18"/><Line x1="6" y1="6" x2="18" y2="18"/>
                </Svg>
              </TouchableOpacity>
            </View>

            {/* Importe total */}
            <View style={[s.inputRow, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}>
              <Text style={[s.inputLabel, { color: C.textTertiary }]}>Importe total (XAF)</Text>
              <TextInput
                style={[s.amountInput, { color: C.textPrimary }]}
                value={totalAmount}
                onChangeText={setTotalAmount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={C.textTertiary}
              />
            </View>

            {/* Concepto */}
            <View style={[s.inputRow, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}>
              <Text style={[s.inputLabel, { color: C.textTertiary }]}>Concepto (opcional)</Text>
              <TextInput
                style={[s.conceptInput, { color: C.textPrimary }]}
                value={concept}
                onChangeText={setConcept}
                placeholder="Cena, viaje, compras..."
                placeholderTextColor={C.textTertiary}
                maxLength={60}
              />
            </View>

            {/* Modo división */}
            <View style={s.splitModeRow}>
              {(['equal', 'custom'] as const).map(mode => (
                <TouchableOpacity
                  key={mode}
                  style={[s.modeBtn, splitMode === mode && s.modeBtnActive]}
                  onPress={() => setSplitMode(mode)}
                >
                  <Text style={[s.modeBtnText, splitMode === mode && s.modeBtnTextActive]}>
                    {mode === 'equal' ? '⚖️ A partes iguales' : '✏️ Personalizado'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Selección miembros */}
            <View style={s.membersHeader}>
              <Text style={[s.membersTitle, { color: C.textTertiary }]}>PARTICIPANTES</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity onPress={selectAll}>
                  <Text style={{ color: '#07a472', fontSize: 12, fontWeight: '700' }}>Todos</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={deselectAll}>
                  <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '700' }}>Ninguno</Text>
                </TouchableOpacity>
              </View>
            </View>

            <FlatList
              data={otherMembers}
              keyExtractor={m => m.user_id}
              style={{ maxHeight: 200 }}
              keyboardShouldPersistTaps="always"
              renderItem={({ item }) => {
                const sel = selectedMembers.includes(item.user_id);
                const amountPerPerson = getAmountPerPerson();
                return (
                  <TouchableOpacity
                    style={[s.memberRow, { borderBottomColor: C.borderLight }]}
                    onPress={() => toggleMember(item.user_id)}
                    activeOpacity={0.7}
                  >
                    <View style={[s.checkbox, sel && s.checkboxSel]}>
                      {sel && <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round"><Path d="M20 6L9 17l-5-5"/></Svg>}
                    </View>
                    <EGAvatar src={item.avatar_url} name={item.full_name || 'U'} size={36} />
                    <Text style={[s.memberName, { color: C.textPrimary }]} numberOfLines={1}>
                      {item.full_name || 'Usuario'}
                    </Text>
                    {sel && splitMode === 'equal' && totalAmount && (
                      <Text style={s.amount}>{amountPerPerson.toLocaleString('es-ES')} XAF</Text>
                    )}
                    {sel && splitMode === 'custom' && (
                      <TextInput
                        style={[s.customInput, { color: C.textPrimary, borderColor: C.borderLight }]}
                        value={customAmounts[item.user_id] || ''}
                        onChangeText={v => setCustomAmounts(prev => ({ ...prev, [item.user_id]: v }))}
                        keyboardType="numeric"
                        placeholder="0 XAF"
                        placeholderTextColor={C.textTertiary}
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
            />

            {/* Resumen total */}
            <View style={[s.totalRow, { borderTopColor: C.borderLight }]}>
              <Text style={[s.totalLabel, { color: C.textTertiary }]}>
                Total a cobrar: {getTotal().toLocaleString('es-ES')} XAF
              </Text>
              {splitMode === 'equal' && selectedMembers.length > 0 && !!totalAmount && (
                <Text style={[s.totalSub, { color: C.textTertiary }]}>
                  {getAmountPerPerson().toLocaleString('es-ES')} XAF por persona
                </Text>
              )}
            </View>

            {/* Botón enviar */}
            <TouchableOpacity onPress={handleSend} disabled={sending} style={s.sendBtn}>
              <LinearGradient colors={['#07a472', '#00b4e6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.sendGrad}>
                {sending
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.sendText}>Enviar solicitud al grupo</Text>
                }
              </LinearGradient>
            </TouchableOpacity>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 34 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#d1d5db', alignSelf: 'center', marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  headerIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#07a47218', alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 17, fontWeight: '700' },
  inputRow: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 10 },
  inputLabel: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
  amountInput: { fontSize: 22, fontWeight: '700' },
  conceptInput: { fontSize: 15 },
  splitModeRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  modeBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center' },
  modeBtnActive: { backgroundColor: '#07a47218' },
  modeBtnText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  modeBtnTextActive: { color: '#07a472' },
  membersHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  membersTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center' },
  checkboxSel: { backgroundColor: '#07a472', borderColor: '#07a472' },
  memberName: { flex: 1, fontSize: 14, fontWeight: '600' },
  amount: { fontSize: 13, fontWeight: '700', color: '#07a472' },
  customInput: { width: 90, borderBottomWidth: 1, paddingVertical: 2, fontSize: 14, textAlign: 'right' },
  totalRow: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, marginTop: 8, marginBottom: 14 },
  totalLabel: { fontSize: 14, fontWeight: '600' },
  totalSub: { fontSize: 12, marginTop: 2 },
  sendBtn: { borderRadius: 14, overflow: 'hidden' },
  sendGrad: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  sendText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
