const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);
const useRealWebRTC = process.env.EXPO_PUBLIC_ENABLE_WEBRTC !== '0';

// ── Módulos nativos → stubs web ───────────────────────────────────
const WEB_STUBS = {
  'react-native-maps':                        './src/stubs/react-native-maps.web.js',
  'expo-secure-store':                        './src/stubs/expo-secure-store.web.js',
  'expo-notifications':                       './src/stubs/expo-notifications.web.js',
  'expo-local-authentication':                './src/stubs/expo-local-authentication.web.js',
  'expo-haptics':                             './src/stubs/expo-haptics.web.js',
  'expo-av':                                  './src/stubs/expo-av.web.js',
  'expo-camera':                              './src/stubs/expo-camera.web.js',
  'expo-task-manager':                        './src/stubs/expo-task-manager.web.js',
  'expo-speech':                              './src/stubs/expo-speech.web.js',
  'expo-image-picker':                        './src/stubs/expo-image-picker.web.js',
  'expo-clipboard':                           './src/stubs/expo-clipboard.web.js',
  'expo-location':                            './src/stubs/expo-location.web.js',
  'react-native-webrtc':                      './src/stubs/react-native-webrtc.web.js',
  'react-native-qrcode-svg':                  './src/stubs/react-native-qrcode-svg.web.js',
  'expo-sharing':                             './src/stubs/expo-sharing.web.js',
  '@react-native-community/datetimepicker':   './src/stubs/datetimepicker.web.js',
  'firebase/app':                             './src/stubs/firebase-app.web.js',
  'firebase/database':                        './src/stubs/firebase-database.web.js',
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Stub para web
  if (platform === 'web' && WEB_STUBS[moduleName]) {
    return {
      filePath: path.resolve(__dirname, WEB_STUBS[moduleName]),
      type: 'sourceFile',
    };
  }
  // Stub react-native-webrtc solo cuando se desactiva explícitamente.
  // Por defecto usamos WebRTC real en builds nativos y dev client.
  if (!useRealWebRTC && platform !== 'web' && moduleName === 'react-native-webrtc') {
    return {
      filePath: path.resolve(__dirname, './src/stubs/react-native-webrtc-stub.ts'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

// ── Optimizaciones de velocidad ───────────────────────────────────
// Excluir carpetas que no son parte del bundle nativo
const blocked = ['android', 'ios', 'dist', 'egchat-v2', 'ios-backup-20260729-155842', 'build'].map(
  dir => new RegExp(`^${path.resolve(__dirname, dir).replace(/[/\\]/g, '[/\\\\]')}`)
);
config.resolver.blockList = [...blocked, /\.git\/.*/];

module.exports = config;
