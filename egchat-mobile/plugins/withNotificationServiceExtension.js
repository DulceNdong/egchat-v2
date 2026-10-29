/**
 * Config Plugin: Notification Service Extension para EGChat
 *
 * Añade un NSE al proyecto iOS para mostrar fotos de perfil
 * en los banners de notificación (senderAvatar / callerAvatar).
 *
 * Compatible con Expo SDK 50+ / EAS Build.
 */
const { withXcodeProject, withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const EXTENSION_NAME = 'EGChatNotificationService';

// ── Swift de la extensión ─────────────────────────────────────────────────
const SWIFT_SOURCE = `import UserNotifications

class NotificationService: UNNotificationServiceExtension {
    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttemptContent: UNMutableNotificationContent?

    override func didReceive(
        _ request: UNNotificationRequest,
        withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
    ) {
        self.contentHandler = contentHandler
        bestAttemptContent = request.content.mutableCopy() as? UNMutableNotificationContent

        guard let best = bestAttemptContent else {
            contentHandler(request.content); return
        }

        let info = request.content.userInfo
        let rawUrl = info["senderAvatar"] as? String
            ?? info["callerAvatar"] as? String
            ?? info["imageUrl"]     as? String
            ?? info["icon"]         as? String
            ?? ""

        guard !rawUrl.isEmpty, let url = URL(string: rawUrl) else {
            contentHandler(best); return
        }

        URLSession.shared.downloadTask(with: url) { tmpURL, response, _ in
            defer { contentHandler(best) }
            guard let tmp = tmpURL else { return }
            let ext: String = {
                if let mime = response?.mimeType {
                    switch mime {
                    case "image/jpeg", "image/jpg": return ".jpg"
                    case "image/png":               return ".png"
                    case "image/gif":               return ".gif"
                    case "image/webp":              return ".webp"
                    default: break
                    }
                }
                let e = url.pathExtension.lowercased()
                return e.isEmpty ? ".jpg" : "." + e
            }()
            let dest = tmp.deletingLastPathComponent().appendingPathComponent(tmp.lastPathComponent + ext)
            try? FileManager.default.moveItem(at: tmp, to: dest)
            if let att = try? UNNotificationAttachment(identifier: "avatar", url: dest, options: nil) {
                best.attachments = [att]
            }
        }.resume()
    }

    override func serviceExtensionTimeWillExpire() {
        if let h = contentHandler, let b = bestAttemptContent { h(b) }
    }
}
`;

// ── Info.plist de la extensión ────────────────────────────────────────────
const INFO_PLIST = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key><string>$(DEVELOPMENT_LANGUAGE)</string>
    <key>CFBundleDisplayName</key><string>EGChatNotificationService</string>
    <key>CFBundleExecutable</key><string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key><string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
    <key>CFBundleInfoDictionaryVersion</key><string>6.0</string>
    <key>CFBundleName</key><string>$(PRODUCT_NAME)</string>
    <key>CFBundlePackageType</key><string>XPC!</string>
    <key>CFBundleShortVersionString</key><string>1.0</string>
    <key>CFBundleVersion</key><string>1</string>
    <key>NSExtension</key>
    <dict>
        <key>NSExtensionPointIdentifier</key>
        <string>com.apple.usernotifications.service</string>
        <key>NSExtensionPrincipalClass</key>
        <string>$(PRODUCT_MODULE_NAME).NotificationService</string>
    </dict>
</dict>
</plist>
`;

// ── Entitlements de la extensión (App Group compartido) ──────────────────
const ENTITLEMENTS = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict/>
</plist>
`;

const withNotificationServiceExtension = (config) => {
  // Paso 1: Crear archivos de la extensión en ios/EGChatNotificationService/
  config = withDangerousMod(config, [
    'ios',
    (mod) => {
      const extDir = path.join(mod.modRequest.platformProjectRoot, EXTENSION_NAME);
      if (!fs.existsSync(extDir)) fs.mkdirSync(extDir, { recursive: true });

      const write = (name, content) => {
        const p = path.join(extDir, name);
        if (!fs.existsSync(p)) fs.writeFileSync(p, content, 'utf8');
      };

      write('NotificationService.swift', SWIFT_SOURCE);
      write('Info.plist', INFO_PLIST);
      write('EGChatNotificationService.entitlements', ENTITLEMENTS);
      return mod;
    },
  ]);

  // Paso 2: Añadir el target al proyecto .xcodeproj
  config = withXcodeProject(config, (mod) => {
    const project = mod.modResults;
    const mainBundleId = mod.ios?.bundleIdentifier
      ?? config.ios?.bundleIdentifier
      ?? 'com.jallzstores.egchat';
    const extBundleId = `${mainBundleId}.notificationservice`;

    // Evitar duplicados
    const targets = project.pbxNativeTargetSection();
    const exists = Object.values(targets).some(
      (t) => t && typeof t === 'object' && t.name === EXTENSION_NAME
    );
    if (exists) return mod;

    // Añadir grupo en el árbol de archivos
    const extGroup = project.addPbxGroup(
      ['NotificationService.swift', 'Info.plist'],
      EXTENSION_NAME,
      EXTENSION_NAME
    );

    // Añadir el grupo al grupo raíz del proyecto
    const rootGroupKey = project.findPBXGroupKey({ name: undefined, path: undefined });
    if (rootGroupKey) {
      project.addToPbxGroup(extGroup.uuid, rootGroupKey);
    }

    // Crear build configurations para el target extensión
    const debugConfig = project.addBuildConfiguration('Debug', {
      SWIFT_VERSION: '5.0',
      PRODUCT_NAME: EXTENSION_NAME,
      PRODUCT_BUNDLE_IDENTIFIER: extBundleId,
      SWIFT_OPTIMIZATION_LEVEL: '-Onone',
      DEPLOYMENT_POSTPROCESSING: 'NO',
      COPY_PHASE_STRIP: 'NO',
    });
    const releaseConfig = project.addBuildConfiguration('Release', {
      SWIFT_VERSION: '5.0',
      PRODUCT_NAME: EXTENSION_NAME,
      PRODUCT_BUNDLE_IDENTIFIER: extBundleId,
      SWIFT_OPTIMIZATION_LEVEL: '-Owholemodule',
      DEPLOYMENT_POSTPROCESSING: 'YES',
      COPY_PHASE_STRIP: 'YES',
    });

    // Crear target nativo
    const target = project.addTarget(
      EXTENSION_NAME,
      'app_extension',
      EXTENSION_NAME,
      extBundleId
    );

    if (target) {
      // Build phases
      project.addBuildPhase(
        ['NotificationService.swift'],
        'PBXSourcesBuildPhase',
        'Sources',
        target.uuid
      );
      project.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', target.uuid);
      project.addBuildPhase(
        [],
        'PBXFrameworksBuildPhase',
        'Frameworks',
        target.uuid
      );
    }

    return mod;
  });

  return config;
};

module.exports = withNotificationServiceExtension;
