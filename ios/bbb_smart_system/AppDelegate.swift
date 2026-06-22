import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "bbb_smart_system",
      in: window,
      launchOptions: launchOptions
    )

    // Block the app behind the permission gate regardless of login state.
    // verifyPermissions() shows the persistent Settings-only alert until
    // location + motion are granted, then auto-dismisses.
    LocationManager.shared.verifyPermissions()
    if UserDefault.isUserLoggedIn {
      LocationManager.shared.startUpdateLocation()
    }

    return true
  }

  func applicationDidBecomeActive(_ application: UIApplication) {
    // Re-check on every foreground in case the user just returned from
    // Settings — if they granted permission the alert dismisses, if not it
    // re-shows.
    LocationManager.shared.verifyPermissions()
    if UserDefault.isUserLoggedIn {
      LocationManager.shared.startUpdateLocation()
    }
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
    #if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
    #else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }
}
