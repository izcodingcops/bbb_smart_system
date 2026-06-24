import Foundation

enum DefaultsKey: String {
  case sessionId        = "sessionId"
  case deviceId         = "deviceId"
  case deviceType       = "deviceType"
  case deviceName       = "deviceName"
  case shiftId          = "shiftId"
  case horizontalAccuracy = "horizontal_accuracy"
  case userId           = "user_id"
  case cubeUrl          = "cube_url"
  case postingData      = "posting_Data"
  case timeZone         = "time_zone"
  case smoothingFilter  = "smoothing_filter"   // "gaussian" | "kalman"
}

struct DefaultsStore {
  static func get(_ key: DefaultsKey) -> String? {
    return UserDefaults.standard.string(forKey: key.rawValue)
  }

  static func set(_ value: String, for key: DefaultsKey) {
    UserDefaults.standard.set(value, forKey: key.rawValue)
  }

  static func remove(_ key: DefaultsKey) {
    UserDefaults.standard.removeObject(forKey: key.rawValue)
  }

  static var isUserLoggedIn: Bool {
    let userId = UserDefaults.standard.string(forKey: DefaultsKey.userId.rawValue) ?? ""
    let cubeUrl = UserDefaults.standard.string(forKey: DefaultsKey.cubeUrl.rawValue) ?? ""
    return !userId.isEmpty && !cubeUrl.isEmpty
  }
}
