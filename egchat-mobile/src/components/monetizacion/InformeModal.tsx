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
import { useTranslation } from '../../context/LanguageContext';

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
  /** Clave de traducción para las observaciones (usada cuando el texto debe traducirse) */
  observacionesKey?: string;
}

interface InformeModalProps {
  visible: boolean;
  onClose: () => void;
  data: InformeData | null;
}

const LOCALES: Record<string, string> = {
  es: 'es-ES',
  fr: 'fr-FR',
  en: 'en-GB',
  pt: 'pt-PT',
};

const fmtNumber = (n?: number, locale = 'es-ES') =>
  n !== undefined
    ? new Intl.NumberFormat(locale, { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n)
    : undefined;

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
  const { language, t } = useTranslation();
  if (!data) return null;

  const locale = LOCALES[language] || 'es-ES';
  const nd = t('mznInfNotAvailable');
  const fmt = (n?: number) => fmtNumber(n, locale) ?? nd;
  const sep = '================================';
  const thin = '--------------------------------';

  const fechaGeneracion = new Date().toLocaleDateString(locale, {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const obsTexto = data.observacionesKey ? t(data.observacionesKey) : data.observaciones;
  const serviciosUsados = (data.serviciosUsados ?? []).map(s => t(s)).join(', ');
  const serviciosActivos = (data.serviciosActivos ?? []).map(s => t(s)).join(', ');

  const bloqueObs = obsTexto
    ? `${t('mznInfSectionObs')}\n${obsTexto}\n${thin}\n`
    : '';

  const informeTexto = data.tipo === 'usuario'
    ? [
        t('mznInfHeaderUser'),
        sep,
        `${t('mznInfGeneratedBy')}: EGChat App`,
        `${t('mznInfDateLabel')}: ${fechaGeneracion}`,
        `${t('mznInfPeriod')}: ${data.periodo}`,
        thin,
        t('mznInfSectionHolder'),
        `${t('nameField')}: ${data.nombre}`,
        `${t('mznInfFinancialScore')}: ${data.scoreFinanciero ?? nd}/100`,
        `${t('mznInfMonthsActiveLabel')}: ${data.mesesActivo ?? 0}`,
        thin,
        t('mznInfSectionTxActivity'),
        `${t('mznTotalTransactions')}: ${data.numTransacciones ?? 0}`,
        `${t('mznInfTotalMoved')}: ${fmt(data.totalMovido)}`,
        `${t('mznMonthlyAverage')}: ${fmt(data.montoPromedio)}`,
        `${t('mznInfServicesUsed')}: ${serviciosUsados || nd}`,
        thin,
        bloqueObs,
        t('mznInfAutoUser'),
      ].join('\n')
    : [
        t('mznInfHeaderBusiness'),
        sep,
        `${t('mznInfGeneratedBy')}: EGChat App`,
        `${t('mznInfDateLabel')}: ${fechaGeneracion}`,
        `${t('mznInfPeriod')}: ${data.periodo}`,
        thin,
        t('mznInfSectionCompany'),
        `${t('mznInfReasonSocial')}: ${data.razonSocial ?? data.nombre}`,
        `${t('mznInfNif')}: ${data.nif || nd}`,
        `${t('mznSector')}: ${data.sector || nd}`,
        `${t('mznInfFinancialScore')}: ${data.scoreFinanciero ?? nd}/100`,
        `${t('mznMonthsInOperation')}: ${data.mesesOperacion ?? 0}`,
        thin,
        t('mznInfSectionActivity'),
        `${t('mznInfAvgMonthlyBilling')}: ${fmt(data.facturacionMensualPromedio)}`,
        `${t('mznInfAccumulatedBilling')}: ${fmt(data.facturacionTotal)}`,
        `${t('mznTotalTransactions')}: ${data.numTransacciones ?? 0}`,
        `${t('mznActiveServices')}: ${serviciosActivos || nd}`,
        thin,
        bloqueObs,
        t('mznInfAutoBusiness'),
      ].join('\n');

  const handleShare = async () => {
    try {
      await Share.share({
        message: informeTexto,
        title: `${t('mznInfShareTitle')} ${data.nombre}`,
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
              <Text style={styles.headerTitle}>{t('mznInfTitle')}</Text>
              <Text style={styles.headerSub}>{t('mznInfGeneratedOn')} {fechaGeneracion}</Text>
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
                <Text style={styles.selloSub}>{t('mznInfOfficialReport')}</Text>
              </View>
            </View>

            {/* Info general */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('mznInfSectionHolder')}</Text>
              <Row label={t('nameField')} value={data.nombre} />
              <Row label={t('mznType')} value={data.tipo === 'usuario' ? t('mznInfTypeUser') : t('mznInfTypeBusiness')} />
              <Row label={t('mznInfPeriod')} value={data.periodo} />
              {data.tipo === 'negocio' && data.nif && <Row label={t('mznInfNif')} value={data.nif} />}
              {data.tipo === 'negocio' && data.sector && <Row label={t('mznSector')} value={data.sector} />}
            </View>

            {/* Score */}
            {data.scoreFinanciero !== undefined && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('mznInfSectionScore')}</Text>
                <ScoreBar score={data.scoreFinanciero} />
                <Text style={styles.scoreDesc}>
                  {data.scoreFinanciero >= 70
                    ? t('mznInfScoreHigh')
                    : data.scoreFinanciero >= 40
                    ? t('mznInfScoreMedium')
                    : t('mznInfScoreLow')}
                </Text>
              </View>
            )}

            {/* Métricas */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('mznInfSectionActivity')}</Text>
              {data.numTransacciones !== undefined && (
                <Row label={t('mznTotalTransactions')} value={`${data.numTransacciones}`} />
              )}
              {data.totalMovido !== undefined && (
                <Row label={t('mznInfTotalMoved')} value={fmt(data.totalMovido)} />
              )}
              {data.montoPromedio !== undefined && (
                <Row label={t('mznMonthlyAverage')} value={fmt(data.montoPromedio)} />
              )}
              {data.facturacionMensualPromedio !== undefined && (
                <Row label={t('mznBillingMonth')} value={fmt(data.facturacionMensualPromedio)} />
              )}
              {data.facturacionTotal !== undefined && (
                <Row label={t('mznTotalBilling')} value={fmt(data.facturacionTotal)} />
              )}
              {data.mesesActivo !== undefined && (
                <Row label={t('mznInfMonthsActiveLabel')} value={`${data.mesesActivo} ${t('mznMonthsSuffix')}`} />
              )}
              {data.mesesOperacion !== undefined && (
                <Row label={t('mznMonthsInOperation')} value={`${data.mesesOperacion} ${t('mznMonthsSuffix')}`} />
              )}
              {(data.serviciosUsados ?? data.serviciosActivos) && (
                <Row
                  label={t('mznSvcServices')}
                  value={serviciosUsados || serviciosActivos}
                />
              )}
            </View>

            {obsTexto && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('mznInfSectionObs')}</Text>
                <Text style={styles.observaciones}>{obsTexto}</Text>
              </View>
            )}

            {/* Pie */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {t('mznInfFooter')}
              </Text>
            </View>
          </ScrollView>

          {/* Botones */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
              <Text style={styles.shareBtnText}>{t('mznInfShare')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeAction} onPress={onClose}>
              <Text style={styles.closeActionText}>{t('close')}</Text>
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
