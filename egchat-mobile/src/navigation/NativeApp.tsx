import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const RootStack = createStackNavigator();
const AppTabs = createBottomTabNavigator();

function PlaceholderScreen({ title }: { title: string }) {
  return (
    <View style={styles.centered}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Base nativa React Navigation en construcción.</Text>
    </View>
  );
}

function MainTabs() {
  return (
    <AppTabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 64,
          paddingBottom: 8,
        },
      }}
    >
      <AppTabs.Screen
        name="Mensajeria"
        options={{ title: 'Mensajes' }}
        component={() => <PlaceholderScreen title="Mensajería nativa" />}
      />
      <AppTabs.Screen
        name="Monedero"
        options={{ title: 'Cartera' }}
        component={() => <PlaceholderScreen title="Monedero nativo" />}
      />
      <AppTabs.Screen
        name="Servicios"
        options={{ title: 'Servicios' }}
        component={() => <PlaceholderScreen title="Servicios nativo" />}
      />
      <AppTabs.Screen
        name="Ajustes"
        options={{ title: 'Ajustes' }}
        component={() => <PlaceholderScreen title="Ajustes nativo" />}
      />
    </AppTabs.Navigator>
  );
}

function AuthFlow() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen
        name="Login"
        component={() => <PlaceholderScreen title="Login nativo" />}
      />
      <RootStack.Screen
        name="Register"
        component={() => <PlaceholderScreen title="Registro nativo" />}
      />
      <RootStack.Screen
        name="ForgotPassword"
        component={() => <PlaceholderScreen title="Recuperar contraseña" />}
      />
      <RootStack.Screen name="AppTabs" component={MainTabs} />
    </RootStack.Navigator>
  );
}

export default function NativeApp() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <NavigationContainer>
          <AuthFlow />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#07111f',
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 12,
    color: '#9db4c2',
    fontSize: 14,
    textAlign: 'center',
  },
});
