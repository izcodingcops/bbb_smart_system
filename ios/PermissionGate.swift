//
//  PermissionGate.swift
//  bbb_smart_system
//
//  Created by Irtaza Fiaz on 17/06/2026.
//

import Foundation
import CoreLocation
import CoreMotion

final class PermissionGate {

  private let alert = PermissionAlertPresenter()
  // Used only to trigger the motion-permission system prompt when status is
  // notDetermined. CMMotionActivityManager has no synchronous request API —
  // the prompt only fires on the first call to queryActivityStarting /
  // startActivityUpdates. Holding it as a property avoids the manager being
  // deallocated before the system dialog appears.
  private let motionActivityManager = CMMotionActivityManager()
  private var motionPromptRequested = false
  
  /// Order of checks: device-wide Location Services → per-app location auth
  /// → precise location → motion auth. First failure wins. Returns `true`
  /// only when every check passes.
  func canStartTracking(locationManager: CLLocationManager?) -> Bool {
    // --- Device-wide Location Services ---
    // Toggling the master switch in Settings → Location Services does NOT
    // change the app's authorizationStatus (it stays at whatever the user
    // granted), so we have to ask the device separately. Done off the main
    // thread to avoid the iOS 14+ "called on main thread" warning.
    var servicesEnabled = true
    let group = DispatchGroup()
    group.enter()
    DispatchQueue.global(qos: .userInitiated).async {
      servicesEnabled = CLLocationManager.locationServicesEnabled()
      group.leave()
    }
    group.wait()
    if !servicesEnabled {
      GPSLogger.info("BLOCK_LOCATION", note: "device-wide Location Services is OFF")
      alert.show(.locationDenied)
      return false
    }

    // --- Location auth ---
    let locStatus: CLAuthorizationStatus = {
      if #available(iOS 14, *), let lm = locationManager {
        return lm.authorizationStatus
      }
      return CLLocationManager.authorizationStatus()
    }()
    
    switch locStatus {
      case .notDetermined:
        // Trigger system prompt. didChangeAuthorization will call back and
        // re-run this gate when the user decides.
        GPSLogger.info("PERM_REQUEST", note: "location notDetermined — prompting")
        locationManager?.requestAlwaysAuthorization()
        return false
      case .denied, .restricted:
        GPSLogger.info("BLOCK_LOCATION", note: "location auth denied/restricted")
        alert.show(.locationDenied)
        return false
      case .authorizedAlways, .authorizedWhenInUse:
        break
      @unknown default:
        return false
    }
    
    // --- Precise location (iOS 14+) ---
    if #available(iOS 14, *),
       let lm = locationManager,
       lm.accuracyAuthorization == .reducedAccuracy {
      GPSLogger.info("BLOCK_PRECISE", note: "precise location is OFF")
      alert.show(.preciseLocationOff)
      return false
    }
    
    // --- Motion auth ---
    // We do NOT gate this on isActivityAvailable() — that returns false when
    // the device-wide Motion & Fitness master toggle is OFF, which would let
    // the app slip past the gate even though motion is unusable. We always
    // read the per-app auth status; if it's authorized but isActivityAvailable
    // is false, the master toggle is off and we must block.
    let motionStatus = CMMotionActivityManager.authorizationStatus()
    // The "authorized but unavailable → master toggle off" detection is only
    // meaningful on real hardware. Simulators have no motion coprocessor, so
    // isActivityAvailable() always returns false and this check would
    // wrongly block every simulator run.
    #if !targetEnvironment(simulator)
    if motionStatus == .authorized && !CMMotionActivityManager.isActivityAvailable() {
      GPSLogger.info("BLOCK_MOTION", note: "device-wide Motion & Fitness is OFF")
      alert.show(.motionDenied)
      return false
    }
    #endif
    switch motionStatus {
      case .denied, .restricted:
        GPSLogger.info("BLOCK_MOTION", note: "motion auth denied/restricted")
        alert.show(.motionDenied)
        return false
      case .notDetermined:
        // No synchronous request API. Trigger the system prompt by issuing
        // a one-shot activity query — the dialog appears the first time
        // any activity API is called. didChangeAuthorization won't fire
        // for motion, so we block until the next applicationDidBecomeActive
        // re-runs the gate and re-reads the status.
        if !motionPromptRequested {
          motionPromptRequested = true
          GPSLogger.info("PERM_REQUEST", note: "motion notDetermined — issuing query to trigger prompt")
          let now = Date()
          motionActivityManager.queryActivityStarting(
            from: now.addingTimeInterval(-1),
            to: now,
            to: .main
          ) { _, _ in /* result ignored — we only needed to surface the prompt */ }
        }
        return false
      case .authorized:
        break
      @unknown default:
        break
    }
    
    alert.dismiss()
    return true
  }
}
