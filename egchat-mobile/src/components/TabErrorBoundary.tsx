/**
 * TabErrorBoundary — Aísla el crash de un tab
 * Si un tab crashea, muestra un fallback sin afectar los demás.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface State {
  hasError: boolean;
  error?: Error;
}

interface Props {
  children: React.ReactNode;
  tabName?: string;
}

export class TabErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.warn(`[TabErrorBoundary] ${this.props.tabName || 'Tab'} crasheó:`, error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={st.container}>
          <Text style={st.emoji}>⚠️</Text>
          <Text style={st.title}>
            {this.props.tabName || 'Esta sección'} no está disponible
          </Text>
          <Text style={st.subtitle}>
            {this.state.error?.message || 'Error inesperado'}
          </Text>
          <TouchableOpacity
            style={st.btn}
            onPress={() => this.setState({ hasError: false })}
          >
            <Text style={st.btnText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const st = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 24,
    gap: 12,
  },
  emoji: { fontSize: 48 },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    maxWidth: 280,
  },
  btn: {
    marginTop: 8,
    backgroundColor: '#00C8A0',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
