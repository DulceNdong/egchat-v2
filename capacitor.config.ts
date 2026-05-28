import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.egchat.app',
  appName: 'EGCHAT',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    cleartext: false,
    allowNavigation: [
      'egchat-v2.vercel.app',
      '*.vercel.app',
      '*.supabase.co',
      'egchat-api.onrender.com',
      '*.onrender.com',
    ]
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#00c8a0',
    captureInput: true,
    // true en desarrollo para poder inspeccionar con Chrome DevTools (chrome://inspect)
    // Cambiar a false antes de publicar en producción
    webContentsDebuggingEnabled: true,
    navigationBarColor: '#00000000',
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#00c8a0',
    preferredContentMode: 'mobile',
    scrollEnabled: true,
    limitsNavigationsToAppBoundDomains: true,
    allowsLinkPreview: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#00c8a0',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      iosSpinnerStyle: 'small',
      fadeInDuration: 200,
      fadeOutDuration: 300,
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    // StatusBar: overlaysWebView: false → la status bar del sistema queda FUERA del WebView.
    // El color de la status bar (#00c8a0) se iguala al color del header para que
    // visualmente parezca un bloque continuo — igual que en iPhone.
    // Funciona en TODOS los Android sin depender de safe-area-inset-top ni paddingTop.
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#00c8a0',
      overlaysWebView: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
