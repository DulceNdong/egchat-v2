import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Polyline, Circle, Line } from 'react-native-svg';
import { Colors, Spacing } from '../../theme';
import { useThemeContext } from '../../theme/ThemeContext';
import { DarkColors } from '../../theme/darkMode';

const Chevron = ({ color = '#c7c7cc' }: { color?: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round">
    <Polyline points="9 18 15 12 9 6" />
  </Svg>
);

const SearchIcon = ({ color = '#8e8e93' }: { color?: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="11" cy="11" r="8" />
    <Line x1="21" y1="21" x2="16.65" y2="16.65" />
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
      <View style={[styles.header, { backgroundColor: isDark ? '#161b22' : 'rgba(242,242,247,0.97)', borderBottomColor: isDark ? '#21262d' : 'rgba(0,0,0,0.08)' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Svg width={11} height={18} viewBox="0 0 10 18" fill="none" stroke={Colors.accent} strokeWidth={2.5} strokeLinecap="round">
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
    <View style={[styles.card, { backgroundColor: isDark ? '#161b22' : '#ffffff' }]}>
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
          {value ? <Text style={[styles.rowValue, { color: isDark ? '#8b949e' : '#8e8e93' }]}>{value}</Text> : null}
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
  onChange: (v: string) => void;
}) {
  const { isDark } = useThemeContext();
  const C = isDark ? (DarkColors as unknown as typeof Colors) : Colors;
  const selected = options.find(o => o.id === value);

  return (
    <View style={visStyles.root}>
      <Text style={[visStyles.label, { color: C.textPrimary }]}>{label}</Text>
      <View style={visStyles.pills}>
        {options.map(opt => {
          const active = opt.id === value;
          return (
            <TouchableOpacity
              key={opt.id}
              onPress={() => onChange(opt.id)}
              activeOpacity={0.75}
              style={[
                visStyles.pill,
                {
                  backgroundColor: active ? Colors.accent : isDark ? '#21262d' : '#f2f2f7',
                  borderColor: active ? Colors.accent : isDark ? '#30363d' : '#d1d5db',
                },
              ]}
            >
              <Text
                style={[
                  visStyles.pillText,
                  { color: active ? '#fff' : isDark ? '#8b949e' : '#6b7280' },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const visStyles = StyleSheet.create({
  root: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  label: {
    fontSize: 15,
    marginBottom: 10,
  },
  pills: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

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
    <View style={[styles.searchBox, { backgroundColor: isDark ? '#161b22' : '#ffffff' }]}>
      <SearchIcon color={isDark ? '#8b949e' : '#8e8e93'} />
      <TextInput
        style={[styles.searchInput, { color: C.textPrimary }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={isDark ? '#8b949e' : '#a0a0a5'}
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 72 },
  backText: { fontSize: 16, color: Colors.accent, fontWeight: '500' },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  scrollContent: { paddingBottom: 40 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  card: { overflow: 'hidden' },
  divider: { height: 1, marginLeft: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  rowLabel: { fontSize: 15, flex: 1 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowValue: { fontSize: 13 },
  searchBox: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
});
