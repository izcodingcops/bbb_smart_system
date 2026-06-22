import Foundation
import React
import UIKit

/// React Native bridge module for iOS location tracking.
/// Methods are exposed to JS via the `RCT_EXTERN_MODULE`/`RCT_EXTERN_METHOD`
/// shim in BBBUserDataModule.m, which also auto-registers the module.
@objc(UserDataModule)
final class BBBUserDataModule: RCTEventEmitter {

  private var hasListeners = false

  // MARK: - RCTEventEmitter

  override func supportedEvents() -> [String]! {
    return ["onUploadProgress", "onUploadComplete"]
  }

  override func startObserving() { hasListeners = true }
  override func stopObserving()  { hasListeners = false }

  override static func requiresMainQueueSetup() -> Bool { true }

  override static func moduleName() -> String! { "UserDataModule" }

  // MARK: - Exported methods

  /// Save session data to NSUserDefaults and start native background location tracking
  @objc func saveUserDetailsAndStartLocationUpdates(_ data: NSDictionary) {
    func save(_ key: UserDefaultKey, from dictKey: String) {
      if let value = data[dictKey] as? String { BBBUserDefault.set(value, for: key) }
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
      BBBLocationManager.shared.startUpdateLocation()
    }
  }

  /// Clear session data and stop location tracking
  @objc func clearUserDetails() {
    BBBUserDefault.remove(.sessionId)
    BBBUserDefault.remove(.deviceId)
    BBBUserDefault.remove(.deviceType)
    BBBUserDefault.remove(.deviceName)
    BBBUserDefault.remove(.shiftId)
    BBBUserDefault.remove(.horizontalAccuracy)
    BBBUserDefault.remove(.userId)
    BBBUserDefault.remove(.cubeUrl)
    BBBUserDefault.remove(.timeZone)
    DispatchQueue.main.async {
      BBBLocationManager.shared.deleteAllObjects()
      BBBLocationManager.shared.stopLocationUpdates()
    }
  }

  /// Stop location, upload all pending data, resolve with success/failure
  @objc func endUserSession(_ resolve: @escaping RCTPromiseResolveBlock,
                             rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async { [weak self] in
      guard let self else { return }
      let mgr = BBBLocationManager.shared
      mgr.stopLocationUpdates()
      let total = mgr.locationCount()
      self.processEndSession(mgr: mgr, total: total, uploaded: 0, resolve: resolve, reject: reject)
    }
  }

  private func processEndSession(mgr: BBBLocationManager, total: Int, uploaded: Int,
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

  /// Manual sync — upload all pending data and emit progress events
  @objc func syncLocationData() {
    DispatchQueue.main.async { [weak self] in
      guard let self else { return }
      let mgr = BBBLocationManager.shared
      mgr.stopLocationUpdates()
      let total = mgr.locationCount()
      self.processSyncUpload(mgr: mgr, total: total, uploaded: 0)
    }
  }

  private func processSyncUpload(mgr: BBBLocationManager, total: Int, uploaded: Int) {
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

  /// Returns "true" if no pending offline records (safe to log out)
  @objc func checkForLogOut(_ callback: @escaping RCTResponseSenderBlock) {
    DispatchQueue.main.async {
      let count = BBBLocationManager.shared.locationCount()
      callback([count > 0 ? "false" : "true"])
    }
  }

  /// Returns all saved location records as a JS array
  @objc func uploadOfflineLocationData(_ resolve: @escaping RCTPromiseResolveBlock,
                                        rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      let data = BBBLocationManager.shared.allSavedLocations()
      resolve(data)
    }
  }
}
