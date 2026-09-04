/**
 * Mi Djangue - Demo mejorado
 * Versión simplificada compatible con React Native Web
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Svg, { Circle, Path, Line, G, Text as SvgText } from 'react-native-svg';

const { width } = Dimensions.get('window');

// Datos de ejemplo
const seedGroup = () => ({
  name: "Djangue Familiar",
  slogan: "Ahorrando juntos, cada quien en su turno.",
  tipo: "mensual",
  cuota: 500,
  members: [
    { id: "m1", name: "Ana Reyes", wallet: 3200 },
    { id: "m2", name: "Luis Peña", wallet: 2600 },
    { id: "m3", name: "Carla Núñez", wallet: 1800 },
    { id: "m4", name: "Diego Ortiz", wallet: 2100 },
    { id: "m5", name: "Sofía Mendoza", wallet: 1500 },
  ],
  turnIndex: 0,
  periodIndex: 0,
  contributions: {} as Record<string, { status: string }>,
  pot: 1500,
});

export default function DjangueDemoScreen() {
  const [group] = useState(seedGroup());
  const n = group.members.length;
  const beneficiary = group.members[group.turnIndex % n];
  const paidCount = group.members.filter((m) => group.contributions[m.id]?.status === "pagado").length;

  // Renderizar rueda visual
  const renderWheel = () => {
    const cx = 150, cy = 150, r = 100;
    return (
      <Svg width={240} height={240} viewBox="0 0 300 300">
        <Circle cx={cx} cy={cy} r={r} stroke="#E7DCC3" strokeWidth={2} fill="none" />
        {group.members.map((m, i) => {
          const angle = (2 * Math.PI * i) / n - Math.PI / 2;
          const x = cx + r * Math.cos(angle);
          const y = cy + r * Math.sin(angle);
          const isCurrent = i === group.turnIndex % n;
          const initials = m.name.split(" ").map((p) => p[0]).slice(0, 2).join("");
          
          return (
            <G key={m.id}>
              <Circle 
                cx={x} 
                cy={y} 
                r={22} 
                fill={isCurrent ? "#C9A227" : "#fff"} 
                stroke={isCurrent ? "#C9A227" : "#E7DCC3"}
                strokeWidth={2}
              />
              <SvgText
                x={x}
                y={y + 5}
                textAnchor="middle"
                fontSize="12"
                fontWeight="700"
                fill={isCurrent ? "#fff" : "#10202B"}
              >
                {initials}
              </SvgText>
            </G>
          );
        })}
        <SvgText x={cx} y={cy - 6} textAnchor="middle" fontSize="10" fill="#10202B" opacity="0.55">
          TURNO
        </SvgText>
        <SvgText x={cx} y={cy + 12} textAnchor="middle" fontSize="13" fontWeight="700" fill="#10202B">
          {beneficiary?.name.split(" ")[0]}
        </SvgText>
      </Svg>
    );
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      {/* Header */}
      <LinearGradient colors={['#10202B', '#2d3561']} style={s.header}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backText}>←</Text>
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>{group.name}</Text>
            <Text style={s.headerSub}>{group.slogan}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={s.content} contentContainerStyle={s.contentContainer}>
        {/* KPIs */}
        <View style={s.kpiGrid}>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Recaudado este periodo</Text>
            <Text style={s.kpiValue}>${group.pot.toLocaleString()}</Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Al día</Text>
            <Text style={s.kpiValue}>{paidCount}/{n}</Text>
          </View>
        </View>

        {/* Rueda visual */}
        <View style={s.wheelCard}>
          <View style={s.wheelContainer}>
            {renderWheel()}
          </View>
          <View style={s.progressSection}>
            <View style={s.progressHeader}>
              <Text style={s.progressLabel}>Aportes del periodo</Text>
              <Text style={s.progressValue}>{paidCount}/{n}</Text>
            </View>
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: `${(paidCount / n) * 100}%` }]} />
            </View>
            <Text style={s.potText}>Bote actual: ${group.pot.toLocaleString()}</Text>
          </View>
        </View>

        {/* Lista de miembros */}
        <View style={s.membersCard}>
          <Text style={s.sectionTitle}>Integrantes</Text>
          {group.members.map((m, i) => {
            const isCurrent = i === group.turnIndex % n;
            return (
              <View key={m.id} style={[s.memberRow, isCurrent && s.memberRowCurrent]}>
                <View style={s.memberAvatar}>
                  <Text style={s.memberInitials}>
                    {m.name.split(" ").map(p => p[0]).join("")}
                  </Text>
                </View>
                <View style={s.memberInfo}>
                  <Text style={s.memberName}>{m.name}</Text>
                  <Text style={s.memberDetails}>Turno #{i + 1} · ${m.wallet.toLocaleString()}</Text>
                </View>
                {isCurrent && (
                  <View style={s.currentBadge}>
                    <Text style={s.currentBadgeText}>En turno</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* NUEVA PÁGINA PRINCIPAL ÚNICA */}
        <View style={[s.navCard, { backgroundColor: '#00C8A0', borderColor: '#00B4E6', borderWidth: 2 }]}>
          <Text style={[s.sectionTitle, { color: '#fff' }]}>✨ Mi Djangue - Página Principal Única</Text>
          
          <TouchableOpacity 
            style={[s.navBtn, { backgroundColor: '#fff' }]}
            onPress={() => router.push('/mi-djangue')}
          >
            <View style={[s.navIcon, { backgroundColor: '#00C8A0' }]}>
              <Text style={[s.navIconText, { fontSize: 32 }]}>💰</Text>
            </View>
            <View style={s.navContent}>
              <Text style={s.navTitle}>ABRIR MI DJANGUE</Text>
              <Text style={s.navDesc}>
                TODO integrado: Inicio, Mis Djangues, Administración y Creación{'\n'}
                Logo real de EGChat girando • Diseño profesional • Fácil de usar
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Pantallas Individuales (para desarrollo) */}
        <View style={s.navCard}>
          <Text style={s.sectionTitle}>🔧 Pantallas Individuales (Desarrollo)</Text>
          
          {/* Inicio Principal */}
          <TouchableOpacity 
            style={[s.navBtn, { backgroundColor: '#00C8A0' }]}
            onPress={() => router.push('/djangue-home')}
          >
            <View style={[s.navIcon, { backgroundColor: '#fff' }]}>
              <Text style={s.navIconText}>🏠</Text>
            </View>
            <View style={s.navContent}>
              <Text style={[s.navTitle, { color: '#fff' }]}>Página de Inicio</Text>
              <Text style={[s.navDesc, { color: 'rgba(255,255,255,0.85)' }]}>Pantalla principal con logo EGChat y acceso rápido</Text>
            </View>
          </TouchableOpacity>

          {/* Lista de Djangues */}
          <TouchableOpacity 
            style={s.navBtn}
            onPress={() => router.push('/djangue-list')}
          >
            <View style={s.navIcon}>
              <Text style={s.navIconText}>📋</Text>
            </View>
            <View style={s.navContent}>
              <Text style={s.navTitle}>Mis Djangues</Text>
              <Text style={s.navDesc}>Lista con tabs: Administro / Participo - Cards grandes y claras</Text>
            </View>
          </TouchableOpacity>

          <View style={s.separator} />

          {/* Pantallas de Funcionalidad Completa */}
          <TouchableOpacity 
            style={s.navBtn}
            onPress={() => router.push('/djangue-admin-create')}
          >
            <View style={s.navIcon}>
              <Text style={s.navIconText}>👑</Text>
            </View>
            <View style={s.navContent}>
              <Text style={s.navTitle}>Crear Djangue</Text>
              <Text style={s.navDesc}>Formulario completo: logo, cuota, moras, configuración</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={s.navBtn}
            onPress={() => router.push({ pathname: '/djangue-detail', params: { id: 'demo-id' } } as any)}
          >
            <View style={s.navIcon}>
              <Text style={s.navIconText}>🎯</Text>
            </View>
            <View style={s.navContent}>
              <Text style={s.navTitle}>Detalle del Djangue (Admin)</Text>
              <Text style={s.navDesc}>Dashboard completo con progreso y acciones</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={s.navBtn}
            onPress={() => router.push({ pathname: '/djangue-secretary', params: { id: 'demo-id' } } as any)}
          >
            <View style={s.navIcon}>
              <Text style={s.navIconText}>📝</Text>
            </View>
            <View style={s.navContent}>
              <Text style={s.navTitle}>Panel del Secretario</Text>
              <Text style={s.navDesc}>Gestionar miembros, recordatorios, justificaciones</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={s.navBtn}
            onPress={() => router.push({ pathname: '/djangue-member', params: { id: 'demo-id' } } as any)}
          >
            <View style={s.navIcon}>
              <Text style={s.navIconText}>👤</Text>
            </View>
            <View style={s.navContent}>
              <Text style={s.navTitle}>Vista de Integrante</Text>
              <Text style={s.navDesc}>Info personal: turno, pagos, historial, chat</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={s.navBtn}
            onPress={() => router.push({ pathname: '/djangue-admin-stats', params: { id: 'demo-id' } } as any)}
          >
            <View style={s.navIcon}>
              <Text style={s.navIconText}>📊</Text>
            </View>
            <View style={s.navContent}>
              <Text style={s.navTitle}>Estadísticas</Text>
              <Text style={s.navDesc}>Métricas, gráficos, top contribuyentes, moras</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Info adicional */}
        <View style={s.infoCard}>
          <Text style={s.infoTitle}>✨ Sistema Completo Implementado</Text>
          <Text style={s.infoText}>
            ✅ 3 Roles: Administrador General, Secretario e Integrantes{'\n'}
            ✅ Notificaciones automáticas (10 días antes + últimos 5 días){'\n'}
            ✅ Chat grupal integrado con mensajes del sistema{'\n'}
            ✅ Cálculo automático de moras{'\n'}
            ✅ Cierre automático de turnos{'\n'}
            ✅ Panel de estadísticas y reportes{'\n'}
            ✅ Historial completo de transacciones
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F1EAD9' },
  header: { paddingHorizontal: 16, paddingBottom: 20, paddingTop: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 28, color: '#fff', fontWeight: '300' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2, fontStyle: 'italic' },
  content: { flex: 1 },
  contentContainer: { padding: 16, gap: 16 },
  kpiGrid: { flexDirection: 'row', gap: 10 },
  kpiCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(16,32,43,0.12)' },
  kpiLabel: { fontSize: 11, color: 'rgba(16,32,43,0.6)', marginBottom: 4 },
  kpiValue: { fontSize: 20, fontWeight: '700', color: '#10202B' },
  wheelCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: 'rgba(16,32,43,0.12)' },
  wheelContainer: { alignItems: 'center', marginBottom: 16 },
  progressSection: { gap: 6 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 12, color: 'rgba(16,32,43,0.6)' },
  progressValue: { fontSize: 12, fontWeight: '700', color: '#10202B' },
  progressTrack: { height: 8, backgroundColor: '#E7DCC3', borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#2C6E63', borderRadius: 999 },
  potText: { fontSize: 11, color: 'rgba(16,32,43,0.55)', marginTop: 2 },
  membersCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: 'rgba(16,32,43,0.12)', gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#10202B', marginBottom: 8 },
  memberRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(16,32,43,0.12)', gap: 10 },
  memberRowCurrent: { backgroundColor: '#E7DCC3' },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' },
  memberInitials: { fontSize: 14, fontWeight: '700', color: '#fff' },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 14, fontWeight: '600', color: '#10202B' },
  memberDetails: { fontSize: 11, color: 'rgba(16,32,43,0.55)', marginTop: 2 },
  currentBadge: { backgroundColor: '#E7C766', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  currentBadgeText: { fontSize: 11, fontWeight: '700', color: '#4A3A08' },
  infoCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: 'rgba(16,32,43,0.12)', gap: 10 },
  infoTitle: { fontSize: 16, fontWeight: '700', color: '#10202B' },
  infoText: { fontSize: 13, color: 'rgba(16,32,43,0.65)', lineHeight: 20 },
  navCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: 'rgba(16,32,43,0.12)', gap: 12 },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: 'rgba(16,32,43,0.08)' },
  navIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(16,32,43,0.08)' },
  navIconText: { fontSize: 24 },
  navContent: { flex: 1 },
  navTitle: { fontSize: 14, fontWeight: '700', color: '#10202B', marginBottom: 2 },
  navDesc: { fontSize: 11, color: 'rgba(16,32,43,0.55)', lineHeight: 16 },
  separator: { height: 1, backgroundColor: 'rgba(16,32,43,0.1)', marginVertical: 8 },
});
