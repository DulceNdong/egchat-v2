/**
 * Config Plugin: CallKit para EGChat
 *
 * Añade la configuración necesaria para CallKit en iOS:
 * - Entitlement com.apple.developer.CallKit (automático con VoIP)
 * - Background mode voip
 * - UIBackgroundModes: voip, audio
 * - NSMicrophoneUsageDescription
 * - NSCameraUsageDescription (para videollamadas)
 */
const { withInfoPlist, withEntitlementsPlist } = require('@expo/config-plugins');

const withCallKit = (config) => {
  // 1. Añadir background modes necesarios para CallKit + VoIP
  config = withInfoPlist(config, (mod) => {
    const plist = mod.modResults;

    // UIBackgroundModes
    if (!plist.UIBackgroundModes) plist.UIBackgroundModes = [];
    const modes = ['voip', 'audio', 'fetch', 'remote-notification'];
    modes.forEach((mode) => {
      if (!plist.UIBackgroundModes.includes(mode)) {
        plist.UIBackgroundModes.push(mode);
      }
    });

    // Permisos de micrófono y cámara (necesarios para CallKit)
    if (!plist.NSMicrophoneUsageDescription) {
      plist.NSMicrophoneUsageDescription =
        'EGChat necesita el micrófono para realizar llamadas de voz y video.';
    }
    if (!plist.NSCameraUsageDescription) {
      plist.NSCameraUsageDescription =
        'EGChat necesita la cámara para las videollamadas.';
    }

    return mod;
  });

  // 2. Añadir entitlements necesarios para VoIP pushes
  config = withEntitlementsPlist(config, (mod) => {
    const ents = mod.modResults;

    // App Groups (necesario para compartir datos entre app y extensiones)
    if (!ents['com.apple.security.application-groups']) {
      ents['com.apple.security.application-groups'] = [
        `group.${mod.ios?.bundleIdentifier ?? 'com.jallzstores.egchat'}`,
      ];
    }

    // VoIP pushes — este entitlement no se puede añadir manualmente
    // pero los UIBackgroundModes voip lo activan automáticamente
    // cuando Apple aprueba el app en App Store Connect.

    return mod;
  });

  return config;
};

module.exports = withCallKit;
