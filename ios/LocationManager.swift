import Foundation
import CoreLocation
import Network
import UIKit

private let kDistanceFilter: CLLocationDistance = 10.0
private let kDesiredAccuracy: CLLocationAccuracy = kCLLocationAccuracyBest

final class LocationManager: NSObject {

  static let shared = LocationManager()

  // MARK: - Properties
  
  private var locationManager: CLLocationManager?
  // Exposed so the accuracy gate in didUpdateLocations can read isDriving
  // and lastWakeAt. Created lazily once locationManager exists.
  private var gpsPower: GPSPowerManager?
  private var currentLocation: CLLocation?

  // Most recent fresh fix we've seen — used as the backup wake source when
  // Motion permission is denied. Compares consecutive fresh fixes (NOT the
  // saved anchor), so a stale anchor can't cause false wakes. Cleared on
  // app launch, so iOS-replayed cached fixes after restart can't poison it
  // for more than one reading.
  private var lastSeenLocation: CLLocation?

  private var noMovementTimer: Timer?
  private var bgTaskId: UIBackgroundTaskIdentifier = .invalid
  private var isPosting = false
  private var isOnline = false

  private let pathMonitor = NWPathMonitor()
  private let monitorQueue = DispatchQueue(label: "com.bbb.network-monitor")

  // MARK: - Collaborators

  private let store = LocationStore()
  private lazy var uploader = LocationUploader(store: store)
  private let permissionGate = PermissionGate()

  // MARK: - Init
  
  private override init() {
    super.init()
    UserDefault.set("false", for: .postingData)
    startNetworkMonitor()
  }

  // MARK: - Network monitoring (replaces Reachability)
  
  private func startNetworkMonitor() {
    pathMonitor.pathUpdateHandler = { [weak self] path in
      guard let self else { return }
      let wasOffline = !self.isOnline
      self.isOnline = path.status == .satisfied
      NSLog("[Network] → %@. Pending: %lu", self.isOnline ? "ONLINE" : "OFFLINE", self.locationCount())
      if self.isOnline && wasOffline && self.locationCount() > 0 {
        NSLog("[Sync] Back online — draining queued records")
        self.uploadDataToServer()
      }
    }
    pathMonitor.start(queue: monitorQueue)
  }

  // MARK: - Public API

