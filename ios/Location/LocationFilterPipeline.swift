//
//  LocationFilterPipeline.swift
//  bbb_smart_system
//
//  Created by Irtaza Fiaz on 17/06/2026.
//

import Foundation
import CoreLocation

enum FilterDecision {
  case pass
  case reject(event: String, note: String)
}

enum SaveBucket {
  case standing
  case walk
  case drive
  case none
  
  var reason: String {
    switch self {
      case .standing: return "standing position"
      case .walk:     return "walk"
      case .drive:    return "drive"
      case .none:     return ""
    }
  }
}

enum LocationFilterPipeline {
  
  // MARK: - Age gate
  
  static func ageDecision(for location: CLLocation, maxAge: TimeInterval = 20) -> FilterDecision {
    let age = -location.timestamp.timeIntervalSinceNow
    if age > maxAge {
      return .reject(event: "REJECT_AGE", note: "age=\(Int(age))s")
    }
    return .pass
  }
  
  // MARK: - Accuracy gate
  
  /// Speed-aware accuracy gate with anti-phantom-drive (motion cross-check)
  /// and a 10s wake-recovery grace window.
  /// - 20m baseline (standing/walking)
  /// - 50m if motion sensor confirms automotive AND GPS speed >= 2 m/s
  /// - min 100m for ~10s after the chip wakes from REST
  static func accuracyDecision(for location: CLLocation,
                               power: GPSPowerManager?) -> FilterDecision {
    let realDrive = (location.speed >= 2.0) && (power?.isDriving == true)
    var gate: Double = realDrive ? 50.0 : 20.0
    if let wakeAt = power?.lastWakeAt, Date().timeIntervalSince(wakeAt) < 10.0 {
      gate = max(gate, 100.0)
    }
    if location.horizontalAccuracy > gate {
      return .reject(event: "REJECT_ACC", note: "gate=\(Int(gate))m")
    }
    return .pass
  }
  
  // MARK: - Jump gate
  
  static func jumpDecision(distance: CLLocationDistance,
                           seconds: TimeInterval) -> FilterDecision {
    if distance > 100 && seconds < 5 {
      return .reject(event: "REJECT_JUMP", note: "dist=\(Int(distance))m dt=\(Int(seconds))s")
    }
    return .pass
  }
  
  // MARK: - Save bucket
  
  /// Walk/drive/standing cadence classifier. Returns `.none` if the fix
  /// doesn't yet warrant a save (worker is between cadence ticks).
  /// Negative-speed correction (CL sometimes returns speed = -1) happens
  /// here so callers don't have to remember it.
  static func saveBucket(speed: Double,
                         distance: CLLocationDistance,
                         seconds: TimeInterval) -> SaveBucket {
    var s = speed
    if s < 0 && seconds > 0 { s = distance / seconds }
    
    if s <= 0.5 && distance > 0 && distance < 5 && seconds >= 20 {
      return .standing
    }
    if s > 0.5 && s <= 2.0 && seconds >= 3 {
      return .walk
    }
    if s >= 2.0 && seconds >= 1 {
      return .drive
    }
    // Safety net: never drop a genuine displacement just because it didn't match
    // a cadence bucket (e.g. slow drift where speed <= 0.5 but the worker moved
    // several metres). Runs after the jump + accuracy gates, so it can't admit a
    // bad fix — it only rescues a good one the cadence rules would have skipped.
    if distance >= 15 {
      return s >= 2.0 ? .drive : .walk
    }
    return .none
  }
}
