// UI compartida módulos financieros — paridad web Bancos/Facturas/Seguros
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Pressable,
  ScrollView, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Polyline, Path } from 'react-native-svg';

const { height: SCREEN_H } = Dimensions.get('window');

export const FinancialModuleShell = ({
  visible, title, subtitle, onBack, onClose,
  headerGradient, headerAction, fixedTop, children, onRefresh,
  hideBack, centerTitle,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  onBack: () => void;
  onClose: () => void;
  headerGradient?: [string, string];
  headerAction?: React.ReactNode;
  fixedTop?: React.ReactNode;
  children: React.ReactNode;
  onRefresh?: () => void;
  hideBack?: boolean;
  centerTitle?: boolean;
}) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable style={fs.overlay} onPress={onClose}>
      <Pressable style={fs.sheet} onPress={() => {}}>
        <View style={fs.handleWrap}><View style={fs.handle} /></View>
        {headerGradient ? (
          <LinearGradient colors={headerGradient} style={fs.headerGrad}>
            <TouchableOpacity onPress={onBack} style={fs.headerBtnLight}><Text style={fs.backLight}>←</Text></TouchableOpacity>
            <View style={fs.headerCenter}>
              <Text style={fs.titleLight}>{title}</Text>
              {subtitle ? <Text style={fs.subLight}>{subtitle}</Text> : null}
            </View>
            {headerAction}
            <TouchableOpacity onPress={onClose} style={fs.headerBtnLight}><Text style={fs.backLight}>✕</Text></TouchableOpacity>
          </LinearGradient>
        ) : (
          <View style={[fs.header, centerTitle && fs.headerCentered]}>
            {hideBack ? <View style={fs.headerBtn} /> : (
              <TouchableOpacity onPress={onBack} style={fs.headerBtn}><Text style={fs.back}>←</Text></TouchableOpacity>
            )}
            <View style={[fs.headerCenter, centerTitle && { alignItems: 'center' }]}>
              <Text style={[fs.title, centerTitle && fs.titleCentered]}>{title}</Text>
              {subtitle ? <Text style={[fs.sub, centerTitle && fs.subCentered]}>{subtitle}</Text> : null}
            </View>
            {headerAction || <View style={fs.headerBtn} />}
            <TouchableOpacity onPress={onClose} style={fs.headerBtn}><Text style={fs.close}>✕</Text></TouchableOpacity>
          </View>
        )}
        {fixedTop}
        <ScrollView style={fs.body} contentContainerStyle={fs.bodyContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
        {onRefresh && (
          <TouchableOpacity style={fs.fab} onPress={onRefresh} activeOpacity={0.85}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round">
              <Polyline points="23 4 23 10 17 10" /><Path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </Svg>
          </TouchableOpacity>
        )}
      </Pressable>
    </Pressable>
  </Modal>
);

export const SummaryCard = ({
  label, amount, stats, colors,
}: {
  label: string;
  amount: number | string;
  stats: Array<{ v: number | string; l: string }>;
  colors: [string, string];
}) => (
  <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={fs.summary}>
    <Text style={fs.summaryLabel}>{label}</Text>
    <Text style={fs.summaryAmount}>
      {typeof amount === 'number' ? amount.toLocaleString() : amount}
      <Text style={fs.summaryCurrency}> XAF</Text>
    </Text>
    <View style={fs.summaryStats}>
      {stats.map((s, i) => (
        <View key={i} style={[fs.statCol, i < stats.length - 1 && fs.statBorder]}>
          <Text style={fs.statVal}>{s.v}</Text>
          <Text style={fs.statLbl}>{s.l}</Text>
        </View>
      ))}
    </View>
  </LinearGradient>
);

