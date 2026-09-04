/**
 * Mi Djangue - Página de Inicio Profesional
 * Diseño limpio y elegante con logo EGChat
 */

import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
  Dimensions, Image as RNImage,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path, Circle, G } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

export default function DjangueHomeScreen() {
  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#00C8A0', '#00B4E6', '#0099CC']}
        style={s.gradient}
      >
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          {/* Logo y Marca */}
          <View style={s.logoContainer}>
            <View style={s.logoCircle}>
              <Svg width={80} height={80} viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth={2} />
                <Path
                  d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"
                  stroke="#fff"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </Svg>
            </View>
            <Text style={s.brandName}>EGChat</Text>
            <View style={s.divider} />
            <Text style={s.productName}>Mi Djangue</Text>
          </View>

          {/* Ilustración Central */}
          <View style={s.illustrationContainer}>
            <View style={s.illustration}>
              {/* Círculo de personas */}
              <Svg width={200} height={200} viewBox="0 0 200 200">
                <G>
                  {/* Centro - Dinero */}
                  <Circle cx={100} cy={100} r={35} fill="#fff" opacity={0.9} />
                  <Path
                    d="M100 85v30M110 95h-20M110 105h-20"
                    stroke="#00C8A0"
                    strokeWidth={3}
                    strokeLinecap="round"
                  />
                  
                  {/* Personas alrededor */}
                  {[0, 60, 120, 180, 240, 300].map((angle, i) => {
                    const rad = (angle * Math.PI) / 180;
                    const x = 100 + 70 * Math.cos(rad);
                    const y = 100 + 70 * Math.sin(rad);
                    return (
                      <G key={i}>
                        <Circle cx={x} cy={y} r={15} fill="#fff" opacity={0.85} />
                        <Circle cx={x} cy={y - 2} r={5} fill="#00C8A0" />
                        <Path
                          d={`M${x - 6} ${y + 8} Q${x} ${y + 5} ${x + 6} ${y + 8}`}
                          stroke="#00C8A0"
                          strokeWidth={2}
                          strokeLinecap="round"
                          fill="none"
                        />
                      </G>
                    );
                  })}
                </G>
              </Svg>
            </View>
          </View>

          {/* Título y Descripción */}
          <View style={s.textContainer}>
            <Text style={s.title}>Ahorra en Grupo</Text>
            <Text style={s.subtitle}>
              El sistema tradicional de ahorro rotativo,{'\n'}
              ahora en tu móvil
            </Text>
          </View>

          {/* Botones de Acción */}
          <View style={s.buttonsContainer}>
            <TouchableOpacity
              style={s.primaryButton}
              onPress={() => router.push('/djangue-list')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#fff', '#f5f5f5']}
                style={s.buttonGradient}
              >
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                    stroke="#00C8A0"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M9 22V12h6v10"
                    stroke="#00C8A0"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <Text style={s.primaryButtonText}>Mis Djangues</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.secondaryButton}
              onPress={() => router.push('/djangue-admin-create')}
              activeOpacity={0.8}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Circle cx={12} cy={12} r={10} stroke="#fff" strokeWidth={2} />
                <Path
                  d="M12 8v8M8 12h8"
                  stroke="#fff"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </Svg>
              <Text style={s.secondaryButtonText}>Crear Nuevo Djangue</Text>
            </TouchableOpacity>
          </View>

          {/* Footer Info */}
          <View style={s.footer}>
            <View style={s.featureRow}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
                  stroke="#fff"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.7}
                />
                <Path
                  d="M22 4L12 14.01l-3-3"
                  stroke="#fff"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.7}
                />
              </Svg>
              <Text style={s.featureText}>Seguro y Confiable</Text>
            </View>
            <View style={s.featureRow}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                  stroke="#fff"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.7}
                />
                <Circle
                  cx={9}
                  cy={7}
                  r={4}
                  stroke="#fff"
                  strokeWidth={2}
                  opacity={0.7}
                />
                <Path
                  d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
                  stroke="#fff"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.7}
                />
              </Svg>
              <Text style={s.featureText}>Fácil para Todos</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#00C8A0',
  },
  gradient: {
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginVertical: 12,
    borderRadius: 1,
  },
  productName: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  illustrationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
  illustration: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: -10,
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonsContainer: {
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00C8A0',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    gap: 10,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    paddingBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },
});
