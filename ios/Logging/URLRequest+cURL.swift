//
//  URLRequest+cURL.swift
//  bbb_smart_system
//
//  Created by Irtaza Fiaz on 17/06/2026.
//

import Foundation

extension URLRequest {
  var curlString: String {
    var parts = ["curl -X \(httpMethod ?? "GET")"]
    
    allHTTPHeaderFields?
      .sorted { $0.key < $1.key }
      .forEach { key, value in parts.append("-H '\(key): \(value)'") }
    
    if let body = httpBody, let bodyStr = String(data: body, encoding: .utf8) {
      let escaped = bodyStr.replacingOccurrences(of: "'", with: "'\\''")
      parts.append("--data '\(escaped)'")
    }
    
    parts.append("'\(url?.absoluteString ?? "")'")
    return parts.joined(separator: " ")
  }
}
