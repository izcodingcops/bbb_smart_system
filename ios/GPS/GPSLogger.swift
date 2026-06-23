//
//  GPSLogger.swift
//  bbb_smart_system
//
//  Created by Irtaza Fiaz on 17/06/2026.
//

import Foundation

public final class GPSLogger {
  
  private static let queue = DispatchQueue(label: "com.bbb.gpslogger", qos: .utility)
  
  private static let maxBytes: UInt64 = 5 * 1024 * 1024
  private static let header = "time,event,lat,lon,accuracy,speed,mode,note\n"
  
  private static let fileURL: URL = {
    FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
      .appendingPathComponent("gps_track_log.csv")
  }()

  /// Path to the current CSV log, or nil if nothing has been written yet.
  /// Exposed so the app can share/export the log (see LocationBridge).
  public static var currentLogURL: URL? {
    FileManager.default.fileExists(atPath: fileURL.path) ? fileURL : nil
  }
  
  private static let timeFormat: DateFormatter = {
    let f = DateFormatter()
    f.dateFormat = "yyyy-MM-dd HH:mm:ss.SSS"
    return f
  }()
  
  public static func log(
    _ event: String,
    lat: Double, lon: Double,
    accuracy: Double, speed: Double,
    mode: String, note: String) {
      
    Log.gps.debug("\(event) acc=\(Int(accuracy))m speed=\(String(format: "%.1f", speed)) mode=\(mode) \(note)")
    let line = "\(timeFormat.string(from: Date())),\(event),\(lat),\(lon),\(accuracy),\(speed),\(mode),\(note)\n"
    queue.async { append(line) }
      
  }
  
  public static func info(_ event: String, note: String) {
    log(event, lat: 0, lon: 0, accuracy: 0, speed: 0, mode: "", note: note)
  }
  
  private static func append(_ line: String) {
    let fm = FileManager.default
    
    if let attrs = try? fm.attributesOfItem(atPath: fileURL.path),
       let size = attrs[.size] as? UInt64, size > maxBytes {
      
      let old = fileURL.deletingPathExtension().appendingPathExtension("old.csv")
      try? fm.removeItem(at: old)
      try? fm.moveItem(at: fileURL, to: old)
    }
    
    if !fm.fileExists(atPath: fileURL.path) {
      try? header.write(to: fileURL, atomically: true, encoding: .utf8)
    }
    
    guard let handle = try? FileHandle(forWritingTo: fileURL),
          let data = line.data(using: .utf8) else { return }
    
    _ = try? handle.seekToEnd()
    handle.write(data)
    try? handle.close()
  }
  
}
