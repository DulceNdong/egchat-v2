import Foundation
import PushKit
import React

/** PushKit vive a nivel de aplicación, no a nivel del ciclo de JavaScript. */
final class EGChatPushKitCoordinator: NSObject, PKPushRegistryDelegate {
  static let shared = EGChatPushKitCoordinator()
  private let voipTokenDefaultsKey = "egchat.voipPushToken"

  private var registry: PKPushRegistry?
  private var pendingToken: String?
  private var currentVoipToken: String?
  private var pendingCalls: [[String: Any]] = []

  func start() {
    DispatchQueue.main.async {
      if let registry = self.registry {
        // Al volver desde el arranque nativo, renovar la solicitud obliga a
        // PushKit a entregar el token cuando el proceso ya está completamente
        // activo. No basta con ignorar la segunda llamada de JavaScript.
        registry.delegate = self
        registry.desiredPushTypes = [.voIP]
        print("[EGChatPushKit] PKPushRegistry reactivado; solicitando token")
        return
      }
      print("[EGChatPushKit] Iniciando PKPushRegistry...")
      let registry = PKPushRegistry(queue: .main)
      registry.delegate = self
      registry.desiredPushTypes = [.voIP]
      self.registry = registry
      print("[EGChatPushKit] PKPushRegistry creado, esperando token...")
    }
  }

  func currentToken() -> String? {
    currentVoipToken ?? UserDefaults.standard.string(forKey: voipTokenDefaultsKey)
  }

  func attach(_ module: EGChatPushKitModule) {
    EGChatPushKitModule.eventSink = module
    flushPendingEvents()
  }

  func replayCurrentToken(to module: EGChatPushKitModule) {
    guard let token = currentToken(), !token.isEmpty else { return }
    print("[EGChatPushKit] Reenviando token VoIP al listener activo")
    module.sendEvent(withName: "voipTokenUpdated", body: ["token": token])
  }

  private func emitToken(_ token: String) {
    if let module = EGChatPushKitModule.eventSink {
      module.sendEvent(withName: "voipTokenUpdated", body: ["token": token])
    } else { pendingToken = token }
  }

  private func emitCall(_ call: [String: Any]) {
    if let module = EGChatPushKitModule.eventSink {
      module.sendEvent(withName: "voipPushReceived", body: call)
    } else { pendingCalls.append(call) }
  }

  private func flushPendingEvents() {
    guard let module = EGChatPushKitModule.eventSink else { return }
    if let token = pendingToken {
      module.sendEvent(withName: "voipTokenUpdated", body: ["token": token])
      pendingToken = nil
    }
    let calls = pendingCalls
    pendingCalls.removeAll()
    calls.forEach { module.sendEvent(withName: "voipPushReceived", body: $0) }
  }

  func pushRegistry(_ registry: PKPushRegistry, didUpdate pushCredentials: PKPushCredentials, for type: PKPushType) {
    guard type == .voIP else { return }
    let token = pushCredentials.token.map { String(format: "%02.2hhx", $0) }.joined()
    print("[EGChatPushKit] ✅ Token VoIP recibido: \(token.suffix(8))")
    currentVoipToken = token
    UserDefaults.standard.set(token, forKey: voipTokenDefaultsKey)
    emitToken(token)
    // Registrar el token directamente en el servidor desde Swift
    // como respaldo por si JS no está listo cuando llega el token
    registerVoIPTokenOnServer(token)
  }

  private func registerVoIPTokenOnServer(_ token: String) {
    guard let authToken = UserDefaults.standard.string(forKey: "egchat.authToken"),
          !authToken.isEmpty else {
      print("[EGChatPushKit] Sin authToken guardado, no se puede registrar token VoIP en servidor")
      return
    }
    let apiBase = "https://egchat-api-xlxj.onrender.com"
    guard let url = URL(string: "\(apiBase)/api/push/register-voip-token") else { return }
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
    let body = ["voipToken": token]
    request.httpBody = try? JSONSerialization.data(withJSONObject: body)
    URLSession.shared.dataTask(with: request) { _, response, error in
      if let error = error {
        print("[EGChatPushKit] Error registrando token en servidor: \(error.localizedDescription)")
      } else if let http = response as? HTTPURLResponse {
        print("[EGChatPushKit] Token VoIP registrado en servidor: HTTP \(http.statusCode)")
      }
    }.resume()
  }

  func pushRegistry(_ registry: PKPushRegistry, didInvalidatePushTokenFor type: PKPushType) {
    print("[EGChatPushKit] ⚠️ Token VoIP invalidado")
    currentVoipToken = nil
    UserDefaults.standard.removeObject(forKey: voipTokenDefaultsKey)
    emitToken("")
  }

  func pushRegistry(_ registry: PKPushRegistry, didReceiveIncomingPushWith payload: PKPushPayload, for type: PKPushType, completion: @escaping () -> Void) {
    guard type == .voIP else { completion(); return }
    let dictionary = payload.dictionaryPayload.reduce(into: [String: Any]()) { result, item in
      if let key = item.key as? String { result[key] = item.value }
    }
    let aps = dictionary["aps"] as? [String: Any] ?? [:]
    let callId = (dictionary["callId"] as? String) ?? (aps["callId"] as? String) ?? UUID().uuidString
    let callerName = (dictionary["callerName"] as? String) ?? (aps["callerName"] as? String) ?? "EGCHAT"
    let callerAvatar = (dictionary["callerAvatar"] as? String) ?? ""
    let callType = (dictionary["callType"] as? String) ?? (aps["callType"] as? String) ?? "audio"

    EGChatCallCoordinator.shared.reportIncomingCall(callerName: callerName, callerAvatar: callerAvatar, callId: callId, isVideo: callType == "video")
    var event: [String: Any] = ["callId": callId, "callerName": callerName, "callerAvatar": callerAvatar, "callType": callType]
    ["offer", "targetUserId", "chatId"].forEach { key in if let value = dictionary[key] { event[key] = value } }
    emitCall(event)
    completion()
  }
}

@objc(EGChatPushKitModule)
class EGChatPushKitModule: RCTEventEmitter {
  static weak var eventSink: EGChatPushKitModule?

  override init() {
    super.init()
    EGChatPushKitCoordinator.shared.attach(self)
  }

  override func startObserving() {
    EGChatPushKitCoordinator.shared.attach(self)
    // RCTEventEmitter no conserva eventos enviados antes de que JS se suscriba.
    // Reemitir el token persistido elimina esa carrera durante el arranque.
    EGChatPushKitCoordinator.shared.replayCurrentToken(to: self)
  }
  override func supportedEvents() -> [String] { ["voipTokenUpdated", "voipPushReceived"] }
  override static func requiresMainQueueSetup() -> Bool { true }

  @objc func registerVoIP() {
    print("[EGChatPushKit] registerVoIP() llamado desde JS")
    EGChatPushKitCoordinator.shared.start()
    EGChatPushKitCoordinator.shared.attach(self)
  }

  @objc func setAuthToken(_ token: String) {
    UserDefaults.standard.set(token, forKey: "egchat.authToken")
    print("[EGChatPushKit] authToken guardado en UserDefaults")
    // Si ya tenemos el token VoIP, registrarlo ahora que tenemos el authToken
    EGChatPushKitCoordinator.shared.retryServerRegistration()
  }

  @objc func getCurrentVoIPToken(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    resolve(EGChatPushKitCoordinator.shared.currentToken())
  }
}
