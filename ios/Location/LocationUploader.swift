//
//  LocationUploader.swift
//  bbb_smart_system
//
//  Created by Irtaza Fiaz on 17/06/2026.
//

import Foundation

final class LocationUploader {

  private let store: LocationPersistenceStore
  private var isUploading = false
  init(store: LocationPersistenceStore) { self.store = store }

  // MARK: - Public API

  // Must be called on the main queue — isUploading has no lock.
  func checkAndUploadPending(completion: @escaping (Bool) -> Void) {
    guard !isUploading else { completion(false); return }
    isUploading = true

    let batch = store.nextBatch(limit: 400)
    guard batch.count > 5, DefaultsStore.isUserLoggedIn else {
      isUploading = false
      completion(true); return
    }

    post(batch) { [weak self] success in
      guard let self else { return }
      DispatchQueue.main.async {
        if success {
          if self.store.nextBatch(limit: 400).count <= 5 {
            self.isUploading = false
            completion(true)
          } else {
            self.isUploading = false
            self.checkAndUploadPending(completion: completion)
          }
        } else {
          self.isUploading = false
          completion(false)
        }
      }
    }
  }
  
  func upload(_ batch: [StoredLocation], completion: @escaping (Bool) -> Void) {
    post(batch, completion: completion)
  }
  
  // MARK: - Helpers
  
  func timestampToDate(_ timestamp: String?) -> String? {
    guard let ts = timestamp else { return nil }
    let trimmed = ts.count > 10 ? String(ts.prefix(10)) : ts
    guard let interval = Double(trimmed) else { return nil }
    return Self.isoFormatter.string(from: Date(timeIntervalSince1970: interval))
  }
  
  private static let isoFormatter: DateFormatter = {
    let f = DateFormatter()
    f.timeZone = TimeZone(abbreviation: "UTC")
    f.dateFormat = "yyyy-MM-dd'T'HH:mm:ss"
    return f
  }()
  
  // MARK: - Networking
  
  private func post(_ locations: [StoredLocation], completion: @escaping (Bool) -> Void) {
    let session  = DefaultsStore.get(.sessionId) ?? ""
    let deviceId = DefaultsStore.get(.deviceId) ?? ""
    let devType  = DefaultsStore.get(.deviceType) ?? ""
    let devName  = DefaultsStore.get(.deviceName) ?? ""
    let shiftId  = DefaultsStore.get(.shiftId) ?? ""
    let userId   = DefaultsStore.get(.userId) ?? ""
    let postURL  = DefaultsStore.get(.cubeUrl) ?? ""
    
    guard !userId.isEmpty, !postURL.isEmpty else { completion(false); return }
    
    var locationArray: [[String: String]] = []
    var timestamps: [String] = []
    for loc in locations {
      let ts = loc.ctimestamp ?? ""
      timestamps.append(ts)
      locationArray.append([
        "latitude": loc.clatitude ?? "",
        "longitude": loc.clongitute ?? "",
        "horizontal_accuracy": loc.chorizontalAccuracy ?? "",
        "online_or_offline": loc.onlineOrOffline ?? "",
        "log_created_date": timestampToDate(ts) ?? "",
        "timestamp": ts,
      ])
    }
    
    GPSKalmanSmoother.smoothInPlace(&locationArray)
    
    let body: [String: Any] = [
      "data": locationArray,
      "sessionId": session,
      "deviceId": deviceId,
      "deviceType": devType,
      "deviceName": devName,
      "shiftId": shiftId,
      "user_id": userId,
    ]
    
    DispatchQueue.global(qos: .utility).async { [weak self] in
      guard let self else { return }
      guard let jsonData = try? JSONSerialization.data(withJSONObject: body),
            let urlObj = URL(string: postURL) else { completion(false); return }

      var request = URLRequest(url: urlObj, timeoutInterval: 30)
      request.httpMethod = "POST"
      request.setValue("application/json", forHTTPHeaderField: "Accept")
      request.setValue("application/json", forHTTPHeaderField: "Content-Type")
      request.httpBody = jsonData

      Log.network.debug("→ \(request.curlString)")

      URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
        if let error { Log.network.error("network error: \(error.localizedDescription)") }
        
        let code = (response as? HTTPURLResponse)?.statusCode ?? -1
        let raw = data.flatMap { String(data: $0, encoding: .utf8) } ?? ""
        Log.network.debug("← HTTP \(code) response=\(raw)")
        
        guard let self, error == nil, let data else { completion(false); return }
        guard let resp = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let status = resp["status"] as? Int, status == 200 else { completion(false); return }
        
        let deletedTimestamps = (resp["data"] as? [String]) ?? timestamps
        Log.network.debug("uploaded \(locations.count); server ts=\(deletedTimestamps.count)")
        
        self.store.delete(timestamps: deletedTimestamps)
        completion(true)
      }.resume()
    }
  }
}
