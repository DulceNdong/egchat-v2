import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TabErrorBoundary } from '../../src/components/TabErrorBoundary';
import Svg, { Path, Circle, Rect, Line, Polyline, Polygon } from 'react-native-svg';
import { useThemeContext } from '../../src/theme/ThemeContext';

// ── Iconos SVG idénticos a la versión web ─────────────────────────
const NavIcon = ({ name, color, focused, size = 24 }: { name: string; color: string; focused?: boolean; size?: number }) => {
  const s = size;
  const sw = focused ? 2.2 : 1.8;
  switch (name) {

    // Inicio — casa moderna
    case 'home':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill={focused ? color + '22' : 'none'} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <Polyline points="9 22 9 12 15 12 15 22"/>
        </Svg>
      );

    // Mensajería — burbuja con puntos
    case 'mensajes':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill={focused ? color + '22' : 'none'} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          <Line x1="9" y1="10" x2="15" y2="10"/>
          <Line x1="9" y1="14" x2="13" y2="14"/>
        </Svg>
      );

    // Cartera — icono clásico de cartera
    case 'wallet':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill={focused ? color + '22' : 'none'} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M3 7h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/>
          <Path d="M3 10h17"/>
          <Path d="M14 10V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v1"/>
          <Circle cx="17" cy="14" r="1.5"/>
        </Svg>
      );

    // Servicios — 4 cuadrados redondeados
    case 'services':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill={focused ? color + '22' : 'none'} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <Rect x="3" y="3" width="7" height="7" rx="1.5"/>
          <Rect x="14" y="3" width="7" height="7" rx="1.5"/>
          <Rect x="14" y="14" width="7" height="7" rx="1.5"/>
          <Rect x="3" y="14" width="7" height="7" rx="1.5"/>
        </Svg>
      );

    // Ajustes — engranaje limpio
    case 'ajustes':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill={focused ? color + '22' : 'none'} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="12" cy="12" r="3"/>
          <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </Svg>
      );

    default:
      return null;
  }
};

// ── Tab icon con indicador activo ──────────────────────────────────
const TabIcon = ({ name, color, focused }: { name: string; color: string; focused: boolean }) => (
  <View style={{ alignItems: 'center', justifyContent: 'center' }}>
    <NavIcon name={name} color={color} focused={focused} size={24} />
  </View>
);

export default function TabsLayout() {
  const { isDark } = useThemeContext();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        lazy: false,
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: Platform.OS === 'ios' ? 92 : 72,
          borderTopWidth: 0,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          backgroundColor: 'transparent',
          overflow: 'hidden',
          paddingBottom: Platform.OS === 'ios' ? 10 : 6,
        },
        tabBarBackground: () => (
          <LinearGradient
            colors={['#07a472', '#00b4e6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />
        ),
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.5)',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.3,
          marginBottom: Platform.OS === 'ios' ? 2 : 5,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="mensajeria"
        options={{
          title: 'Mensajes',
          tabBarIcon: ({ color, focused }) => <TabIcon name="mensajes" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="monedero"
        options={{
          title: 'Cartera',
          tabBarIcon: ({ color, focused }) => <TabIcon name="wallet" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="servicios"
        options={{
          title: 'Servicios',
          tabBarIcon: ({ color, focused }) => <TabIcon name="services" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="ajustes"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color, focused }) => <TabIcon name="ajustes" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="lia"   options={{ href: null, tabBarStyle: { display: 'none' } }} />
    </Tabs>
  );
}
