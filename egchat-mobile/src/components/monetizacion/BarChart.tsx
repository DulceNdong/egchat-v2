import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Text as SvgText, Line, Defs, LinearGradient, Stop } from 'react-native-svg';

export interface BarChartDataPoint {
  label: string;   // etiqueta del eje X (ej: "Ene", "Feb")
  value: number;   // valor numérico
}

interface BarChartProps {
  data: BarChartDataPoint[];
  height?: number;
  barColor?: string;
  barColorSecondary?: string;
  formatValue?: (v: number) => string;
  title?: string;
}

export function BarChart({
  data,
  height = 180,
  barColor = '#00D4FF',
  barColorSecondary = '#0066AA',
  formatValue,
  title,
}: BarChartProps) {
  const chartWidth = 340;
  const chartHeight = height - 40; // reservar espacio para labels
  const paddingLeft = 8;
  const paddingRight = 8;
  const paddingTop = 12;
  const paddingBottom = 28;

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const numBars = data.length;
  const totalBarWidth = (chartWidth - paddingLeft - paddingRight) / numBars;
  const barWidth = totalBarWidth * 0.6;
  const barGap = totalBarWidth * 0.4;

  const getBarHeight = (value: number) =>
    ((value / maxValue) * (chartHeight - paddingTop - paddingBottom));

  const formatVal = formatValue || ((v: number) => {
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
    return `${v}`;
  });

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <Svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        <Defs>
          <LinearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={barColor} stopOpacity="1" />
            <Stop offset="1" stopColor={barColorSecondary} stopOpacity="0.8" />
          </LinearGradient>
        </Defs>

        {/* Líneas horizontales de guía */}
        {[0.25, 0.5, 0.75, 1].map((frac) => {
          const y = paddingTop + (chartHeight - paddingTop - paddingBottom) * (1 - frac);
          return (
            <Line
              key={frac}
              x1={paddingLeft}
              y1={y}
              x2={chartWidth - paddingRight}
              y2={y}
              stroke="#2A2A4A"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          );
        })}

        {/* Barras */}
        {data.map((point, i) => {
          const bh = getBarHeight(point.value);
          const x = paddingLeft + i * totalBarWidth + barGap / 2;
          const y = chartHeight - paddingBottom - bh;
          const isLast = i === data.length - 1;

          return (
            <React.Fragment key={i}>
              <Rect
                x={x}
                y={bh > 0 ? y : chartHeight - paddingBottom - 2}
                width={barWidth}
                height={Math.max(bh, 2)}
                rx={4}
                ry={4}
                fill={isLast ? 'url(#barGrad)' : barColor + '99'}
              />
              {/* Valor sobre la barra (solo si cabe) */}
              {bh > 20 && (
                <SvgText
                  x={x + barWidth / 2}
                  y={y - 4}
                  fontSize="9"
                  fill={isLast ? barColor : '#8888AA'}
                  textAnchor="middle"
                  fontWeight={isLast ? 'bold' : 'normal'}
                >
                  {formatVal(point.value)}
                </SvgText>
              )}
              {/* Label eje X */}
              <SvgText
                x={x + barWidth / 2}
                y={chartHeight - paddingBottom + 16}
                fontSize="10"
                fill={isLast ? barColor : '#8888AA'}
                textAnchor="middle"
                fontWeight={isLast ? 'bold' : 'normal'}
              >
                {point.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    overflow: 'hidden',
  },
  title: {
    fontSize: 12,
    color: '#8888AA',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    fontWeight: '600',
  },
});
