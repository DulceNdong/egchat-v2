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
      // launchAutoHide: false → ocultamos manualmente cuando la web esté lista
      launchAutoHide: false,
      // Tiempo máximo de seguridad — si algo falla, se oculta sola a los 8s
      launchShowDuration: 8000,
      // Color de fondo EGCHAT (debe coincidir con el color del splash drawable)
      backgroundColor: '#00c8a0',
      // Android: usar SplashScreen nativa de Android 12+ si está disponible
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      // Animación de fade al ocultar
      fadeInDuration: 200,
      fadeOutDuration: 400,
      showSpinner: false,
      // Modo oscuro: mismo color (la imagen cambia via drawable-night)
      splashFullScreen: true,
      splashImmersive: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
