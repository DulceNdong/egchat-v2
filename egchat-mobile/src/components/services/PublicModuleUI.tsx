// UI compartida módulos servicios públicos — paridad capturas web
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Polygon, Circle, Path } from 'react-native-svg';
import { PAY_METHODS, UtilityVariant } from '../../data/serviciosPublicos';

export const SegesaLogo = ({ size = 56 }: { size?: number }) => (
  <View style={[pb.logoBox, { width: size, height: size }]}>
    <Svg width={size * 0.7} height={size * 0.7} viewBox="0 0 200 200">
      <Polygon points="115,20 75,105 105,105 85,180 145,85 112,85" fill="#FFD700" />
      <Circle cx="100" cy="100" r="72" fill="none" stroke="#FFD700" strokeWidth="3" opacity={0.3} />
    </Svg>
  </View>
);

export const SngeLogo = ({ size = 56 }: { size?: number }) => (
  <View style={[pb.logoBox, { width: size, height: size, backgroundColor: '#fff' }]}>
    <Svg width={size * 0.65} height={size * 0.65} viewBox="0 0 200 200">
      <Path d="M100 50 C75 65 55 80 50 100 C45 120 60 145 80 155 C100 165 125 160 140 145 C155 130 158 105 150 85 C142 65 120 50 100 50Z" fill="#1565C0" opacity={0.7} />
      <Circle cx="100" cy="100" r="18" fill="#0A4A8A" />
    </Svg>
  </View>
);

