import Foundation
import UIKit
import React

/**
 * EGChat — Módulo para recibir contenido compartido desde otras apps (iOS)
 *
 * Instalación (Mac/Xcode):
 * 1. Copiar al directorio ios/EGChat/
 * 2. Añadir en Xcode al target EGChat
 * 3. En Info.plist ya tiene NSPhotoLibraryUsageDescription
 * 4. En AppDelegate, reenviar el URL al módulo:
 *      EGChatShareModule.handleOpenURL(url)
 *
 * iOS usa Share Extension para esto (ver EGChatShareExtension abajo).
 * La Share Extension escribe el archivo a un App Group compartido,
 * y cuando el usuario toca "Abrir en EGChat" este módulo lo lee.
 */

@objc(EGChatShareModule)
class EGChatShareModule: RCTEventEmitter {

  private static let appGroupId = "group.com.egchat.app"
  private static let sharedKey  = "egchat_shared_content"

  // ── API para React Native ────────────────────────────────────────

  @objc func getSharedContent(_ resolve: @escaping RCTPromiseResolveBlock,
                               rejecter reject: @escaping RCTPromiseRejectBlock) {
    let defaults = UserDefaults(suiteName: Self.appGroupId)
    guard let raw = defaults?.string(forKey: Self.sharedKey),
          let data = raw.data(using: .utf8),
          let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    else {
      resolve(nil)
      return
    }
    // Limpiar después de leer
    defaults?.removeObject(forKey: Self.sharedKey)
    resolve(json)
  }

  @objc func clearSharedContent() {
    UserDefaults(suiteName: Self.appGroupId)?.removeObject(forKey: Self.sharedKey)
  }

  // Llamar desde AppDelegate cuando la app se abre desde una URL
  static func handleOpenURL(_ url: URL) {
    guard url.scheme == "egchat-share" else { return }
    let defaults = UserDefaults(suiteName: appGroupId)
    // El contenido ya fue escrito por la Share Extension
    // Solo notificamos a React Native
    NotificationCenter.default.post(name: .init("EGChatShareReceived"), object: nil)
  }

  // ── RCTEventEmitter ─────────────────────────────────────────────

  override func supportedEvents() -> [String] { ["sharedContent"] }
  override static func requiresMainQueueSetup() -> Bool { false }

  @objc override func addListener(_ eventName: String) { super.addListener(eventName) }
  @objc override func removeListeners(_ count: Double) { super.removeListeners(count) }
}
