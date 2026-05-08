import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.egchat.app',
  appName: 'EGCHAT',
  webDir: 'dist',
  server: {
    // OTA gratuito: la app siempre carga desde Vercel
    // Cada deploy actualiza la app automáticamente sin reinstalar
    url: 'https://egchat-v2.vercel.app',
    cleartext: false,
    androidScheme: 'https',
    hostname: 'egchat-v2.vercel.app',
    allowNavigation: ['egchat-v2.vercel.app', '*.vercel.app', '*.supabase.co']
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#00c8a0',
    captureInput: true,
    webContentsDebuggingEnabled: false,
    // Barra de navegación transparente — el modo inmersivo la oculta completamente
    // pero cuando reaparece temporalmente (gesture hint) se ve transparente
    navigationBarColor: '#00000000',
  },
  plugins: {
    SplashScreen: {
      // launchAutoHide: true — se oculta automáticamente tras launchShowDuration
      // El control manual causaba que la splash se quedara bloqueada en OTA
      launchAutoHide: true,
      launchShowDuration: 3000,
      backgroundColor: '#00c8a0',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      fadeInDuration: 200,
      fadeOutDuration: 400,
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
