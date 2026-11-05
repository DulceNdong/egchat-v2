// Stub para web — WebView no está disponible en navegador
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const WebView = ({ style }: any) => (
  <View style={[styles.container, style]}>
    <Text style={styles.text}>
      Las mini-apps requieren la app nativa (Android/iOS).{'\n'}
      No están disponibles en el navegador.
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' },
  text: { textAlign: 'center', color: '#9ca3af', fontSize: 14, lineHeight: 22, paddingHorizontal: 32 },
});
