import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface RevenueRow {
  label: string;
  value: string;
  subLabel?: string;
  color?: string;
  percentage?: number; // 0-100 para barra de progreso
}

interface RevenueTableProps {
  rows: RevenueRow[];
  title?: string;
  showBars?: boolean;
}

export function RevenueTable({ rows, title, showBars = true }: RevenueTableProps) {
  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      {rows.map((row, i) => (
        <View key={i} style={[styles.row, i < rows.length - 1 && styles.rowBorder]}>
          <View style={styles.rowLeft}>
            {row.color && (
              <View style={[styles.colorDot, { backgroundColor: row.color }]} />
            )}
            <View style={styles.labelContainer}>
              <Text style={styles.label} numberOfLines={1}>{row.label}</Text>
              {row.subLabel && (
                <Text style={styles.subLabel} numberOfLines={1}>{row.subLabel}</Text>
              )}
            </View>
          </View>
          <View style={styles.rowRight}>
            {showBars && row.percentage !== undefined && (
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      width: `${Math.min(row.percentage, 100)}%`,
                      backgroundColor: row.color || '#00D4FF',
                    },
                  ]}
                />
              </View>
            )}
            <Text style={[styles.value, row.color ? { color: row.color } : null]}>
              {row.value}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A4A',
  },
  title: {
    fontSize: 13,
    color: '#8888AA',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A4A',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
    minWidth: 0,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  labelContainer: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 13,
    color: '#CCCCEE',
    fontWeight: '500',
  },
  subLabel: {
    fontSize: 11,
    color: '#6666AA',
    marginTop: 1,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: 4,
    minWidth: 80,
  },
  barContainer: {
    width: 80,
    height: 4,
    backgroundColor: '#2A2A4A',
    borderRadius: 2,
    overflow: 'hidden',
  },
  bar: {
    height: 4,
    borderRadius: 2,
  },
  value: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
