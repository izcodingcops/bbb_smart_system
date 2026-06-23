import Foundation
import React
import UIKit

/// React Native bridge module for iOS location tracking.
/// Methods are exposed to JS via the `RCT_EXTERN_MODULE`/`RCT_EXTERN_METHOD`

@objc(LocationBridge)
final class LocationBridge: RCTEventEmitter {
  
  private var hasListeners = false
  
  // MARK: - RCTEventEmitter
  
  override func supportedEvents() -> [String]! {
    return ["onUploadProgress", "onUploadComplete"]
  }
  
  override func startObserving() { hasListeners = true }
  override func stopObserving()  { hasListeners = false }
  
  override static func requiresMainQueueSetup() -> Bool { true }
  
  override static func moduleName() -> String! { "LocationBridge" }
  
  // MARK: - Exported methods
  
  @objc func saveUserDetailsAndStartLocationUpdates(_ data: NSDictionary) {
    func save(_ key: DefaultsKey, from dictKey: String) {
      if let value = data[dictKey] as? String { DefaultsStore.set(value, for: key) }
    }
    save(.sessionId, from: "sessionId")
    save(.deviceId, from: "deviceId")
    save(.deviceType, from: "deviceType")
    save(.deviceName, from: "deviceName")
    save(.shiftId, from: "shiftId")
    save(.horizontalAccuracy, from: "horizontal_accuracy")
    save(.userId, from: "user_id")
    save(.cubeUrl, from: "cube_url")
    save(.timeZone, from: "time_zone")
    
    DispatchQueue.main.async {
      LocationManager.shared.startUpdateLocation()
    }
  }
  
  @objc func clearUserDetails() {
    DefaultsStore.remove(.sessionId)
    DefaultsStore.remove(.deviceId)
    DefaultsStore.remove(.deviceType)
    DefaultsStore.remove(.deviceName)
    DefaultsStore.remove(.shiftId)
    DefaultsStore.remove(.horizontalAccuracy)
    DefaultsStore.remove(.userId)
    DefaultsStore.remove(.cubeUrl)
    DefaultsStore.remove(.timeZone)
    DispatchQueue.main.async {
      LocationManager.shared.deleteAllObjects()
      LocationManager.shared.stopLocationUpdates()
    }
  }
  
  @objc func endUserSession(_ resolve: @escaping RCTPromiseResolveBlock,
                            rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async { [weak self] in
      guard let self else { return }
      let mgr = LocationManager.shared
      mgr.stopLocationUpdates()
      let total = mgr.locationCount()
      self.processEndSession(mgr: mgr, total: total, uploaded: 0, resolve: resolve, reject: reject)
    }
  }
  
  private func processEndSession(mgr: LocationManager, total: Int, uploaded: Int,
                                 resolve: @escaping RCTPromiseResolveBlock,
                                 reject: @escaping RCTPromiseRejectBlock) {
    var mutableUploaded = uploaded
    let batch = mgr.savedLocationsBatch()
    
    if batch.isEmpty {
      if hasListeners { sendEvent(withName: "onUploadComplete", body: ["status": "completed"]) }
      resolve(true)
      return
    }
    
    mgr.uploadBatch(batch) { [weak self] success in
      guard let self else { return }
      if success {
        mutableUploaded += batch.count
        let progress = total > 0 ? Float(mutableUploaded) / Float(total) * 100 : 100
        if self.hasListeners { self.sendEvent(withName: "onUploadProgress", body: ["progress": progress]) }
        DispatchQueue.main.async {
          self.processEndSession(mgr: mgr, total: total, uploaded: mutableUploaded, resolve: resolve, reject: reject)
        }
      } else {
        if self.hasListeners { self.sendEvent(withName: "onUploadComplete", body: ["status": "Retry"]) }
        reject("UPLOAD_FAILED", "Failed to upload location data", nil)
      }
    }
  }
  
  @objc func syncLocationData() {
    DispatchQueue.main.async { [weak self] in
      guard let self else { return }
      let mgr = LocationManager.shared
      mgr.stopLocationUpdates()
      let total = mgr.locationCount()
      self.processSyncUpload(mgr: mgr, total: total, uploaded: 0)
    }
  }
  
  private func processSyncUpload(mgr: LocationManager, total: Int, uploaded: Int) {
    var mutableUploaded = uploaded
    let batch = mgr.savedLocationsBatch()
    
    if batch.isEmpty {
      if hasListeners { sendEvent(withName: "onUploadComplete", body: ["status": "completed"]) }
      mgr.startUpdateLocation()
      return
    }
    
    mgr.uploadBatch(batch) { [weak self] success in
      guard let self else { return }
      if success {
        mutableUploaded += batch.count
        let progress = total > 0 ? Float(mutableUploaded) / Float(total) * 100 : 100
        if self.hasListeners { self.sendEvent(withName: "onUploadProgress", body: ["progress": progress]) }
        DispatchQueue.main.async {
          self.processSyncUpload(mgr: mgr, total: total, uploaded: mutableUploaded)
        }
      } else {
        if self.hasListeners { self.sendEvent(withName: "onUploadComplete", body: ["status": "Retry"]) }
        mgr.startUpdateLocation()
      }
    }
  }
  
  @objc func getCurrentLocation(_ resolve: @escaping RCTPromiseResolveBlock,
                                rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      guard let loc = LocationManager.shared.latestLocation() else {
        reject("no_location", "No location fix available yet.", nil)
        return
      }
      resolve([
        "latitude": loc.coordinate.latitude,
        "longitude": loc.coordinate.longitude,
        "accuracy": loc.horizontalAccuracy,
        "altitude": loc.altitude,
        "speed": max(loc.speed, 0),
        "heading": max(loc.course, 0),
        "timestamp": loc.timestamp.timeIntervalSince1970 * 1000,
      ])
    }
  }

  @objc func checkForLogOut(_ callback: @escaping RCTResponseSenderBlock) {
    DispatchQueue.main.async {
      let count = LocationManager.shared.locationCount()
      callback([count > 0 ? "false" : "true"])
    }
  }
  
  @objc func uploadOfflineLocationData(_ resolve: @escaping RCTPromiseResolveBlock,
                                       rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      let data = LocationManager.shared.allSavedLocations()
      resolve(data)
    }
  }

  /// Presents a share sheet for the GPS CSV log so it can be AirDropped/emailed
  /// off the device (intended for a debug screen). Rejects if no log exists yet.
  @objc func shareLogFile(_ resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      guard let url = GPSLogger.currentLogURL else {
        reject("no_log", "No GPS log file has been written yet.", nil)
        return
      }
      guard let presenter = Self.topViewController() else {
        reject("no_presenter", "Could not find a view controller to present from.", nil)
        return
      }
      let activityVC = UIActivityViewController(activityItems: [url], applicationActivities: nil)
      // iPad requires a source for the popover or it crashes.
      if let pop = activityVC.popoverPresentationController {
        pop.sourceView = presenter.view
        pop.sourceRect = CGRect(x: presenter.view.bounds.midX,
                                y: presenter.view.bounds.midY,
                                width: 0, height: 0)
        pop.permittedArrowDirections = []
      }
      presenter.present(activityVC, animated: true) { resolve(true) }
    }
  }

  /// Walks from the key window's root to the top-most presented controller.
  private static func topViewController() -> UIViewController? {
    let keyWindow = UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap { $0.windows }
      .first { $0.isKeyWindow }
    var top = keyWindow?.rootViewController
    while let presented = top?.presentedViewController { top = presented }
    return top
  }
}
