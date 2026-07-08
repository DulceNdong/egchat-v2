import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Polyline } from 'react-native-svg';
import { Colors, Spacing, FontSize, FontWeight } from '../../theme';
import { useThemeContext } from '../../theme/ThemeContext';
import { DarkColors } from '../../theme/darkMode';

const Chevron = ({ color = '#c7c7cc' }: { color?: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round">
    <Polyline points="9 18 15 12 9 6" />
  </Svg>
);

export function SettingsLayout({
  title,
  children,
  scroll = true,
}: {
  title: string;
  children: React.ReactNode;
  scroll?: boolean;
}) {
  const { isDark } = useThemeContext();
  const C = isDark ? (DarkColors as unknown as typeof Colors) : Colors;
  const body = scroll ? (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={styles.scrollContent}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0d1117' : '#f2f2f7' }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: isDark ? '#161b22' : 'rgba(242,242,247,0.97)', borderBottomColor: C.borderLight }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Svg width={10} height={16} viewBox="0 0 10 18" fill="none" stroke={Colors.accent} strokeWidth={2.5} strokeLinecap="round">
            <Polyline points="9 1 1 9 9 17" />
          </Svg>
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.textPrimary }]}>{title}</Text>
        <View style={{ width: 72 }} />
      </View>
      {body}
    </SafeAreaView>
  );
}

export function SettingsSection({ label }: { label: string }) {
  if (!label) return <View style={{ height: 8 }} />;
  const { isDark } = useThemeContext();
  return (
    <Text style={[styles.sectionLabel, { color: isDark ? '#8b949e' : '#8e8e93' }]}>{label}</Text>
  );
}

export function SettingsCard({ children }: { children: React.ReactNode }) {
  const { isDark } = useThemeContext();
  return (
    <View style={[styles.card, { backgroundColor: isDark ? '#161b22' : '#fff' }]}>
      {children}
    </View>
  );
}

export function SettingsDivider() {
  const { isDark } = useThemeContext();
  return <View style={[styles.divider, { backgroundColor: isDark ? '#21262d' : '#f2f2f7' }]} />;
}

export function SettingsRow({
  label,
  value,
  onPress,
  danger,
  right,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  right?: React.ReactNode;
}) {
  const { isDark } = useThemeContext();
  const C = isDark ? (DarkColors as unknown as typeof Colors) : Colors;
  const content = (
    <>
      <Text style={[styles.rowLabel, { color: danger ? '#ef4444' : C.textPrimary }]} suppressHighlighting>{label}</Text>
      {right ?? (
        <View style={styles.rowRight}>
          {value ? <Text style={[styles.rowValue, { color: C.textTertiary }]}>{value}</Text> : null}
          {onPress ? <Chevron color={isDark ? '#484f58' : '#c7c7cc'} /> : null}
        </View>
      )}
    </>
  );

  if (!onPress) {
    return <View style={styles.row}>{content}</View>;
  }
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      {content}
    </TouchableOpacity>
  );
}

export function SettingsToggleRow({
  label,
  description,
  value,
  onValueChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  const { isDark } = useThemeContext();
  const C = isDark ? (DarkColors as unknown as typeof Colors) : Colors;
  return (
    <SettingsRow
      label={label}
      right={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {description ? (
            <Text style={{ fontSize: 12, color: C.textTertiary, maxWidth: 120, textAlign: 'right' }} numberOfLines={1}>
              {description}
            </Text>
          ) : null}
          <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: '#d1d5db', true: Colors.accent }}
            thumbColor="#fff"
          />
        </View>
      }
    />
  );
}

export function VisibilityRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { id: string; label: string }[];
  onChange: (id: string) => void;
}) {
  const { isDark } = useThemeContext();
  const C = isDark ? (DarkColors as unknown as typeof Colors) : Colors;
  const current = options.find(o => o.id === value)?.label ?? value;

  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: C.textPrimary, flex: 1 }]}>{label}</Text>
      <View style={styles.chipRow}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt.id}
            style={[
              styles.visChip,
              value === opt.id && { backgroundColor: 'rgba(7,193,96,0.15)', borderColor: Colors.accent },
            ]}
            onPress={() => onChange(opt.id)}
          >
            <Text style={{ fontSize: 11, fontWeight: '600', color: value === opt.id ? Colors.accent : C.textSecondary }}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {!options.length && <Text style={{ color: Colors.accent, fontSize: 14 }}>{current}</Text>}
    </View>
  );
}

export function SettingsSearch({
  value,
  onChangeText,
  placeholder = 'Buscar',
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
}) {
  const { isDark } = useThemeContext();
  const C = isDark ? (DarkColors as unknown as typeof Colors) : Colors;
  return (
    <View style={[styles.searchBox, { backgroundColor: isDark ? '#161b22' : '#fff' }]}>
      <Text style={{ color: C.textTertiary }}>🔍</Text>
      <TextInput
        style={[styles.searchInput, { color: C.textPrimary }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.textTertiary}
      />
      {value ? (
        <TouchableOpacity onPress={() => onChangeText('')}>
          <Text style={{ color: C.textTertiary, fontSize: 18 }}>×</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 72 },
  backText: { fontSize: 16, color: Colors.accent },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  scrollContent: { paddingBottom: 40 },
  sectionLabel: {
    fontSize: 13,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 16,
    paddingBottom: 6,
  },
  card: { overflow: 'hidden' },
  divider: { height: 1, marginLeft: Spacing.screenPadding },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: 13,
    gap: 8,
  },
  rowLabel: { fontSize: 16, flex: 1 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowValue: { fontSize: 14 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, maxWidth: '55%', justifyContent: 'flex-end' },
  visChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  searchBox: {
    marginHorizontal: Spacing.screenPadding,
    marginVertical: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
});
