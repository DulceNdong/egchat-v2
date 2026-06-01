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
    // false en producción — solo activar para depuración con Chrome DevTools
    webContentsDebuggingEnabled: false,
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
    // StatusBar transparente: login y app pintan debajo con su propio fondo.
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#00000000',
      overlaysWebView: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
