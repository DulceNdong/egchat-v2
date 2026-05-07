import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const Icon = ({ name, color }: { name: string; color: string }) => {
  const icons: Record<string, string> = {
    mensajes: '💬', monedero: '💳', servicios: '⚡', lia: '🤖', ajustes: '⚙️'
  };
  return <Text style={{ fontSize: 22 }}>{icons[name] || '●'}</Text>;
};

const GradientTabBar = (props: any) => {
  return (
    <LinearGradient
      colors={['#00c8a0', '#00b4e6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.tabBarGradient, props.style]}
    >
      {props.children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  tabBarGradient: {
    height: 60,
    paddingBottom: 8,
    borderTopWidth: 0,
  },
});

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          height: 60,
          paddingBottom: 8,
          elevation: 0,
        },
        tabBarBackground: () => (
          <LinearGradient
            colors={['#00c8a0', '#00b4e6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
        ),
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.6)',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Mensajería', tabBarIcon: ({ color }) => <Icon name="mensajes" color={color} /> }} />
      <Tabs.Screen name="monedero" options={{ title: 'Cartera', tabBarIcon: ({ color }) => <Icon name="monedero" color={color} /> }} />
      <Tabs.Screen name="servicios" options={{ title: 'Servicios', tabBarIcon: ({ color }) => <Icon name="servicios" color={color} /> }} />
      <Tabs.Screen name="lia" options={{ title: 'Lia-25', tabBarIcon: ({ color }) => <Icon name="lia" color={color} /> }} />
      <Tabs.Screen name="ajustes" options={{ title: 'Ajustes', tabBarIcon: ({ color }) => <Icon name="ajustes" color={color} /> }} />
    </Tabs>
  );
}
