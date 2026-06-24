import Foundation
import CoreLocation
import Network
import UIKit

final class LocationManager: NSObject {

  static let shared = LocationManager()

  // MARK: - Properties
  
  private var locationManager: CLLocationManager?

  private var gpsPower: LocationModeManager?
  private var currentLocation: CLLocation?

  private var lastSeenLocation: CLLocation?

  private var noMovementTimer: Timer?
  private var bgTaskId: UIBackgroundTaskIdentifier = .invalid
  private var isOnline = false
  var onConnectivityChange: ((Bool) -> Void)?
  private var isTracking = false
  private var restTickCount = 0

  private let pathMonitor = NWPathMonitor()
  private let monitorQueue = DispatchQueue(label: "com.bbb.network-monitor")

  // MARK: - Collaborators

  private let store = LocationPersistenceStore()
  private lazy var uploader = LocationUploader(store: store)
  private let permissionGate = PermissionGate()

  // MARK: - Init
  
  private override init() {
    super.init()
    DefaultsStore.set("false", for: .postingData)
    startNetworkMonitor()
  }

  // MARK: - Network monitoring (replaces Reachability)
  
  private func startNetworkMonitor() {
    pathMonitor.pathUpdateHandler = { [weak self] path in
      let satisfied = path.status == .satisfied
      // NWPathMonitor fires on a background queue; Core Data (viewContext) and
      // the upload kickoff must run on main, so hop over before touching either.
      DispatchQueue.main.async {
        guard let self else { return }
        let wasOffline = !self.isOnline
        self.isOnline = satisfied
        self.onConnectivityChange?(satisfied)
        Log.network.info("→ \(self.isOnline ? "ONLINE" : "OFFLINE"). Pending: \(self.locationCount())")
        if self.isOnline && wasOffline && self.locationCount() > 0 {
          Log.network.info("back online — draining queued records")
          self.uploadDataToServer()
        }
      }
    }
    pathMonitor.start(queue: monitorQueue)
  }

  // MARK: - Public API

  var currentlyOnline: Bool { isOnline }

  func verifyPermissions() {
    DispatchQueue.main.async { [weak self] in
      guard let self else { return }
      if self.locationManager == nil {
        self.locationManager = CLLocationManager()
      }
      self.locationManager?.delegate = self
      _ = self.permissionGate.canStartTracking(locationManager: self.locationManager)
    }
  }

  func startUpdateLocation() {
    guard DefaultsStore.isUserLoggedIn else { return }
    DispatchQueue.main.async { [weak self] in
      guard let self else { return }
      if self.locationManager == nil {
        self.locationManager = CLLocationManager()
      }
      if let lm = self.locationManager, self.gpsPower == nil {
        self.gpsPower = LocationModeManager(locationManager: lm)
      }
      self.locationManager?.delegate = self
      guard self.permissionGate.canStartTracking(locationManager: self.locationManager) else {
        return
      }

      // Already running — don't re-apply FULL power. Foregrounding calls this
      // again (AppDelegate.applicationDidBecomeActive); re-running gpsPower.start()
      // would yank the chip out of REST on every foreground. Permissions were
      // already re-checked above, which is the only thing we need on re-entry.
      guard !self.isTracking else { return }
      self.isTracking = true

      self.locationManager?.pausesLocationUpdatesAutomatically = false
      self.locationManager?.showsBackgroundLocationIndicator = true
      self.locationManager?.allowsBackgroundLocationUpdates = true
      self.locationManager?.startUpdatingLocation()
      self.locationManager?.startMonitoringSignificantLocationChanges()
      self.gpsPower?.start()
      GPSLogger.info("START", note: "location updates started")
    }
  }

  func stopLocationUpdates() {
    DispatchQueue.main.async { [weak self] in
      guard let self, let mgr = self.locationManager else { return }
      self.isTracking = false
      mgr.pausesLocationUpdatesAutomatically = false
      mgr.showsBackgroundLocationIndicator = false
      mgr.allowsBackgroundLocationUpdates = false
      mgr.stopUpdatingLocation()
      mgr.stopMonitoringSignificantLocationChanges()
      self.gpsPower?.stop()
      self.noMovementTimer?.invalidate()
      self.noMovementTimer = nil
      if self.bgTaskId != .invalid {
        UIApplication.shared.endBackgroundTask(self.bgTaskId)
        self.bgTaskId = .invalid
      }
      GPSLogger.info("STOP", note: "location updates stopped")
    }
  }

