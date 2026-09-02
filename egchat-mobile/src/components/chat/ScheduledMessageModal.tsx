/**
 * ScheduledMessageModal — programar envío de un mensaje para más tarde
 * Muestra un picker de fecha/hora y guarda en AsyncStorage.
 */
import React, { useColorScheme, useState } from 'react';
import {
  View, Text, Modal, Pressable, StyleSheet,
  TouchableOpacity, Platform, Alert,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { saveScheduledMessage } from '../../services/scheduledMessages';
import { toast } from '../Toast';

interface Props {
  visible: boolean;
  chatId: string;
  messageText: string;
  onClose: () => void;
  onScheduled: () => void;
}

export function ScheduledMessageModal({ visible, chatId, messageText, onClose, onScheduled }: Props) {
  const isDark = useColorScheme() === 'dark';
  const sheetBg = isDark ? '#1c1c1e' : '#fff';
  const textColor = isDark ? '#f9fafb' : '#111827';
  const subColor = isDark ? '#9ca3af' : '#6b7280';
  const previewBg = isDark ? '#374151' : '#f3f4f6';
  const timeBtnBg = isDark ? 'rgba(0,180,230,0.15)' : 'rgba(0,180,230,0.08)';
  const cancelBg = isDark ? '#374151' : '#f3f4f6';
  const tomorrow = new Date(Date.now() + 60 * 60 * 1000); // 1h desde ahora
  const [date, setDate] = useState(tomorrow);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (date.getTime() <= Date.now()) {
      Alert.alert('Hora inválida', 'La hora de envío debe ser en el futuro');
      return;
    }
    setSaving(true);
    try {
      await saveScheduledMessage({
        chatId,
        text: messageText,
        type: 'text',
        scheduledAt: date.toISOString(),
      });
      toast.success('Programado ✓', `Se enviará el ${date.toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`);
      onScheduled();
    } catch {
      toast.error('Error', 'No se pudo programar el mensaje');
    } finally {
      setSaving(false);
    }
  };

  const onChange = (_e: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS !== 'ios') setShowPicker(false);
    if (selected) setDate(selected);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={[s.sheet, { backgroundColor: sheetBg }]} onPress={e => e.stopPropagation()}>
          <View style={s.handle} />
          <Text style={[s.title, { color: textColor }]}>⏰ Programar envío</Text>
          <Text style={[s.preview, { backgroundColor: previewBg, color: textColor }]} numberOfLines={3}>{messageText}</Text>

          <TouchableOpacity style={s.timeBtn} onPress={() => setShowPicker(true)} activeOpacity={0.7}>
            <Text style={s.timeBtnLabel}>📅 Enviar el</Text>
            <Text style={s.timeValue}>
              {date.toLocaleString('es-ES', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>

          {(showPicker || Platform.OS === 'ios') && (
            <DateTimePicker
              value={date}
              mode="datetime"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              minimumDate={new Date(Date.now() + 60000)}
              onChange={onChange}
              locale="es-ES"
            />
          )}

          <View style={s.actions}>
            <TouchableOpacity style={[s.cancelBtn, { backgroundColor: cancelBg }]} onPress={onClose} activeOpacity={0.7}>
              <Text style={s.cancelTxt}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              <Text style={s.saveTxt}>Programar</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 40,
  },
  handle: { width: 40, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  title: { fontSize: 17, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 10 },
  preview: {
    backgroundColor: '#f3f4f6', borderRadius: 10, padding: 12,
    fontSize: 14, color: '#374151', marginBottom: 16,
  },
  timeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(0,180,230,0.08)', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8,
  },
  timeBtnLabel: { fontSize: 14, color: '#6b7280', fontWeight: '600' },
  timeValue: { fontSize: 15, fontWeight: '700', color: '#00b4e6' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: '#f3f4f6', alignItems: 'center' },
  cancelTxt: { fontSize: 15, fontWeight: '600', color: '#6b7280' },
  saveBtn: { flex: 2, paddingVertical: 13, borderRadius: 12, backgroundColor: '#00b4e6', alignItems: 'center' },
  saveTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
