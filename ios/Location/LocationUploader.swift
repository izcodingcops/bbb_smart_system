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
  
  func checkAndUploadPending(completion: @escaping (Bool) -> Void) {
    guard DefaultsStore.get(.postingData) != "true" else { completion(false); return }
    DefaultsStore.set("true", for: .postingData)
    
    let batch = store.nextBatch(limit: 400)
    guard batch.count > 5, DefaultsStore.isUserLoggedIn else {
      DefaultsStore.set("false", for: .postingData)
      completion(true); return
    }
    
    post(batch) { [weak self] success in
      guard let self else { return }
      DispatchQueue.main.async {
        if success {
          if self.store.nextBatch(limit: 400).count <= 5 {
            DefaultsStore.set("false", for: .postingData)
            completion(true)
          } else {
            DefaultsStore.set("false", for: .postingData)
            self.checkAndUploadPending(completion: completion)
          }
        } else {
          DefaultsStore.set("false", for: .postingData)
          completion(false)
        }
      }
    }
  }
  
  func upload(_ batch: [CubeLocation], completion: @escaping (Bool) -> Void) {
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
  
  private func post(_ locations: [CubeLocation], completion: @escaping (Bool) -> Void) {
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

      var request = URLRequest(url: urlObj, timeoutInterval: 30)
      request.httpMethod = "POST"
      request.setValue("application/json", forHTTPHeaderField: "Accept")
      request.setValue("application/json", forHTTPHeaderField: "Content-Type")
      request.httpBody = jsonData

      // Copy-pasteable curl of the exact request (method + headers + body).
      print("[Uploader] \(Self.curlString(for: request))")

      URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
//        #if DEBUG
        if let error { print("[Uploader] network error: \(error.localizedDescription)") }
        let code = (response as? HTTPURLResponse)?.statusCode ?? -1
        let raw = data.flatMap { String(data: $0, encoding: .utf8) } ?? ""
        print("[Uploader] HTTP \(code) response=\(raw)")
//        #endif
        guard let self, error == nil, let data else { completion(false); return }
        guard let resp = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let status = resp["status"] as? Int, status == 200 else { completion(false); return }
        let deletedTimestamps = (resp["data"] as? [String]) ?? timestamps
//        #if DEBUG
        print("[Uploader] uploaded \(locations.count); server ts=\(deletedTimestamps.count)")
//        #endif
        self.store.delete(timestamps: deletedTimestamps)
        DefaultsStore.set("false", for: .postingData)
        completion(true)
      }.resume()
    }
  }

  /// Builds a copy-pasteable curl command from a URLRequest — method, headers,
  /// and body — so a failing upload can be replayed verbatim from a terminal.
  /// Note: system headers (Content-Length, User-Agent) are added by URLSession
  /// at send time and won't appear here; curl recomputes Content-Length from --data.
  private static func curlString(for request: URLRequest) -> String {
    var parts = ["curl -X \(request.httpMethod ?? "GET")"]
    request.allHTTPHeaderFields?
      .sorted { $0.key < $1.key }
      .forEach { key, value in parts.append("-H '\(key): \(value)'") }
    if let body = request.httpBody, let bodyStr = String(data: body, encoding: .utf8) {
      let escaped = bodyStr.replacingOccurrences(of: "'", with: "'\\''")
      parts.append("--data '\(escaped)'")
    }
    parts.append("'\(request.url?.absoluteString ?? "")'")
    return parts.joined(separator: " ")
  }
}