export const UtilityProviderBanner = ({
  variant, title, subtitle, statusLabel, statusColor, activeStep,
}: {
  variant: UtilityVariant;
  title: string;
  subtitle: string;
  statusLabel: string;
  statusColor: string;
  activeStep: number;
}) => {
  const cfg = variant === 'elec'
    ? { gradient: ['#1A3A6B', '#2A5298'] as [string, string], steps: ['Contrato', 'Factura', 'Pago', 'Confirmación'] }
    : { gradient: ['#0A4A8A', '#1565C0'] as [string, string], steps: [] as string[] };

  return (
    <LinearGradient colors={cfg.gradient} style={pb.utilBanner}>
      <View style={pb.bannerRow}>
        {variant === 'elec' ? <SegesaLogo /> : <SngeLogo />}
        <View style={{ flex: 1 }}>
          <Text style={pb.bannerTitle}>{title}</Text>
          <Text style={pb.bannerSub}>{subtitle}</Text>
          <View style={pb.statusRow}>
            <View style={[pb.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[pb.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>
      </View>
      {cfg.steps.length > 0 && (
        <View style={pb.steps}>
          {cfg.steps.map((s, i) => (
            <React.Fragment key={s}>
              <View style={pb.stepCol}>
                <View style={[pb.stepCircle, i === activeStep && pb.stepCircleActive]}>
                  <Text style={[pb.stepNum, i === activeStep && pb.stepNumActive]}>{i + 1}</Text>
                </View>
                <Text style={[pb.stepLbl, i === activeStep && pb.stepLblActive]} numberOfLines={1}>{s}</Text>
              </View>
              {i < cfg.steps.length - 1 && <View style={pb.stepLine} />}
            </React.Fragment>
          ))}
        </View>
      )}
    </LinearGradient>
  );
};

export const IconFormField = ({
  placeholder, value, onChangeText, icon, keyboardType,
}: {
  placeholder: string; value: string; onChangeText: (v: string) => void;
  icon: string; keyboardType?: 'default' | 'phone-pad' | 'numeric';
}) => (
  <View style={pb.iconField}>
    <Text style={pb.fieldIcon}>{icon}</Text>
    <TextInput
      placeholder={placeholder}
      placeholderTextColor="#9CA3AF"
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      style={pb.fieldInput}
    />
  </View>
);

export const SearchField = ({
  placeholder, value, onChangeText,
}: {
  placeholder: string; value: string; onChangeText: (v: string) => void;
}) => (
  <View style={pb.searchField}>
    <Text style={pb.searchIcon}>🔍</Text>
    <TextInput
      placeholder={placeholder}
      placeholderTextColor="#9CA3AF"
      value={value}
      onChangeText={onChangeText}
      style={pb.searchInput}
    />
    {value.length > 0 && (
      <TouchableOpacity onPress={() => onChangeText('')} hitSlop={8}>
        <Text style={pb.searchClear}>✕</Text>
      </TouchableOpacity>
    )}
  </View>
);

export const PayMethodPicker = ({
  value, onChange, accent,
}: {
  value: string; onChange: (id: string) => void; accent: string;
}) => (
  <View>
    <Text style={pb.sectionLbl}>Método de pago</Text>
    <View style={pb.payRow}>
      {PAY_METHODS.map(m => (
        <TouchableOpacity
          key={m.id}
          style={[pb.payChip, value === m.id && { borderColor: accent, backgroundColor: accent + '12' }]}
          onPress={() => onChange(m.id)}
        >
          <Text style={{ fontSize: 18 }}>{m.icon}</Text>
          <Text style={[pb.payLbl, value === m.id && { color: accent }]}>{m.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

export const ServiceOptionRow = ({
  icon, label, sub, price, color, onPress, rightMeta,
}: {
  icon: string; label: string; sub: string; price?: string; color: string;
  onPress: () => void; rightMeta?: string;
}) => (
  <TouchableOpacity style={pb.optionRow} onPress={onPress} activeOpacity={0.75}>
    <View style={[pb.optionIcon, { backgroundColor: color + '18' }]}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
    </View>
    <View style={{ flex: 1 }}>
      <Text style={pb.optionLabel}>{label}</Text>
      <Text style={pb.optionSub}>{sub}</Text>
    </View>
    {rightMeta ? <Text style={pb.optionMeta}>{rightMeta}</Text> : null}
    {price ? <Text style={[pb.optionPrice, { color }]}>{price}</Text> : <Text style={pb.arrow}>›</Text>}
  </TouchableOpacity>
);

export const FacturaResultCard = ({
  accent, periodo, vencimiento, importe, estado,
}: {
  accent: string; periodo: string; vencimiento: string; importe: number; estado: string;
}) => (
  <View style={[pb.facturaCard, { borderColor: accent + '40' }]}>
    <View style={pb.facturaTop}>
      <Text style={[pb.facturaTitle, { color: accent }]}>Factura encontrada</Text>
      <View style={[pb.badge, estado === 'Pendiente' ? pb.badgeWarn : pb.badgeOk]}>
        <Text style={[pb.badgeText, estado === 'Pendiente' ? { color: '#92400E' } : { color: '#16A34A' }]}>{estado}</Text>
      </View>
    </View>
    {([['Período', periodo], ['Vencimiento', vencimiento], ['Importe', `${importe.toLocaleString()} XAF`]] as const).map(([l, v]) => (
      <View key={l} style={pb.facturaRow}>
        <Text style={pb.facturaLbl}>{l}</Text>
        <Text style={pb.facturaVal}>{v}</Text>
      </View>
    ))}
    <View style={pb.facturaTotal}>
      <Text style={[pb.facturaTotalLbl, { color: accent }]}>Total a pagar</Text>
      <Text style={[pb.facturaTotalVal, { color: accent }]}>{importe.toLocaleString()} XAF</Text>
    </View>
  </View>
);

const pb = StyleSheet.create({
  logoBox: { borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  utilBanner: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14 },
  bannerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  bannerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  bannerSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '600' },
  steps: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 16 },
  stepCol: { alignItems: 'center', width: 56 },
  stepCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  stepCircleActive: { backgroundColor: '#FFD700' },
  stepNum: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.6)' },
  stepNumActive: { color: '#1A3A6B' },
  stepLbl: { fontSize: 8, color: 'rgba(255,255,255,0.5)', fontWeight: '600', marginTop: 3, textAlign: 'center' },
  stepLblActive: { color: '#FFD700' },
  stepLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 11 },
  iconField: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F9FAFB',
    borderRadius: 10, paddingHorizontal: 14, height: 52, borderWidth: 1.5, borderColor: '#E5E7EB', marginBottom: 6,
  },
  fieldIcon: { fontSize: 18, color: '#9CA3AF' },
  fieldInput: { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' },
  searchField: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff',
    borderRadius: 10, paddingHorizontal: 12, height: 40, borderWidth: 1, borderColor: '#F0F2F5', marginBottom: 8,
  },
  searchIcon: { fontSize: 14, color: '#9CA3AF' },
  searchInput: { flex: 1, fontSize: 13, color: '#111827' },
  searchClear: { fontSize: 14, color: '#9CA3AF' },
  sectionLbl: { fontSize: 12, fontWeight: '600', color: '#9CA3AF', marginBottom: 8, marginTop: 4 },
  payRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  payChip: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 8, padding: 8, alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E7EB', gap: 3 },
  payLbl: { fontSize: 10, fontWeight: '700', color: '#6B7280', textAlign: 'center' },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 13, marginBottom: 8, borderWidth: 1, borderColor: '#F0F2F5' },
  optionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  optionLabel: { fontSize: 14, fontWeight: '600', color: '#111827' },
  optionSub: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  optionPrice: { fontSize: 12, fontWeight: '700' },
  optionMeta: { fontSize: 11, color: '#9CA3AF', marginRight: 4 },
  arrow: { fontSize: 20, color: '#D1D5DB' },
  facturaCard: { backgroundColor: '#EFF5FD', borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1 },
  facturaTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  facturaTitle: { fontSize: 12, fontWeight: '700' },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  badgeWarn: { backgroundColor: '#FEF3C7' },
  badgeOk: { backgroundColor: '#F0FDF4' },
  badgeText: { fontSize: 10, fontWeight: '700' },
  facturaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#DBEAFE' },
  facturaLbl: { fontSize: 12, color: '#6B7280' },
  facturaVal: { fontSize: 12, fontWeight: '700', color: '#111827' },
  facturaTotal: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8 },
  facturaTotalLbl: { fontSize: 14, fontWeight: '700' },
  facturaTotalVal: { fontSize: 18, fontWeight: '900' },
});
