import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.egchat.app',
  appName: 'EGCHAT',
  webDir: 'dist',
  server: {
    // Modo local: carga los assets del APK (funciona sin red)
    // La app se actualiza via Service Worker cuando hay conexión
    androidScheme: 'https',
    cleartext: false,
    allowNavigation: ['egchat-v2.vercel.app', '*.vercel.app', '*.supabase.co', 'egchat-api.onrender.com']
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#00c8a0',
    captureInput: true,
    webContentsDebuggingEnabled: false,
    navigationBarColor: '#00000000',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#00c8a0',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      fadeInDuration: 200,
      fadeOutDuration: 300,
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
