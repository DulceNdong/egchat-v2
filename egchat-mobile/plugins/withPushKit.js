/**
 * Config plugin: añade VoIP PushKit al AppDelegate de iOS.
 * Inyecta el código de PKPushRegistry en el AppDelegate generado por Expo.
 */
const { withAppDelegate, withInfoPlist } = require('@expo/config-plugins');

// ── 2. Info.plist: background modes ─────────────────────────────────────────
const withPushKitBackgroundModes = (config) => {
  return withInfoPlist(config, (mod) => {
    const modes = mod.modResults.UIBackgroundModes || [];
    if (!modes.includes('voip')) modes.push('voip');
    if (!modes.includes('remote-notification')) modes.push('remote-notification');
    mod.modResults.UIBackgroundModes = modes;
    return mod;
  });
};

// ── 3. AppDelegate: iniciar el coordinador nativo al arrancar ───────────────
const withPushKitAppDelegate = (config) => {
  return withAppDelegate(config, (mod) => {
    let src = mod.modResults.contents;

    if (!src.includes('EGChatPushKitCoordinator.shared.start()')) {
      src = src.replace(
        /return super\.application\(application, didFinishLaunchingWithOptions: launchOptions\)/,
        `EGChatPushKitCoordinator.shared.start()
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)`
      );
    }

    mod.modResults.contents = src;
    return mod;
  });
};

module.exports = (config) => {
  config = withPushKitBackgroundModes(config);
  config = withPushKitAppDelegate(config);
  return config;
};
