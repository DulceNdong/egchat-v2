import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.egchat.app',
  appName: 'EGCHAT',
  webDir: 'dist',
  // Cargar la PWA en vivo — misma experiencia que Safari PWA
  server: {
    url: 'https://egchat-v2.vercel.app',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#00c8a0',
    captureInput: true,
    webContentsDebuggingEnabled: false,
    navigationBarColor: '#00000000',
  },
  ios: {
    contentInset: 'never',
    backgroundColor: '#00c8a0',
    preferredContentMode: 'mobile',
    scrollEnabled: false,
    limitsNavigationsToAppBoundDomains: false,
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
