/**
 * Config plugin: configura App Group y URL scheme para la Share Extension de EGCHAT.
 *
 * Lo que hace este plugin:
 *  1. Añade el App Group "group.com.egchat.app" a los entitlements del target principal
 *  2. Añade el URL scheme "egchat-share" al Info.plist (para que la Share Extension
 *     pueda abrir la app principal después de guardar el contenido compartido)
 *  3. Modifica el AppDelegate para manejar el URL "egchat-share://open" y notificar
 *     al módulo EGChatShareModule que hay contenido pendiente
 *
 * IMPORTANTE: Este plugin NO crea el target EGChatShare en Xcode.
 * Eso requiere pasos manuales — ver ios/EGChatShare/ShareViewController.swift.
 */
const { withEntitlementsPlist, withInfoPlist, withAppDelegate } = require('@expo/config-plugins');

// ── 1. Entitlements: añadir App Group ────────────────────────────────────────
const withAppGroup = (config) => {
  return withEntitlementsPlist(config, (mod) => {
    const groups = mod.modResults['com.apple.security.application-groups'] || [];
    if (!groups.includes('group.com.jallzstores.egchat')) {
      groups.push('group.com.jallzstores.egchat');
    }
    mod.modResults['com.apple.security.application-groups'] = groups;
    return mod;
  });
};

// ── 2. Info.plist: añadir URL scheme "egchat-share" ─────────────────────────
const withShareURLScheme = (config) => {
  return withInfoPlist(config, (mod) => {
    const urlTypes = mod.modResults.CFBundleURLTypes || [];
    const alreadyAdded = urlTypes.some((t) =>
      (t.CFBundleURLSchemes || []).includes('egchat-share')
    );
    if (!alreadyAdded) {
      urlTypes.push({
        CFBundleURLSchemes: ['egchat-share'],
        CFBundleURLName: 'com.jallzstores.egchat.share',
      });
    }
    mod.modResults.CFBundleURLTypes = urlTypes;
    return mod;
  });
};

// ── 3. AppDelegate: manejar egchat-share://open ──────────────────────────────
const withShareAppDelegate = (config) => {
  return withAppDelegate(config, (mod) => {
    let src = mod.modResults.contents;

    // Inyectar openURL handler si no existe
    if (!src.includes('egchat-share')) {
      // Insertar después de la llamada de super.application en didFinishLaunching
      src = src.replace(
        /return super\.application\(application, didFinishLaunchingWithOptions: launchOptions\)/,
        `return super.application(application, didFinishLaunchingWithOptions: launchOptions)`
      );

      // Añadir el método openURL al AppDelegate
      const openURLMethod = `
  // EGChat Share Extension: recibir contenido desde otras apps
  override func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
    if url.scheme == "egchat-share" {
      EGChatShareModule.handleOpenURL(url)
      return true
    }
    return super.application(app, open: url, options: options)
  }
`;
      // Insertar antes del último "}" del AppDelegate
      const lastBrace = src.lastIndexOf('}');
      if (lastBrace !== -1 && !src.includes('egchat-share')) {
        src = src.slice(0, lastBrace) + openURLMethod + '\n' + src.slice(lastBrace);
      }
    }

    mod.modResults.contents = src;
    return mod;
  });
};

module.exports = (config) => {
  config = withAppGroup(config);
  config = withShareURLScheme(config);
  config = withShareAppDelegate(config);
  return config;
};