  func uploadDataToServer() {
    DispatchQueue.main.async { [weak self] in
      guard let self else { return }
      Log.network.info("upload starting — \(self.locationCount()) records queued")
      self.checkAndUploadPending { success in
        Log.network.info("upload \(success ? "SUCCESS" : "FAILURE") — \(self.locationCount()) pending")
      }
    }
  }

  func deleteAllObjects() { store.deleteAll() }

  // MARK: - Store pass-throughs (public API surface)

  func locationCount() -> Int { store.count() }

  /// Most recent known fix, for the JS one-shot getCurrentLocation bridge.
  /// Prefers the freshest seen fix, then the last saved one, then CoreLocation's
  /// own cached location.
  func latestLocation() -> CLLocation? {
    lastSeenLocation ?? currentLocation ?? locationManager?.location
  }

  func savedLocationsBatch() -> [StoredLocation] { store.nextBatch(limit: 400) }

  func allSavedLocations() -> [[String: String]] {
    store.allAsDicts(timestampToDate: { [weak self] ts in self?.uploader.timestampToDate(ts) })
  }

  func deleteUploadedData(_ timestamps: [String]) { store.delete(timestamps: timestamps) }

  private func insertLocation(latitude: String, longitude: String, accuracy: String) {
    let onlineState = isOnline
    store.insert(latitude: latitude, longitude: longitude, accuracy: accuracy, online: onlineState)
    GPSLogger.log("SAVE",
                  lat: Double(latitude) ?? 0,
                  lon: Double(longitude) ?? 0,
                  accuracy: Double(accuracy) ?? 0,
                  speed: 0,
                  mode: "FULL",
                  note: "\(onlineState ? "online" : "offline"), pending \(locationCount())")
  }

  // MARK: - Upload pass-throughs (public API surface)

  func checkAndUploadPending(completion: @escaping (Bool) -> Void) {
    uploader.checkAndUploadPending(completion: completion)
  }

  func uploadBatch(_ batch: [StoredLocation], completion: @escaping (Bool) -> Void) {
    uploader.upload(batch, completion: completion)
  }

  // MARK: - No-movement timer

  private func startNoMovementTimer() {
    noMovementTimer?.invalidate()
    noMovementTimer = Timer.scheduledTimer(withTimeInterval: 120, repeats: true) { [weak self] _ in
      guard let self else { return }
      self.gpsPower?.enterRestMode()
      // While stationary, drop a "presence" point roughly every 6 min so the
      // trail proves the worker was on-site. saveBucket records nothing when
      // distance == 0, so without this a long stop is an empty gap.
      self.restTickCount += 1
      if self.restTickCount >= 3 {
        self.restTickCount = 0
        self.insertPresencePoint()
      }
      if self.isOnline { self.uploadDataToServer() }
    }
    RunLoop.main.add(noMovementTimer!, forMode: .common)
  }

  private func resetNoMovementTimer() {
    noMovementTimer?.invalidate()
    noMovementTimer = nil
    restTickCount = 0
  }

  /// Stationary heartbeat: re-save the last known location with a fresh
  /// timestamp while the chip is resting, so presence is recorded during long
  /// stops. Movement is handled by the normal save path, so this only runs in REST.
  private func insertPresencePoint() {
    guard gpsPower?.isResting == true, let loc = currentLocation else { return }
    let lat = String(format: "%.7f", loc.coordinate.latitude)
    let lon = String(format: "%.7f", loc.coordinate.longitude)
    let acc = String(format: "%.2f", loc.horizontalAccuracy)
    store.insert(latitude: lat, longitude: lon, accuracy: acc, online: isOnline)
    GPSLogger.log("SAVE",
                  lat: loc.coordinate.latitude,
                  lon: loc.coordinate.longitude,
                  accuracy: loc.horizontalAccuracy,
                  speed: 0,
                  mode: "REST",
                  note: "presence, pending \(locationCount())")
  }

  // MARK: - Background task

  private func beginBackgroundTask() {
    guard bgTaskId == .invalid else { return }
    bgTaskId = UIApplication.shared.beginBackgroundTask {
      UIApplication.shared.endBackgroundTask(self.bgTaskId)
      self.bgTaskId = .invalid
    }
  }

}

// MARK: - CLLocationManagerDelegate

extension LocationManager: CLLocationManagerDelegate {

