import Expo
import React
import ReactAppDependencyProvider
import UserNotifications
import PushKit

@UIApplicationMain
public class AppDelegate: ExpoAppDelegate, UNUserNotificationCenterDelegate, MessagingDelegate, PKPushRegistryDelegate {

  var window: UIWindow?
  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  // VoIP registry
  private var voipRegistry: PKPushRegistry?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {

    // ── Firebase ──────────────────────────────────────────────────
    FirebaseApp.configure()
    Messaging.messaging().delegate = self

    // ── Notificaciones push ───────────────────────────────────────
    UNUserNotificationCenter.current().delegate = self
    UNUserNotificationCenter.current().requestAuthorization(
      options: [.alert, .badge, .sound, .criticalAlert]
    ) { _, _ in }
    application.registerForRemoteNotifications()

    // ── VoIP PushKit ──────────────────────────────────────────────
    voipRegistry = PKPushRegistry(queue: .main)
    voipRegistry?.delegate = self
    voipRegistry?.desiredPushTypes = [.voIP]

    // ── React Native ──────────────────────────────────────────────
    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()
    reactNativeDelegate = delegate
    reactNativeFactory = factory
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

  // ── APNs token → FCM ────────────────────────────────────────────
  public override func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
  ) {
    Messaging.messaging().apnsToken = deviceToken
    super.application(application, didRegisterForRemoteNotificationsWithDeviceToken: deviceToken)
  }

  public override func application(
    _ application: UIApplication,
    didFailToRegisterForRemoteNotificationsWithError error: Error
  ) {
    print("[EGChat] APNs registration failed: \(error)")
  }

  // ── FCM token refresh ───────────────────────────────────────────
  public func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
    guard let token = fcmToken else { return }
    print("[EGChat] FCM token: \(token)")
    // Enviar al servidor via JS — expo-notifications lo gestiona automáticamente
    NotificationCenter.default.post(
      name: Notification.Name("FCMTokenRefreshed"),
      object: nil,
      userInfo: ["token": token]
    )
  }

  // ── Notificación recibida en primer plano ───────────────────────
  public func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    // Mostrar banner + sonido incluso con app en primer plano
    completionHandler([.banner, .sound, .badge])
  }

  // ── Usuario pulsó la notificación ──────────────────────────────
  public func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
  ) {
    super.userNotificationCenter(center, didReceive: response, withCompletionHandler: completionHandler)
  }

  // ── VoIP PushKit: token registrado ─────────────────────────────
  public func pushRegistry(
    _ registry: PKPushRegistry,
    didUpdate pushCredentials: PKPushCredentials,
    for type: PKPushType
  ) {
    let token = pushCredentials.token.map { String(format: "%02x", $0) }.joined()
    print("[EGChat] VoIP token: \(token)")
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

  // ── Linking ─────────────────────────────────────────────────────
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
