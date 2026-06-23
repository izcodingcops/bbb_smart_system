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

  private let motionActivityManager = CMMotionActivityManager()
  private var motionPromptRequested = false
  

  func canStartTracking(locationManager: CLLocationManager?) -> Bool {
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

    let locStatus: CLAuthorizationStatus = {
      if #available(iOS 14, *), let lm = locationManager {
        return lm.authorizationStatus
      }
      return CLLocationManager.authorizationStatus()
    }()
    
    switch locStatus {
      case .notDetermined:
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
    
    if #available(iOS 14, *),
       let lm = locationManager,
       lm.accuracyAuthorization == .reducedAccuracy {
      GPSLogger.info("BLOCK_PRECISE", note: "precise location is OFF")
      alert.show(.preciseLocationOff)
      return false
    }
    
    let motionStatus = CMMotionActivityManager.authorizationStatus()
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
        if !motionPromptRequested {
          motionPromptRequested = true
          GPSLogger.info("PERM_REQUEST", note: "motion notDetermined — issuing query to trigger prompt")
          let now = Date()
          motionActivityManager.queryActivityStarting(
            from: now.addingTimeInterval(-1),
            to: now,
            to: .main
          ) { _, _ in }
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
