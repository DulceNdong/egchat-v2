import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Pressable,
  ScrollView, Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MIcon } from '../ui/MIcon';
import * as Clipboard from 'expo-clipboard';
import { toast } from '../Toast';

interface TransferData {
  amount: string;
  recipient: string;
  reference: string;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  description?: string;
}

interface TransferDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  transferData: TransferData | null;
  isReceived?: boolean;
}

export const TransferDetailsModal: React.FC<TransferDetailsModalProps> = ({
  visible, onClose, transferData, isReceived = false,
}) => {
  if (!transferData) return null;

  const copyToClipboard = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    toast.success(`${label} copiado`);
  };

  const shareDetails = async () => {
    const details = `💸 ${isReceived ? 'Dinero recibido' : 'Transferencia enviada'}
💰 Monto: ${transferData.amount}
👤 ${isReceived ? 'De' : 'Para'}: ${transferData.recipient}
📅 Fecha: ${transferData.date}
🔑 Referencia: ${transferData.reference}
✅ Estado: ${transferData.status === 'completed' ? 'Completado' : transferData.status}`;
    try {
      await Share.share({ message: details });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const statusColor = transferData.status === 'completed' ? '#10B981' : '#F59E0B';
  const statusText = transferData.status === 'completed' ? 'Completado' : 'Pendiente';
  const gradientColors = (isReceived ? ['#10B981', '#059669'] : ['#1a73e8', '#0d47a1']) as [string, string];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.sheet} onPress={() => {}}>
          <View style={s.header}>
            <View style={s.headerLeft}>
              <Text style={s.headerIcon}>{isReceived ? '💰' : '💸'}</Text>
              <Text style={s.headerTitle}>
                {isReceived ? 'Dinero recibido' : 'Transferencia enviada'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <MIcon name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <LinearGradient colors={gradientColors} style={s.mainCard}>
              <Text style={s.amountLabel}>MONTO</Text>
              <Text style={s.amount}>{transferData.amount}</Text>
              <View style={s.statusRow}>
                <View style={[s.statusBadge, { backgroundColor: statusColor + '20' }]}>
                  <Text style={[s.statusText, { color: statusColor }]}>
                    {transferData.status === 'completed' ? '✅' : '🕐'} {statusText}
                  </Text>
                </View>
              </View>
            </LinearGradient>

            <View style={s.detailsCard}>
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>{isReceived ? 'DE' : 'PARA'}</Text>
                <TouchableOpacity 
                  style={s.detailValueRow} 
                  onPress={() => copyToClipboard(transferData.recipient, 'Destinatario')}
                >
                  <Text style={s.detailValue}>{transferData.recipient}</Text>
                  <MIcon name="content-copy" size={16} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={s.divider} />

              <View style={s.detailRow}>
                <Text style={s.detailLabel}>REFERENCIA</Text>
                <TouchableOpacity 
                  style={s.detailValueRow} 
                  onPress={() => copyToClipboard(transferData.reference, 'Referencia')}
                >
                  <Text style={s.detailValue}>{transferData.reference}</Text>
                  <MIcon name="content-copy" size={16} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={s.divider} />

              <View style={s.detailRow}>
                <Text style={s.detailLabel}>FECHA</Text>
                <Text style={s.detailValue}>{transferData.date}</Text>
              </View>

              {transferData.description && (
                <>
                  <View style={s.divider} />
                  <View style={s.detailRow}>
                    <Text style={s.detailLabel}>DESCRIPCIÓN</Text>
                    <Text style={s.detailValue}>{transferData.description}</Text>
                  </View>
                </>
              )}
            </View>

            <View style={s.actions}>
              <TouchableOpacity style={s.actionBtn} onPress={shareDetails}>
                <MIcon name="share" size={20} color="#6366F1" />
                <Text style={s.actionText}>Compartir</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={s.actionBtn} 
                onPress={() => copyToClipboard(transferData.reference, 'Referencia')}
              >
                <MIcon name="content-copy" size={20} color="#6366F1" />
                <Text style={s.actionText}>Copiar ref.</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:         { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40, maxHeight: '85%' },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingBottom: 16 },
  headerLeft:    { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  headerIcon:    { fontSize: 24 },
  headerTitle:   { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  closeBtn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  mainCard:      { margin: 20, marginTop: 0, borderRadius: 16, padding: 24, alignItems: 'center' },
  amountLabel:   { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: 8, letterSpacing: 0.8 },
  amount:        { fontSize: 32, fontWeight: '900', color: '#fff', marginBottom: 16 },
  statusRow:     { alignItems: 'center' },
  statusBadge:   { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  statusText:    { fontSize: 14, fontWeight: '600' },
  detailsCard:   { marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#EEF0F8' },
  detailRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  detailLabel:   { fontSize: 12, fontWeight: '700', color: '#64748B', letterSpacing: 0.6 },
  detailValue:   { fontSize: 15, fontWeight: '500', color: '#0F172A', flex: 1, textAlign: 'right', marginRight: 8 },
  detailValueRow:{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' },
  divider:       { height: 1, backgroundColor: '#EEF0F8', marginVertical: 4 },
  actions:       { flexDirection: 'row', marginHorizontal: 20, marginTop: 20, gap: 12 },
  actionBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, backgroundColor: '#F8FAFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  actionText:    { fontSize: 15, fontWeight: '600', color: '#6366F1' },
});

export default TransferDetailsModal;