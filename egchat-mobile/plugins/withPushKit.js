/**
 * Config plugin: añade VoIP PushKit al AppDelegate de iOS.
 * Inyecta el código de PKPushRegistry en el AppDelegate generado por Expo.
 */
const { withAppDelegate, withInfoPlist, withEntitlementsPlist } = require('@expo/config-plugins');

// ── 1. Entitlements: PushKit VoIP ────────────────────────────────────────────
const withPushKitEntitlements = (config) => {
  return withEntitlementsPlist(config, (mod) => {
    mod.modResults['com.apple.developer.pushkit.unrestricted-development'] = true;
    return mod;
  });
};

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

// ── 3. AppDelegate: importar PushKit y registrar PKPushRegistry ──────────────
const withPushKitAppDelegate = (config) => {
  return withAppDelegate(config, (mod) => {
    let src = mod.modResults.contents;

    // a) Añadir import PushKit si no está
    if (!src.includes('import PushKit')) {
      src = src.replace(
        /^import Expo/m,
        'import Expo\nimport PushKit'
      );
    }

    // b) Añadir PKPushRegistryDelegate al AppDelegate si no está
    if (!src.includes('PKPushRegistryDelegate')) {
      src = src.replace(
        /public class AppDelegate: ExpoAppDelegate\b/,
        'public class AppDelegate: ExpoAppDelegate, PKPushRegistryDelegate'
      );
    }

    // c) Añadir voipRegistry property si no está
    if (!src.includes('voipRegistry')) {
      src = src.replace(
        /var window: UIWindow\?/,
        'var window: UIWindow?\n  private var voipRegistry: PKPushRegistry?'
      );
    }

    // d) Registrar PKPushRegistry en didFinishLaunching si no está
    if (!src.includes('desiredPushTypes = [.voIP]')) {
      src = src.replace(
        /return super\.application\(application, didFinishLaunchingWithOptions: launchOptions\)/,
        `voipRegistry = PKPushRegistry(queue: .main)
    voipRegistry?.delegate = self
    voipRegistry?.desiredPushTypes = [.voIP]
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)`
      );
    }

    // e) Añadir métodos de delegate al final de la clase (antes del último })
    if (!src.includes('pushRegistry(_ registry: PKPushRegistry, didUpdate')) {
      const pushKitMethods = `
  // ── VoIP PushKit: token registrado ──────────────────────────────
  public func pushRegistry(
    _ registry: PKPushRegistry,
    didUpdate pushCredentials: PKPushCredentials,
    for type: PKPushType
  ) {
    let token = pushCredentials.token.map { String(format: "%02x", $0) }.joined()
    EGChatPushKitModule.emitTokenUpdated(token)
  }

  // ── VoIP PushKit: push entrante ─────────────────────────────────
  public func pushRegistry(
    _ registry: PKPushRegistry,
    didReceiveIncomingPushWith payload: PKPushPayload,
    for type: PKPushType,
    completion: @escaping () -> Void
  ) {
    let dict = payload.dictionaryPayload as? [String: Any] ?? [:]
    EGChatPushKitModule.emitIncomingCall(dict)
    completion()
  }
`;
      // Insertar antes del cierre de la clase AppDelegate
      src = src.replace(
        /^}\s*\nclass ReactNativeDelegate/m,
        `${pushKitMethods}}\n\nclass ReactNativeDelegate`
      );
    }

    mod.modResults.contents = src;
    return mod;
  });
};

module.exports = (config) => {
  config = withPushKitEntitlements(config);
  config = withPushKitBackgroundModes(config);
  config = withPushKitAppDelegate(config);
  return config;
};