export const FilterChips = ({
  options, value, onChange, activeColor = '#C47D2A',
}: {
  options: Array<{ id: string; label: string }>;
  value: string;
  onChange: (id: string) => void;
  activeColor?: string;
}) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={fs.filterScroll} contentContainerStyle={fs.filterContent}>
    {options.map(o => (
      <TouchableOpacity
        key={o.id}
        onPress={() => onChange(o.id)}
        style={[fs.chip, value === o.id && { backgroundColor: activeColor, borderColor: activeColor }]}
      >
        <Text style={[fs.chipText, value === o.id && fs.chipTextActive]}>{o.label}</Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
);

export const BankLogo = ({ bank, size = 38 }: { bank: { color: string; color2: string; initials: string }; size?: number }) => (
  <LinearGradient
    colors={[bank.color, bank.color2]}
    style={{ width: size, height: size, borderRadius: size * 0.28, alignItems: 'center', justifyContent: 'center' }}
  >
    <Text style={{ color: '#fff', fontSize: size * 0.32, fontWeight: '900' }}>{bank.initials}</Text>
  </LinearGradient>
);

export const StatusPill = ({ status }: { status: string }) => {
  const cfg: Record<string, { bg: string; color: string; label: string }> = {
    pendiente: { bg: '#FEF3C7', color: '#92400E', label: 'Pendiente' },
    vencida: { bg: '#FEF2F2', color: '#DC2626', label: 'Vencida' },
    pagada: { bg: '#F0FAF5', color: '#16A34A', label: 'Pagada' },
  };
  const s = cfg[status] || { bg: '#F3F4F6', color: '#6B7280', label: status };
  return (
    <View style={{ backgroundColor: s.bg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: s.color }}>{s.label}</Text>
    </View>
  );
};

const fs = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#F7F8FA', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: SCREEN_H * 0.92, overflow: 'hidden' },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#F7F8FA' },
  headerGrad: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14 },
  headerBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EAECEF', alignItems: 'center', justifyContent: 'center' },
  headerBtnLight: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1 },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  sub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  titleLight: { fontSize: 15, fontWeight: '800', color: '#fff' },
  subLight: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  back: { fontSize: 16, color: '#6B7280' },
  close: { fontSize: 14, color: '#6B7280' },
  backLight: { fontSize: 16, color: '#fff' },
  body: { flexGrow: 0 },
  bodyContent: { paddingHorizontal: 16, paddingBottom: 80 },
  fab: {
    position: 'absolute', right: 16, bottom: 24, width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#00C8A0', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 6,
  },
  summary: { borderRadius: 16, padding: 16, marginBottom: 12 },
  summaryLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  summaryAmount: { fontSize: 28, fontWeight: '900', color: '#fff', marginBottom: 10 },
  summaryCurrency: { fontSize: 14, fontWeight: '400', opacity: 0.8 },
  summaryStats: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, overflow: 'hidden' },
  statCol: { flex: 1, paddingVertical: 8, alignItems: 'center' },
  statBorder: { borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.2)' },
  statVal: { fontSize: 16, fontWeight: '800', color: '#fff' },
  statLbl: { fontSize: 9, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  filterScroll: { marginBottom: 12, maxHeight: 40 },
  filterContent: { gap: 6, paddingRight: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' },
  chipText: { fontSize: 11, fontWeight: '700', color: '#6B7280' },
  chipTextActive: { color: '#fff' },
  headerCentered: { justifyContent: 'center' },
  titleCentered: { textAlign: 'center' },
  subCentered: { textAlign: 'center' },
});

/** Tabs iguales ancho — paridad web Salud / Educación */
export const SegmentTabs = ({
  options, value, onChange, activeColor = '#C0392B',
}: {
  options: Array<{ id: string; label: string }>;
  value: string;
  onChange: (id: string) => void;
  activeColor?: string;
}) => (
  <View style={st.row}>
    {options.map(o => (
      <TouchableOpacity
        key={o.id}
        onPress={() => onChange(o.id)}
        style={[st.tab, value === o.id && { backgroundColor: activeColor, borderColor: activeColor }]}
      >
        <Text style={[st.tabText, value === o.id && st.tabTextActive]} numberOfLines={1}>{o.label}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

const st = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4, marginBottom: 10 },
  tab: {
    flex: 1, backgroundColor: '#fff', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 2,
    borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center',
  },
  tabText: { fontSize: 10, fontWeight: '700', color: '#6B7280', textAlign: 'center' },
  tabTextActive: { color: '#fff' },
});
