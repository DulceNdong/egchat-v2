import Expo
import React
import ReactAppDependencyProvider
import PushKit

/// AppDelegate principal de EGChat.
///
/// REGLA CRÍTICA (Apple):
/// Al recibir un VoIP push (didReceiveIncomingPushWith), DEBEMOS llamar
/// CXProvider.reportNewIncomingCall() dentro del mismo callback, ANTES de
/// que completion() sea llamado. Si no lo hacemos, iOS terminará la app.
///
/// Por eso EGChatCallModule.reportIncomingCallFromPush() toma una completion
/// y reporta la llamada inmediatamente, incluso si React Native no está listo.

@UIApplicationMain
public class AppDelegate: ExpoAppDelegate, PKPushRegistryDelegate {

  var window: UIWindow?
  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?
  private var voipRegistry: PKPushRegistry?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {

    // ── VoIP PushKit — registrar ANTES de initiaizar React Native ────
    // Apple requiere que el registro ocurra lo antes posible.
    voipRegistry = PKPushRegistry(queue: .main)
    voipRegistry?.delegate = self
    voipRegistry?.desiredPushTypes = [.voIP]

    // ── React Native ──────────────────────────────────────────────
    let delegate = ReactNativeDelegate()
    let factory  = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()
    reactNativeDelegate = delegate
    reactNativeFactory  = factory
    bindReactNativeFactory(factory)

#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  // ── APNs token ───────────────────────────────────────────────────
  public override func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
  ) {
    super.application(application, didRegisterForRemoteNotificationsWithDeviceToken: deviceToken)
  }

  // ══════════════════════════════════════════════════════════════════
  // PKPushRegistryDelegate
  // ══════════════════════════════════════════════════════════════════

  // ── Token VoIP registrado ────────────────────────────────────────
  public func pushRegistry(
    _ registry: PKPushRegistry,
    didUpdate pushCredentials: PKPushCredentials,
    for type: PKPushType
  ) {
    guard type == .voIP else { return }
    let token = pushCredentials.token
      .map { String(format: "%02x", $0) }
      .joined()
    EGChatPushKitModule.emitTokenUpdated(token)
  }

  // ── VoIP push entrante ───────────────────────────────────────────
  // CRÍTICO: reportNewIncomingCall DEBE ser invocado antes de que
  // completion() sea llamado. EGChatCallModule lo hace internamente.
  public func pushRegistry(
    _ registry: PKPushRegistry,
    didReceiveIncomingPushWith payload: PKPushPayload,
    for type: PKPushType,
    completion: @escaping () -> Void
  ) {
    guard type == .voIP else { completion(); return }

    let dict = payload.dictionaryPayload as? [String: Any] ?? [:]

    // Paso 1: Reportar a CallKit INMEDIATAMENTE (obligatorio por Apple).
    // Este método llama reportNewIncomingCall DENTRO de este callback.
    EGChatCallModule.reportIncomingCallFromPush(dict) {
      // completion() se llama DESPUÉS de que CallKit haya procesado la llamada
      completion()
    }

    // Paso 2: Emitir al lado JS (para que el CallManager registre la sesión).
    // Esto puede ocurrir con React Native no inicializado — EGChatPushKitModule
    // encola el evento y lo entrega cuando haya listeners registrados.
    EGChatPushKitModule.emitIncomingCall(dict)
  }

  // ── Token VoIP inválido ──────────────────────────────────────────
  public func pushRegistry(
    _ registry: PKPushRegistry,
    didInvalidatePushTokenFor type: PKPushType
  ) {
    guard type == .voIP else { return }
    print("[AppDelegate] Token VoIP invalidado — re-registrar en próxima apertura")
  }

  // ── Linking ──────────────────────────────────────────────────────
  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return super.application(app, open: url, options: options)
      || RCTLinkingManager.application(app, open: url, options: options)
  }

  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    let result = RCTLinkingManager.application(
      application, continue: userActivity, restorationHandler: restorationHandler)
    return super.application(
      application, continue: userActivity, restorationHandler: restorationHandler) || result
  }
}

// ── React Native delegate ─────────────────────────────────────────
class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    bridge.bundleURL ?? bundleURL()
  }
  override func bundleURL() -> URL? {
#if DEBUG
    return RCTBundleURLProvider.sharedSettings()
      .jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
