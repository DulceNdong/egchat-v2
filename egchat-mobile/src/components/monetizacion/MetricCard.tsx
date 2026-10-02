import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  trend?: number; // porcentaje: positivo = sube, negativo = baja
  icon?: string;
  accentColor?: string;
  onPress?: () => void;
  fullWidth?: boolean;
}

export function MetricCard({
  label,
  value,
  subValue,
  trend,
  icon,
  accentColor = '#00D4FF',
  onPress,
  fullWidth = false,
}: MetricCardProps) {
  const trendPositive = trend !== undefined && trend >= 0;
  const trendColor = trendPositive ? '#00FF88' : '#FF4444';
  const trendArrow = trendPositive ? '↑' : '↓';

  const Content = (
    <View style={[styles.card, fullWidth && styles.fullWidth]}>
      <LinearGradient
        colors={['#1A1A2E', '#12122A']}
        style={styles.gradient}
      >
        {/* Barra de acento superior */}
        <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

        <View style={styles.body}>
          {icon && <Text style={styles.icon}>{icon}</Text>}
          <Text style={styles.label} numberOfLines={1}>{label}</Text>
          <Text style={[styles.value, { color: accentColor }]} numberOfLines={1} adjustsFontSizeToFit>
            {value}
          </Text>
          <View style={styles.footer}>
            {subValue && (
              <Text style={styles.subValue} numberOfLines={1}>{subValue}</Text>
            )}
            {trend !== undefined && (
              <View style={[styles.trendBadge, { backgroundColor: trendColor + '22' }]}>
                <Text style={[styles.trendText, { color: trendColor }]}>
                  {trendArrow} {Math.abs(trend).toFixed(1)}%
                </Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[styles.wrapper, fullWidth && styles.fullWidth]}>
        {Content}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.wrapper, fullWidth && styles.fullWidth]}>{Content}</View>;
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    minWidth: 150,
    margin: 6,
  },
  fullWidth: {
    flex: 0,
    minWidth: '100%',
    margin: 6,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2A2A4A',
  },
  gradient: {
    borderRadius: 16,
  },
  accentBar: {
    height: 3,
    width: '100%',
  },
  body: {
    padding: 16,
  },
  icon: {
    fontSize: 22,
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    color: '#8888AA',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 4,
  },
  subValue: {
    fontSize: 11,
    color: '#6666AA',
    flexShrink: 1,
  },
  trendBadge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