  /// Runs the permission gate regardless of login state. If anything is
  /// missing the gate shows the blocking Settings-deep-link alert; once all
  /// permissions are granted the alert auto-dismisses. Safe to call on every
  /// app launch and applicationDidBecomeActive — it never starts tracking,
  /// it only verifies permissions.
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
    guard UserDefault.isUserLoggedIn else { return }
    DispatchQueue.main.async { [weak self] in
      guard let self else { return }
      if self.locationManager == nil {
        self.locationManager = CLLocationManager()
      }
      if let lm = self.locationManager, self.gpsPower == nil {
        self.gpsPower = GPSPowerManager(locationManager: lm)
      }
      self.locationManager?.delegate = self
      // One-stop permission check: location auth, precise location, motion
      // auth. If anything is missing the gate either triggers a system
      // prompt (notDetermined) or shows a Settings-deep-link alert
      // (denied/restricted). Either way we bail; the gate will re-evaluate
      // via didChangeAuthorization or applicationDidBecomeActive.
      guard self.permissionGate.canStartTracking(locationManager: self.locationManager) else {
        return
      }
      self.locationManager?.distanceFilter = kDistanceFilter
      self.locationManager?.desiredAccuracy = kDesiredAccuracy
      // Match old app: never let iOS pause GPS on its own. Our own REST
      // mode (GPSPowerManager) handles power saving deterministically;
      // iOS's auto-pause has unpredictable wake-up latency.
      self.locationManager?.pausesLocationUpdatesAutomatically = false
      self.locationManager?.showsBackgroundLocationIndicator = true
      self.locationManager?.allowsBackgroundLocationUpdates = true
      self.locationManager?.startUpdatingLocation()
      self.locationManager?.startMonitoringSignificantLocationChanges()
      self.gpsPower?.start()
      
      NSLog("[GPS] Location updates started")
      GPSLogger.info("START", note: "location updates started")
      
    }
  }

  func stopLocationUpdates() {
    DispatchQueue.main.async { [weak self] in
      guard let self, let mgr = self.locationManager else { return }
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
      
      NSLog("[GPS] Location updates stopped")
      GPSLogger.info("STOP", note: "location updates stopped")
      
    }
  }

  func uploadDataToServer() {
    DispatchQueue.main.async { [weak self] in
      guard let self else { return }
      NSLog("[Sync] Upload starting — %lu records queued", self.locationCount())
      self.checkAndUploadPending { success in
        NSLog("[Sync] Upload %@ — %lu pending",
              success ? "SUCCESS" : "FAILURE", self.locationCount())
      }
    }
  }

  func deleteAllObjects() { store.deleteAll() }

  // MARK: - Store pass-throughs (public API surface)

  func locationCount() -> Int { store.count() }

  func savedLocationsBatch() -> [CubeLocation] { store.nextBatch(limit: 400) }

  func allSavedLocations() -> [[String: String]] {
    store.allAsDicts(timestampToDate: { [weak self] ts in self?.uploader.timestampToDate(ts) })
  }

  func deleteUploadedData(_ timestamps: [String]) { store.delete(timestamps: timestamps) }

  private func insertLocation(latitude: String, longitude: String, accuracy: String) {
    let onlineState = isOnline
    store.insert(latitude: latitude, longitude: longitude, accuracy: accuracy, online: onlineState)
    NSLog("[CoreData] Saved %@ point — total pending: %lu",
          onlineState ? "online" : "offline", locationCount())
    GPSLogger.log("SAVE",
                  lat: Double(latitude) ?? 0,
                  lon: Double(longitude) ?? 0,
                  accuracy: Double(accuracy) ?? 0,
                  speed: 0,
                  mode: "FULL",
                  note: "persisted to Core Data")
  }

  // MARK: - Upload pass-throughs (public API surface)

  func checkAndUploadPending(completion: @escaping (Bool) -> Void) {
    uploader.checkAndUploadPending(completion: completion)
  }

  func uploadBatch(_ batch: [CubeLocation], completion: @escaping (Bool) -> Void) {
    uploader.upload(batch, completion: completion)
  }

  // MARK: - No-movement timer

  private func startNoMovementTimer() {
    noMovementTimer?.invalidate()
    noMovementTimer = Timer.scheduledTimer(withTimeInterval: 120, repeats: true) { [weak self] _ in
      guard let self else { return }
      // 120s with no accepted fix = worker is stationary → rest the chip.
      // No-op if motion sensor disagrees, or if already resting (heartbeat).
      self.gpsPower?.enterRestMode()
      if self.isOnline { self.uploadDataToServer() }
    }
    RunLoop.main.add(noMovementTimer!, forMode: .common)
  }

  private func resetNoMovementTimer() {
    noMovementTimer?.invalidate()
    noMovementTimer = nil
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
    NSLog(
      "[GPS] Chip fired — accuracy: %.0fm, speed: %.1f m/s",
      locations.last?.horizontalAccuracy ?? 0, locations.last?.speed ?? 0
      )
    if let last = locations.last {
      // A fix arrived during REST → the worker has moved 30m+ since last
      // fix. Wake the chip back to FULL/DRIVE before we even decide whether
      // to save this point.
      self.gpsPower?.wake(reason: "new fix")
      GPSLogger.log("FIX",
                    lat: last.coordinate.latitude,
                    lon: last.coordinate.longitude,
                    accuracy: last.horizontalAccuracy,
                    speed: last.speed,
                    mode: self.currentMode(),
                    note: "raw fix from chip")
    }

    guard UserDefault.isUserLoggedIn else { return }

    DispatchQueue.main.async { [weak self] in
      guard let self else { return }
      if UIApplication.shared.applicationState != .active { self.beginBackgroundTask() }
      guard !locations.isEmpty else { return }

      let best = locations.min(by: { $0.horizontalAccuracy < $1.horizontalAccuracy })!
      let mode = self.currentMode()

      // ANY delivered fix means the device physically moved past the
      // distance filter — even a low-accuracy one. Reset the stationary
      // countdown BEFORE the quality gates, so bad in-car signal can never
      // starve the timer and put GPS to rest mid-drive.
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
        GPSLogger.log("SAVED",
                      lat: best.coordinate.latitude,
                      lon: best.coordinate.longitude,
                      accuracy: best.horizontalAccuracy,
                      speed: best.speed,
                      mode: mode,
                      note: bucket.reason)
        self.insertLocation(latitude: latStr, longitude: lonStr, accuracy: accStr)
      }

      // Burst upload trigger: under continuous movement the no-movement
      // timer never fires (reset on every fix), so without this the queue
      // grows unbounded. 200 = same threshold the old app uses.
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

  /// Backup wake-up (used if Motion permission is denied): while resting,
  /// a fix clearly outside the error circle of the previous fresh fix
  /// means real movement. Runs BEFORE the accuracy gate, because REST-mode
  /// fixes are low-accuracy on purpose. Compares consecutive fresh fixes,
  /// never the saved anchor — so a wrong anchor can't cause false wakes.
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
    NSLog("[GPS] Updates PAUSED by iOS (power saving)")
  }

  func locationManagerDidResumeLocationUpdates(_ manager: CLLocationManager) {
    NSLog("[GPS] Updates RESUMED by iOS (movement detected)")
  }

  func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
    NSLog("[GPS] Error: %@", error.localizedDescription)
  }

  func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
    // Re-run the gate on every auth change. Covers: user just answered the
    // first-launch prompt, user flipped Precise ON/OFF in Settings, user
    // changed Always↔WhenInUse, etc. The gate decides whether to start,
    // show an alert, or do nothing.
    startUpdateLocation()
  }

  @available(iOS 14, *)
  func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
    locationManager(manager, didChangeAuthorization: manager.authorizationStatus)
  }
}

