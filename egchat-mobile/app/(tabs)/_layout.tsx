import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';

const Icon = ({ name, color }: { name: string; color: string }) => {
  const icons: Record<string, string> = {
    mensajes: '💬', monedero: '💳', servicios: '⚡', lia: '🤖', ajustes: '⚙️'
  };
  return <Text style={{ fontSize: 22 }}>{icons[name] || '●'}</Text>;
};

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#F0F2F5', height: 60, paddingBottom: 8 },
      tabBarActiveTintColor: '#00c8a0',
      tabBarInactiveTintColor: '#9CA3AF',
      tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Mensajes', tabBarIcon: ({ color }) => <Icon name="mensajes" color={color} /> }} />
      <Tabs.Screen name="monedero" options={{ title: 'Monedero', tabBarIcon: ({ color }) => <Icon name="monedero" color={color} /> }} />
      <Tabs.Screen name="servicios" options={{ title: 'Servicios', tabBarIcon: ({ color }) => <Icon name="servicios" color={color} /> }} />
      <Tabs.Screen name="lia" options={{ title: 'Lia-25', tabBarIcon: ({ color }) => <Icon name="lia" color={color} /> }} />
      <Tabs.Screen name="ajustes" options={{ title: 'Ajustes', tabBarIcon: ({ color }) => <Icon name="ajustes" color={color} /> }} />
    </Tabs>
  );
}
