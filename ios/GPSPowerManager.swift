//
//  GPSPowerManager.swift
//  bbb_smart_system
//
//  Created by Irtaza Fiaz on 17/06/2026.
//

import Foundation
import CoreLocation
import CoreMotion

public final class GPSPowerManager {
  
  public private(set) var isResting: Bool = false
  public private(set) var isDriving: Bool = false
  public private(set) var lastWakeAt: Date?
  public private(set) var isDeviceMoving: Bool = false
  
  public let wakeDistance: CLLocationDistance = 50
  
  private weak var locationManager: CLLocationManager?
  private let motionManager = CMMotionActivityManager()
  private var motionStarted = false
  
  private let movingAccuracy = kCLLocationAccuracyBest
  private let movingDistanceFilter: CLLocationDistance = kCLDistanceFilterNone
  
  private let drivingAccuracy = kCLLocationAccuracyBestForNavigation
  private let drivingDistanceFilter: CLLocationDistance = kCLDistanceFilterNone
  
  private let restingAccuracy = kCLLocationAccuracyNearestTenMeters
  private let restingDistanceFilter: CLLocationDistance = 30
  
  public init(locationManager: CLLocationManager) {
    self.locationManager = locationManager
  }
  
  public func start() {
    GPSLogger.info("INFO", note: "power manager started")
    applyFullPower(reason: "tracking started")
    startMotionWake()
  }
  
  public func stop() {
    motionManager.stopActivityUpdates()
    motionStarted = false
    GPSLogger.info("INFO", note: "power manager stopped, motion monitoring off")
  }
  
  public func enterRestMode() {
    guard !isDeviceMoving else {
      GPSLogger.info("INFO", note: "rest refused — motion sensor says device is moving")
      return
    }
    guard !isResting else {
      GPSLogger.info("INFO", note: "heartbeat: still resting")
      return
    }
    guard let lm = locationManager else { return }
    isResting = true
    lm.desiredAccuracy = restingAccuracy
    lm.distanceFilter = restingDistanceFilter
    GPSLogger.info("MODE_REST", note: "accuracy=10m filter=30m — chip resting")
  }
  
  public func wake(reason: String) {
    guard isResting else { return }
    applyFullPower(reason: reason)
  }
  
  private func applyFullPower(reason: String) {
    guard let lm = locationManager else { return }
    isResting = false
    lastWakeAt = Date()
    if isDriving {
      lm.desiredAccuracy = drivingAccuracy
      lm.distanceFilter = drivingDistanceFilter
      GPSLogger.info("MODE_DRIVE", note: "accuracy=bestForNav filter=none reason=\(reason)")
    } else {
      lm.desiredAccuracy = movingAccuracy
      lm.distanceFilter = movingDistanceFilter
      GPSLogger.info("MODE_FULL", note: "accuracy=best filter=none reason=\(reason)")
    }
  }
  
  /// The phone's motion chip (step counter) tells us the instant the person
  /// starts walking/driving — so we can rest the GPS without missing
  private func startMotionWake() {
    guard !motionStarted else { return }
    guard CMMotionActivityManager.isActivityAvailable() else {
      NSLog("[GPSOPT] Motion sensor not available — will rely on 50m location fallback to wake")
      return
    }
    motionStarted = true
    motionManager.startActivityUpdates(to: .main) { [weak self] activity in
      guard let self = self, let activity = activity else { return }
      let moving = activity.walking || activity.running || activity.cycling || activity.automotive

      if moving && activity.confidence != .low {
        self.isDeviceMoving = true
        
        if activity.automotive != self.isDriving {
          self.isDriving = activity.automotive
          if !self.isResting {
            self.applyFullPower(reason: self.isDriving ? "started driving" : "stopped driving")
          }
        }
        
        if self.isResting {
          GPSLogger.info("WAKE", note: "motion sensor felt movement")
          self.wake(reason: "motion sensor")
        }
      } else if activity.stationary && activity.confidence != .low {
        self.isDeviceMoving = false
      }
    }
    GPSLogger.info("INFO", note: "motion sensor monitoring started")
  }
}
