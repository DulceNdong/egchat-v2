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
    webContentsDebuggingEnabled: false,
    navigationBarColor: '#00000000',
  },
  ios: {
    // overlaysWebView: true — el WebView ocupa TODA la pantalla incluyendo la status bar.
    // La app controla todo el espacio con env(safe-area-inset-*).
    // Esto elimina el doble header y el doble tab bar.
    contentInset: 'never',
    backgroundColor: '#00c8a0',
    preferredContentMode: 'mobile',
    scrollEnabled: false,      // evita scroll en body — solo el contenedor de mensajes scrollea
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
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#00c8a0',
      // overlaysWebView: true — el WebView se extiende bajo la status bar
      // La app dibuja su propio header encima con paddingTop = safe-area-inset-top
      overlaysWebView: true,
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
