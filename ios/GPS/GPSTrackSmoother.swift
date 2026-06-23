//
//  GPSTrackSmoother.swift
//  bbb_smart_system
//
//  Created by Irtaza Fiaz on 17/06/2026.
//

import Foundation

public enum GPSTrackSmoother {
  
  // Look this many seconds on each side of every point for context.
  private static let windowSec: Double = 8.0
  
  // Gaussian time decay — neighbours this far away count ~37%.
  private static let sigmaSec: Double = 4.0
  
  // Time gap larger than this = a different segment; don't smooth across.
  private static let gapSec: Double = 60.0
  
  /// Smooth lat/lon fields in the array IN PLACE. Other fields untouched.
  /// Keys read: "latitude", "longitude", "timestamp", "horizontal_accuracy".
  /// Values are strings (matches the upload payload). Timestamp is ms since
  /// epoch (the same string we store in Core Data).
  public static func smoothInPlace(_ points: inout [[String: String]]) {
    let count = points.count
    if count < 3 { return }   // nothing useful to smooth
    
    var t = [Double](repeating: 0, count: count)
    var lat = [Double](repeating: 0, count: count)
    var lon = [Double](repeating: 0, count: count)
    var acc = [Double](repeating: 0, count: count)
    var valid = [Bool](repeating: false, count: count)
    
    for i in 0..<count {
      let d = points[i]
      guard let tsStr = d["timestamp"], let ts = Double(tsStr),
            let laStr = d["latitude"], let la = Double(laStr),
            let loStr = d["longitude"], let lo = Double(loStr) else { continue }
      let ac = Double(d["horizontal_accuracy"] ?? "") ?? 10
      if !ts.isFinite || !la.isFinite || !lo.isFinite { continue }
      // Timestamps in this app are ms since epoch — convert to seconds so
      // windowSec / gapSec are in human units.
      t[i] = ts / 1000.0
      lat[i] = la
      lon[i] = lo
      acc[i] = max(ac, 1)
      valid[i] = true
    }
    
    // Output buffer — compute first, write back after, so the smoothing
    // pass never reads its own output.
    var outLat = lat
    var outLon = lon
    
    for i in 0..<count {
      if !valid[i] { continue }
      
      var sumW = 0.0
      var sumLat = 0.0
      var sumLon = 0.0
      
      // Walk left from i, stopping at a gap.
      var j = i
      while j >= 0 && valid[j] {
        let dt = t[i] - t[j]
        if dt > windowSec { break }
        if j < i {
          let gap = t[j + 1] - t[j]
          if gap > gapSec { break }
        }
        let w = gaussian(dt) / (acc[j] * acc[j])
        sumW += w
        sumLat += lat[j] * w
        sumLon += lon[j] * w
        j -= 1
      }
      
      // Walk right from i+1, stopping at a gap.
      var k = i + 1
      while k < count && valid[k] {
        let dt = t[k] - t[i]
        if dt > windowSec { break }
        let gap = t[k] - t[k - 1]
        if gap > gapSec { break }
        let w = gaussian(dt) / (acc[k] * acc[k])
        sumW += w
        sumLat += lat[k] * w
        sumLon += lon[k] * w
        k += 1
      }
      
      if sumW > 0 {
        outLat[i] = sumLat / sumW
        outLon[i] = sumLon / sumW
      }
    }
    
    // Write smoothed coords back into the dictionaries.
    for i in 0..<count {
      if !valid[i] { continue }
      points[i]["latitude"]  = String(format: "%.7f", outLat[i])
      points[i]["longitude"] = String(format: "%.7f", outLon[i])
    }
  }
  
  private static func gaussian(_ dt: Double) -> Double {
    let x = dt / sigmaSec
    return exp(-0.5 * x * x)
  }
}
