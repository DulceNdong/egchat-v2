// Componente wrapper rápido para arreglar autenticación sin modificar App.tsx completo
import React from 'react';
import { AuthProvider } from './AuthContext';
import { initializeApiInterceptor } from './apiInterceptor';

// Inicializar interceptor
initializeApiInterceptor();

interface AuthWrapperProps {
  children: React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
};

export default AuthWrapper;
