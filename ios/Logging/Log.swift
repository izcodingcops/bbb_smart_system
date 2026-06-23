//
//  Log.swift
//  bbb_smart_system
//
//  Created by Irtaza Fiaz on 17/06/2026.
//

import Foundation
import os

enum Log {
  private static let subsystem = "com.bbb.smart"

  static let app         = Category("App")
  static let gps         = Category("GPS")
  static let location    = Category("Location")
  static let network     = Category("Network")
  static let permissions = Category("Permissions")

  struct Category {
    private let logger: os.Logger

    init(_ name: String) {
      self.logger = os.Logger(subsystem: Log.subsystem, category: name)
    }

    func debug(_ message: @autoclosure () -> String) {
      #if DEBUG
      let text = message()
      logger.debug("\(text, privacy: .public)")
      #endif
    }

    func info(_ message: @autoclosure () -> String) {
      #if DEBUG
      let text = message()
      logger.info("\(text, privacy: .public)")
      #endif
    }

    func warn(_ message: @autoclosure () -> String) {
      let text = message()
      logger.warning("\(text, privacy: .public)")
    }

    func error(_ message: @autoclosure () -> String) {
      let text = message()
      logger.error("\(text, privacy: .public)")
    }
  }
}
