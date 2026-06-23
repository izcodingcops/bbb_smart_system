//
//  PreciseLocationAlertPresenter.swift
//  bbb_smart_system
//
//  Created by Irtaza Fiaz on 17/06/2026.
//

import Foundation
import UIKit

final class PermissionAlertPresenter {

  private var alertWindow: UIWindow?
  private var currentKind: Kind?

  enum Kind: Equatable {
    case locationDenied
    case preciseLocationOff
    case motionDenied
  }

  func show(_ kind: Kind) {
    DispatchQueue.main.async { [weak self] in
      guard let self else { return }
      
      if self.currentKind == kind { return }
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
