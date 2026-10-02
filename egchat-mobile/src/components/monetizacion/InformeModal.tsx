import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
} from 'react-native';

export interface InformeData {
  tipo: 'usuario' | 'negocio';
  nombre: string;
  periodo: string; // ej: "Enero 2026 - Septiembre 2026"
  // Usuario
  numTransacciones?: number;
  totalMovido?: number;
  montoPromedio?: number;
  scoreFinanciero?: number;
  mesesActivo?: number;
  serviciosUsados?: string[];
  // Negocio
  razonSocial?: string;
  nif?: string;
  sector?: string;
  facturacionMensualPromedio?: number;
  facturacionTotal?: number;
  mesesOperacion?: number;
  serviciosActivos?: string[];
  // Común
  observaciones?: string;
}

interface InformeModalProps {
  visible: boolean;
  onClose: () => void;
  data: InformeData | null;
}

const fmt = (n?: number) =>
  n !== undefined
    ? new Intl.NumberFormat('es-GQ', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n)
    : 'N/D';

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? '#00FF88' : score >= 40 ? '#FFD700' : '#FF4444';
  return (
    <View style={styles.scoreRow}>
      <View style={styles.scoreBarBg}>
        <View style={[styles.scoreBarFill, { width: `${score}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.scoreNum, { color }]}>{score}/100</Text>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.dataRow}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={styles.dataValue}>{value}</Text>
    </View>
  );
}

export function InformeModal({ visible, onClose, data }: InformeModalProps) {
  if (!data) return null;

  const fechaGeneracion = new Date().toLocaleDateString('es-GQ', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const informeTexto = data.tipo === 'usuario'
    ? `INFORME FINANCIERO - USUARIO
================================
Generado por: EGChat App
Fecha: ${fechaGeneracion}
Periodo: ${data.periodo}
--------------------------------
DATOS DEL TITULAR
Nombre: ${data.nombre}
Score financiero: ${data.scoreFinanciero ?? 'N/D'}/100
Meses activo: ${data.mesesActivo ?? 0}
--------------------------------
ACTIVIDAD TRANSACCIONAL
Total transacciones: ${data.numTransacciones ?? 0}
Total movido: ${fmt(data.totalMovido)}
Promedio mensual: ${fmt(data.montoPromedio)}
Servicios usados: ${(data.serviciosUsados ?? []).join(', ') || 'N/D'}
--------------------------------
${data.observaciones ? `OBSERVACIONES\n${data.observaciones}\n--------------------------------\n` : ''}
Este informe fue generado automáticamente por EGChat
y refleja la actividad real del usuario en la plataforma.`
    : `INFORME FINANCIERO - NEGOCIO
================================
Generado por: EGChat App
Fecha: ${fechaGeneracion}
Periodo: ${data.periodo}
--------------------------------
DATOS DE LA EMPRESA
Razón Social: ${data.razonSocial ?? data.nombre}
NIF: ${data.nif ?? 'N/D'}
Sector: ${data.sector ?? 'N/D'}
Score financiero: ${data.scoreFinanciero ?? 'N/D'}/100
Meses en operación: ${data.mesesOperacion ?? 0}
--------------------------------
ACTIVIDAD FINANCIERA
Facturación mensual promedio: ${fmt(data.facturacionMensualPromedio)}
Facturación total acumulada: ${fmt(data.facturacionTotal)}
Total transacciones: ${data.numTransacciones ?? 0}
Servicios activos: ${(data.serviciosActivos ?? []).join(', ') || 'N/D'}
--------------------------------
${data.observaciones ? `OBSERVACIONES\n${data.observaciones}\n--------------------------------\n` : ''}
Este informe fue generado automáticamente por EGChat
y refleja la actividad real del negocio en la plataforma.`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: informeTexto,
        title: `Informe Financiero - ${data.nombre}`,
      });
    } catch {
      // silencio
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>📊 Informe Financiero</Text>
              <Text style={styles.headerSub}>Generado el {fechaGeneracion}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Sello */}
            <View style={styles.sello}>
              <Text style={styles.selloLogo}>EG</Text>
              <View>
                <Text style={styles.selloTitle}>EGChat Platform</Text>
                <Text style={styles.selloSub}>Informe oficial de actividad financiera</Text>
              </View>
            </View>

            {/* Info general */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>DATOS DEL TITULAR</Text>
              <Row label="Nombre" value={data.nombre} />
              <Row label="Tipo" value={data.tipo === 'usuario' ? 'Usuario particular' : 'Empresa / Negocio'} />
              <Row label="Período" value={data.periodo} />
              {data.tipo === 'negocio' && data.nif && <Row label="NIF" value={data.nif} />}
              {data.tipo === 'negocio' && data.sector && <Row label="Sector" value={data.sector} />}
            </View>

            {/* Score */}
            {data.scoreFinanciero !== undefined && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>SCORE FINANCIERO</Text>
                <ScoreBar score={data.scoreFinanciero} />
                <Text style={styles.scoreDesc}>
                  {data.scoreFinanciero >= 70
                    ? '✓ Perfil financiero excelente. Recomendado para crédito.'
                    : data.scoreFinanciero >= 40
                    ? '⚠ Perfil financiero moderado. Evaluar condiciones.'
                    : '✗ Perfil financiero bajo. Se recomienda mayor historial.'}
                </Text>
              </View>
            )}

            {/* Métricas */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ACTIVIDAD FINANCIERA</Text>
              {data.numTransacciones !== undefined && (
                <Row label="Total transacciones" value={`${data.numTransacciones}`} />
              )}
              {data.totalMovido !== undefined && (
                <Row label="Total movido" value={fmt(data.totalMovido)} />
              )}
              {data.montoPromedio !== undefined && (
                <Row label="Promedio mensual" value={fmt(data.montoPromedio)} />
              )}
              {data.facturacionMensualPromedio !== undefined && (
                <Row label="Facturación mensual" value={fmt(data.facturacionMensualPromedio)} />
              )}
              {data.facturacionTotal !== undefined && (
                <Row label="Facturación total" value={fmt(data.facturacionTotal)} />
              )}
              {data.mesesActivo !== undefined && (
                <Row label="Meses activo" value={`${data.mesesActivo} meses`} />
              )}
              {data.mesesOperacion !== undefined && (
                <Row label="Meses en operación" value={`${data.mesesOperacion} meses`} />
              )}
              {(data.serviciosUsados ?? data.serviciosActivos) && (
                <Row
                  label="Servicios"
                  value={(data.serviciosUsados ?? data.serviciosActivos ?? []).join(', ')}
                />
              )}
            </View>

            {data.observaciones && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>OBSERVACIONES</Text>
                <Text style={styles.observaciones}>{data.observaciones}</Text>
              </View>
            )}

            {/* Pie */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Este documento ha sido generado automáticamente por EGChat y refleja datos
                reales de actividad en la plataforma. Válido como referencia financiera ante
                entidades bancarias.
              </Text>
            </View>
          </ScrollView>

          {/* Botones */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
              <Text style={styles.shareBtnText}>📤 Compartir Informe</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeAction} onPress={onClose}>
              <Text style={styles.closeActionText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0F0F1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    borderTopWidth: 1,
    borderColor: '#2A2A4A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A4A',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  headerSub: { fontSize: 12, color: '#8888AA', marginTop: 2 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#2A2A4A', alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  scroll: { paddingHorizontal: 20 },
  sello: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 20,
    padding: 16,
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#00D4FF',
  },
  selloLogo: {
    fontSize: 28, fontWeight: '900', color: '#00D4FF',
    width: 48, textAlign: 'center',
  },
  selloTitle: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  selloSub: { fontSize: 11, color: '#8888AA', marginTop: 2 },
  section: {
    marginBottom: 20,
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2A2A4A',
  },
  sectionTitle: {
    fontSize: 11, fontWeight: '800', color: '#00D4FF',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
  },
  dataRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: '#1A1A2E',
  },
  dataLabel: { fontSize: 13, color: '#8888AA', flex: 1 },
  dataValue: { fontSize: 13, color: '#FFFFFF', fontWeight: '600', flex: 1, textAlign: 'right' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  scoreBarBg: {
    flex: 1, height: 10, backgroundColor: '#2A2A4A', borderRadius: 5, overflow: 'hidden',
  },
  scoreBarFill: { height: 10, borderRadius: 5 },
  scoreNum: { fontSize: 16, fontWeight: '800', minWidth: 60, textAlign: 'right' },
  scoreDesc: { fontSize: 12, color: '#AAAACC', lineHeight: 18, marginTop: 4 },
  observaciones: { fontSize: 13, color: '#AAAACC', lineHeight: 20 },
  footer: {
    marginVertical: 20, padding: 14,
    backgroundColor: '#0A0A14', borderRadius: 10,
    borderWidth: 1, borderColor: '#2A2A4A',
  },
  footerText: { fontSize: 11, color: '#666688', lineHeight: 16, textAlign: 'center' },
  actions: {
    padding: 16, gap: 10,
    borderTopWidth: 1, borderTopColor: '#2A2A4A',
  },
  shareBtn: {
    backgroundColor: '#00D4FF', borderRadius: 12,
    padding: 14, alignItems: 'center',
  },
  shareBtnText: { fontSize: 15, fontWeight: '800', color: '#000000' },
  closeAction: {
    backgroundColor: '#1A1A2E', borderRadius: 12,
    padding: 12, alignItems: 'center',
    borderWidth: 1, borderColor: '#2A2A4A',
  },
  closeActionText: { fontSize: 14, color: '#8888AA', fontWeight: '600' },
});
