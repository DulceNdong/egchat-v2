import Expo
import React
import ReactAppDependencyProvider
import UserNotifications

@UIApplicationMain
public class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
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

    // Iniciar VoIP PushKit
    EGChatPushKitCoordinator.shared.start()

    // La categoría del aviso se busca en el registro de la app, no en el de la
    // extensión: si aquí no figura `INSendMessageIntent`, el sistema pinta el banner
    // como texto plano aunque la NSE done el intent y lo aplique al contenido.
    let replyAction = UNTextInputNotificationAction(
      identifier: "REPLY_ACTION",
      title: "Responder",
      options: [],
      textInputButtonTitle: "Enviar",
      textInputPlaceholder: "Escribe un mensaje...")
    let readAction = UNNotificationAction(
      identifier: "MARK_READ_ACTION",
      title: "Marcar como leído",
      options: [])
    UNUserNotificationCenter.current().setNotificationCategories([
      UNNotificationCategory(
        identifier: "EGCHAT_MESSAGE",
        actions: [replyAction, readAction],
        intentIdentifiers: ["INSendMessageIntent"],
        options: [.customDismissAction])
    ])

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  // Linking API — maneja deep links y egchat-share://
  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    // Share Extension URL scheme
    if url.scheme == "egchat-share" {
      NotificationCenter.default.post(name: NSNotification.Name("EGChatShareURL"), object: url)
      return true
    }
    return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options)
  }

  // Universal Links
  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    let result = RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler) || result
  }
}

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  // Extension point for config-plugins

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    bridge.bundleURL ?? bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
