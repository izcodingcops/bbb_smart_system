//
//  PreciseLocationAlertPresenter.swift
//  bbb_smart_system
//
//  Generic permission-alert overlay. Presents a single alert at a time on
//  its own UIWindow at .alert + 1 level so it sits on top of React Native
//  UI. PermissionGate uses this for location-denied, motion-denied, and
//  precise-location-OFF messages.
//
//  (File name kept for now to avoid Xcode target churn — rename to
//  PermissionAlertPresenter.swift via Xcode's rename tool when convenient.)
//

import Foundation
import UIKit

final class PermissionAlertPresenter {

  private var alertWindow: UIWindow?
  // The currently-presented kind, so identical re-shows are no-ops but
  // different kinds replace each other (e.g. location-denied → motion-denied
  // after the user fixes location in Settings).
  private var currentKind: Kind?

  enum Kind: Equatable {
    case locationDenied
    case preciseLocationOff
    case motionDenied
  }

  func show(_ kind: Kind) {
    DispatchQueue.main.async { [weak self] in
      guard let self else { return }
      if self.currentKind == kind { return }   // already showing this exact alert
      // Different alert needs to replace whatever's up.
      self.tearDown {
        self.present(kind)
      }
    }
  }

  func dismiss() {
    DispatchQueue.main.async { [weak self] in
      guard let self else { return }
      self.tearDown(then: nil)
    }
  }

  // MARK: - Presentation

  private func present(_ kind: Kind) {
    let alert = UIAlertController(
      title: "BBB Smart System",
      message: Self.message(for: kind),
      preferredStyle: .alert
    )
    alert.addAction(UIAlertAction(title: "Settings", style: .default) { [weak self] _ in
      // The alert auto-dismisses now. We must tear down our overlay UIWindow
      // and reset state BEFORE opening Settings, otherwise (a) our window
      // stays as key window and interferes with iOS's app-switch, and (b)
      // currentKind stays set so the next gate run won't re-show the alert
      // when the user returns without granting permission.
      self?.clearOverlayState()
      if let url = URL(string: UIApplication.openSettingsURLString) {
        UIApplication.shared.open(url)
      }
    })

    let win = UIWindow(frame: UIScreen.main.bounds)
    win.rootViewController = UIViewController()
    win.windowLevel = .alert + 1
    win.backgroundColor = .clear
    win.makeKeyAndVisible()
    self.alertWindow = win
    self.currentKind = kind
    win.rootViewController?.present(alert, animated: true)
  }

  /// Drops our overlay UIWindow and forgets which kind we last showed, so
  /// future `show(_:)` calls can present fresh.
  private func clearOverlayState() {
    alertWindow?.isHidden = true
    alertWindow = nil
    currentKind = nil
  }

  private func tearDown(then completion: (() -> Void)?) {
    guard let win = alertWindow else {
      currentKind = nil
      completion?()
      return
    }
    win.rootViewController?.dismiss(animated: false) { [weak self] in
      win.isHidden = true
      self?.alertWindow = nil
      self?.currentKind = nil
      completion?()
    }
  }

  // MARK: - Copy

  private static func message(for kind: Kind) -> String {
    switch kind {
    case .locationDenied:
      return "Location access is OFF. The app cannot track your shift without it. Please open Settings → Privacy → Location Services → BBB Smart System and choose \"Always\" or \"While Using the App\"."
    case .preciseLocationOff:
      return "Precise Location is turned OFF. The app cannot track your shift accurately without it. Please open Settings → Privacy → Location Services → BBB Smart System and turn ON Precise Location."
    case .motionDenied:
      return "Motion & Fitness access is OFF. The app uses it to save battery during your shift and to detect when you start moving. Please open Settings → Privacy → Motion & Fitness → BBB Smart System and turn it ON."
    }
  }
}