  func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
    Log.gps.debug("chip fired — accuracy: \(Int(locations.last?.horizontalAccuracy ?? 0))m, speed: \(String(format: "%.1f", locations.last?.speed ?? 0)) m/s")
    if let last = locations.last {
      // NOTE: do NOT wake on every fix. Waking is driven only by real movement
      // (applyBackupWake: moved > wakeDistance) and the motion sensor — matching
      // the original optimized app. A blanket wake here defeated REST: any fix
      // arriving while resting instantly forced the chip back to FULL.
      GPSLogger.log("FIX",
                    lat: last.coordinate.latitude,
                    lon: last.coordinate.longitude,
                    accuracy: last.horizontalAccuracy,
                    speed: last.speed,
                    mode: self.currentMode(),
                    note: "raw fix from chip")
    }

    guard DefaultsStore.isUserLoggedIn else { return }

    DispatchQueue.main.async { [weak self] in
      guard let self else { return }
      if UIApplication.shared.applicationState != .active { self.beginBackgroundTask() }
      guard !locations.isEmpty else { return }

      let best = locations.min(by: { $0.horizontalAccuracy < $1.horizontalAccuracy })!
      let mode = self.currentMode()

      self.resetNoMovementTimer()
      self.startNoMovementTimer()

      if case .reject(let event, let note) = LocationFilterPipeline.ageDecision(for: best) {
        self.logReject(event, on: best, mode: mode, note: note); return
      }

      self.applyBackupWake(for: best)
      self.lastSeenLocation = best

      if case .reject(let event, let note) = LocationFilterPipeline.accuracyDecision(
          for: best, power: self.gpsPower) {
        self.logReject(event, on: best, mode: mode, note: note); return
      }

      let latStr = String(format: "%.7f", best.coordinate.latitude)
      let lonStr = String(format: "%.7f", best.coordinate.longitude)
      let accStr = String(format: "%.2f", best.horizontalAccuracy)

      guard let prev = self.currentLocation else {
        self.currentLocation = best
        self.insertLocation(latitude: latStr, longitude: lonStr, accuracy: accStr)
        return
      }

      let distance = prev.distance(from: best)
      let seconds = best.timestamp.timeIntervalSince(prev.timestamp)
      guard !seconds.isNaN else { self.currentLocation = best; return }

      if case .reject(let event, let note) = LocationFilterPipeline.jumpDecision(
          distance: distance, seconds: seconds) {
        self.logReject(event, on: best, mode: mode, note: note); return
      }

      let bucket = LocationFilterPipeline.saveBucket(
        speed: best.speed, distance: distance, seconds: seconds
      )
      if bucket != .none {
        self.currentLocation = best
        GPSLogger.log(
          "SAVED",
          lat: best.coordinate.latitude,
          lon: best.coordinate.longitude,
          accuracy: best.horizontalAccuracy,
          speed: best.speed,
          mode: mode,
          note: bucket.reason)
        self.insertLocation(latitude: latStr, longitude: lonStr, accuracy: accStr)
      }

      if self.isOnline && self.locationCount() > 200 {
        self.uploadDataToServer()
      }
    }
  }

  // MARK: - Delegate helpers

  private func currentMode() -> String {
    if gpsPower?.isResting == true { return "REST" }
    if gpsPower?.isDriving == true { return "DRIVE" }
    return "FULL"
  }

  private func applyBackupWake(for best: CLLocation) {
    guard let power = gpsPower, power.isResting, let prevSeen = lastSeenLocation else { return }
    let moved = best.distance(from: prevSeen)
    if moved > max(best.horizontalAccuracy, power.wakeDistance) {
      power.wake(reason: "moved while resting")
    }
  }

  private func logReject(_ event: String, on location: CLLocation, mode: String, note: String) {
    GPSLogger.log(event,
                  lat: location.coordinate.latitude,
                  lon: location.coordinate.longitude,
                  accuracy: location.horizontalAccuracy,
                  speed: location.speed,
                  mode: mode,
                  note: note)
  }

  func locationManagerDidPauseLocationUpdates(_ manager: CLLocationManager) {
    Log.gps.info("updates PAUSED by iOS (power saving)")
  }

  func locationManagerDidResumeLocationUpdates(_ manager: CLLocationManager) {
    Log.gps.info("updates RESUMED by iOS (movement detected)")
  }

  func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
    Log.gps.error("location error: \(error.localizedDescription)")
  }

  func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
    startUpdateLocation()
  }

  @available(iOS 14, *)
  func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
    locationManager(manager, didChangeAuthorization: manager.authorizationStatus)
  }
}

