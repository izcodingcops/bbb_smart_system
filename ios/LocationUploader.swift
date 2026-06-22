//
//  LocationUploader.swift
//  bbb_smart_system
//
//  Created by Irtaza Fiaz on 17/06/2026.
//

import Foundation

final class LocationUploader {
  
  private let store: LocationStore
  init(store: LocationStore) { self.store = store }
  
  // MARK: - Public API
  
  /// Recursively drains the queue while batches > 5 records exist. Sets
  /// the `postingData` flag in UserDefaults so multiple callers can't
  /// stomp on each other.
  func checkAndUploadPending(completion: @escaping (Bool) -> Void) {
    guard UserDefault.get(.postingData) != "true" else { completion(false); return }
    UserDefault.set("true", for: .postingData)
    
    let batch = store.nextBatch(limit: 400)
    guard batch.count > 5, UserDefault.isUserLoggedIn else {
      UserDefault.set("false", for: .postingData)
      completion(true); return
    }
    
    post(batch) { [weak self] success in
      guard let self else { return }
      DispatchQueue.main.async {
        if success {
          if self.store.nextBatch(limit: 400).count <= 5 {
            UserDefault.set("false", for: .postingData)
            completion(true)
          } else {
            UserDefault.set("false", for: .postingData)
            self.checkAndUploadPending(completion: completion)
          }
        } else {
          UserDefault.set("false", for: .postingData)
          completion(false)
        }
      }
    }
  }
  
  /// Upload a specific batch (used by end-of-session and manual sync).
  func upload(_ batch: [CubeLocation], completion: @escaping (Bool) -> Void) {
    post(batch, completion: completion)
  }
  
  // MARK: - Helpers
  
  /// Public so the store's `allAsDicts` can format consistently with the
  /// upload payload.
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
  
  private func post(_ locations: [CubeLocation], completion: @escaping (Bool) -> Void) {
    let session  = UserDefault.get(.sessionId) ?? ""
    let deviceId = UserDefault.get(.deviceId) ?? ""
    let devType  = UserDefault.get(.deviceType) ?? ""
    let devName  = UserDefault.get(.deviceName) ?? ""
    let shiftId  = UserDefault.get(.shiftId) ?? ""
    let userId   = UserDefault.get(.userId) ?? ""
    let postURL  = UserDefault.get(.cubeUrl) ?? ""
    
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
    
    // Polyline smoothing — each point gets blended with its past+future
    // neighbours before upload. Raw fixes stay in Core Data; only the
    // outgoing payload is smoothed, so we can replay raw data later if
    // the smoother ever needs tuning.
    GPSBatchSmoother.smoothInPlace(&locationArray)
    
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

      print("[Uploader] POST \(postURL)")
      print("[Uploader] payload=\(String(data: jsonData, encoding: .utf8) ?? "")")

      var request = URLRequest(url: urlObj, timeoutInterval: 30)
      request.httpMethod = "POST"
      request.setValue("application/json", forHTTPHeaderField: "Accept")
      request.setValue("application/json", forHTTPHeaderField: "Content-Type")
      request.httpBody = jsonData

      URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
        if let error { print("[Uploader] network error: \(error.localizedDescription)") }
        let code = (response as? HTTPURLResponse)?.statusCode ?? -1
        let raw = data.flatMap { String(data: $0, encoding: .utf8) } ?? ""
        print("[Uploader] HTTP \(code) response=\(raw)")
        guard let self, error == nil, let data else { completion(false); return }
        guard let resp = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let status = resp["status"] as? Int, status == 200 else { completion(false); return }
        let deletedTimestamps = (resp["data"] as? [String]) ?? timestamps
        print("[Uploader] uploaded \(locations.count); server ts=\(deletedTimestamps.count)")
        self.store.delete(timestamps: deletedTimestamps)
        UserDefault.set("false", for: .postingData)
        completion(true)
      }.resume()
    }
  }
}
