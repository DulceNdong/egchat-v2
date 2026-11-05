import { Stack } from 'expo-router';

export default function MonetizacionLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0A0A0A' },
        headerTintColor: '#00D4FF',
        headerTitleStyle: { fontWeight: '800', color: '#FFFFFF' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: '#0A0A0A' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: '💰 Monetización', headerLargeTitle: false }}
      />
      <Stack.Screen name="empresas" options={{ title: '🏢 Empresas' }} />
      <Stack.Screen name="taxis" options={{ title: '🚖 Taxis' }} />
      <Stack.Screen name="barcos" options={{ title: '⛵ Barcos' }} />
      <Stack.Screen name="monedero" options={{ title: '💳 Monedero' }} />
      <Stack.Screen name="perfil-financiero" options={{ title: '👤 Perfiles Usuarios' }} />
      <Stack.Screen name="perfil-negocio" options={{ title: '🏪 Perfiles Negocios' }} />
    </Stack>
  );
}
