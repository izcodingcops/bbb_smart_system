import Foundation

enum UserDefaultKey: String {
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
}

struct UserDefault {
  static func get(_ key: UserDefaultKey) -> String? {
    return UserDefaults.standard.string(forKey: key.rawValue)
  }

  static func set(_ value: String, for key: UserDefaultKey) {
    UserDefaults.standard.set(value, forKey: key.rawValue)
  }

  static func remove(_ key: UserDefaultKey) {
    UserDefaults.standard.removeObject(forKey: key.rawValue)
  }

  static var isUserLoggedIn: Bool {
    let userId = UserDefaults.standard.string(forKey: UserDefaultKey.userId.rawValue) ?? ""
    let cubeUrl = UserDefaults.standard.string(forKey: UserDefaultKey.cubeUrl.rawValue) ?? ""
    return !userId.isEmpty && !cubeUrl.isEmpty
  }
}
