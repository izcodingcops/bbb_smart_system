# Location Tracking Bug Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 2 critical bugs and 5 important issues in the iOS GPS location tracking pipeline identified in code review.

**Architecture:** All fixes are isolated to existing Swift files — no new files needed. Critical fixes (background task retain cycle, Core Data race) are independent and can be done in parallel. Important fixes follow in a single task each.

**Tech Stack:** Swift, Core Data (`NSManagedObjectContext`/`NSBatchDeleteRequest`), CoreLocation, CoreMotion, `UIBackgroundTaskIdentifier`, `os.Logger`

## Global Constraints

- iOS deployment target: as set in existing project (do not change)
- Do not rename the `clongitute` Core Data attribute — it is a production attribute and renaming requires a migration PR (out of scope)
- Do not change public API surface of `LocationBridge` — JS callers depend on it
- All changes must compile without warnings on the existing Xcode scheme

---

### Task 1 (Critical): Fix `beginBackgroundTask` retain cycle

**Files:**
- Modify: `ios/Location/LocationManager.swift:231–237`

**Context:** The expiry handler passed to `beginBackgroundTask` captures `self` strongly. If `stopLocationUpdates()` races with the expiry handler, `endBackgroundTask` can be called twice on the same task ID, causing undefined behavior. Fix: capture `self` weakly in the expiry closure.

**Interfaces:**
- Consumes: nothing from other tasks
- Produces: nothing consumed by other tasks (isolated fix)

- [ ] **Step 1: Locate the existing `beginBackgroundTask` method**

Open `ios/Location/LocationManager.swift`. The method is at approximately line 231:

```swift
private func beginBackgroundTask() {
  guard bgTaskId == .invalid else { return }
  bgTaskId = UIApplication.shared.beginBackgroundTask {
    UIApplication.shared.endBackgroundTask(self.bgTaskId)   // ← strong capture
    self.bgTaskId = .invalid
  }
}
```

- [ ] **Step 2: Replace with weak-capture version**

Replace the entire `beginBackgroundTask()` method body with:

```swift
private func beginBackgroundTask() {
  guard bgTaskId == .invalid else { return }
  bgTaskId = UIApplication.shared.beginBackgroundTask { [weak self] in
    guard let self else { return }
    UIApplication.shared.endBackgroundTask(self.bgTaskId)
    self.bgTaskId = .invalid
  }
}
```

- [ ] **Step 3: Build to confirm no errors**

In Xcode: `Cmd+B`. Expected: Build Succeeded, zero errors, zero warnings on this file.

- [ ] **Step 4: Commit**

```bash
git add ios/Location/LocationManager.swift
git commit -m "fix: weak capture in beginBackgroundTask expiry handler"
```

---

### Task 2 (Critical): Fix Core Data `context.reset()` race in delete

**Files:**
- Modify: `ios/Location/LocationPersistenceStore.swift:70–89`

**Context:** `delete(timestamps:)` and `deleteAll()` both dispatch async to main and call `context.reset()`. This invalidates any `StoredLocation` managed objects still referenced by the upload loop (`processSyncUpload` in `LocationBridge`). The fix: replace `DispatchQueue.main.async` with `context.performAndWait` so deletes are synchronous and the caller controls sequencing. Since `context` is `viewContext` (main-queue bound), `performAndWait` on a caller already on main is safe and does not deadlock.

**Interfaces:**
- Consumes: nothing from Task 1
- Produces: nothing consumed by other tasks

- [ ] **Step 1: Replace `delete(timestamps:)` implementation**

In `ios/Location/LocationPersistenceStore.swift`, replace:

```swift
func delete(timestamps: [String]) {
  DispatchQueue.main.async { [weak self] in
    guard let self else { return }
    let req = NSFetchRequest<NSFetchRequestResult>(entityName: "StoredLocation")
    req.predicate = NSPredicate(format: "ctimestamp IN %@", timestamps)
    let delete = NSBatchDeleteRequest(fetchRequest: req)
    try? self.context.execute(delete)
    self.context.reset()
  }
}
```

with:

```swift
func delete(timestamps: [String]) {
  context.performAndWait {
    let req = NSFetchRequest<NSFetchRequestResult>(entityName: "StoredLocation")
    req.predicate = NSPredicate(format: "ctimestamp IN %@", timestamps)
    let batchDelete = NSBatchDeleteRequest(fetchRequest: req)
    try? context.execute(batchDelete)
    context.reset()
  }
}
```

- [ ] **Step 2: Replace `deleteAll()` implementation**

Replace:

```swift
func deleteAll() {
  DispatchQueue.main.async { [weak self] in
    guard let self else { return }
    let req = NSFetchRequest<NSFetchRequestResult>(entityName: "StoredLocation")
    let delete = NSBatchDeleteRequest(fetchRequest: req)
    try? self.context.execute(delete)
    self.context.reset()
  }
}
```

with:

```swift
func deleteAll() {
  context.performAndWait {
    let req = NSFetchRequest<NSFetchRequestResult>(entityName: "StoredLocation")
    let batchDelete = NSBatchDeleteRequest(fetchRequest: req)
    try? context.execute(batchDelete)
    context.reset()
  }
}
```

- [ ] **Step 3: Build**

`Cmd+B`. Expected: Build Succeeded.

- [ ] **Step 4: Commit**

```bash
git add ios/Location/LocationPersistenceStore.swift
git commit -m "fix: use performAndWait in delete to prevent context.reset race"
```

---

### Task 3 (Important): Replace `postingData` UserDefaults mutex with in-memory flag

**Files:**
- Modify: `ios/Location/LocationUploader.swift`

**Context:** `postingData` is persisted in `UserDefaults`. If the process is killed mid-upload the flag stays `"true"` and `checkAndUploadPending` silently skips all future uploads until `startUpdateLocation` resets it. An in-memory `Bool` has no cross-restart persistence — it resets automatically on next process launch.

**Interfaces:**
- Consumes: nothing from Tasks 1–2
- Produces: nothing consumed downstream

- [ ] **Step 1: Add `isUploading` property and remove UserDefaults reads/writes**

At the top of `LocationUploader` class (after `private let store`), add:

```swift
private var isUploading = false
```

- [ ] **Step 2: Replace all `DefaultsStore` postingData usages in `checkAndUploadPending`**

Current code uses `DefaultsStore.get(.postingData)` as a guard and `DefaultsStore.set("true"/"false", for: .postingData)` around upload. Replace every occurrence in `checkAndUploadPending` and `post(_:completion:)`:

- `guard DefaultsStore.get(.postingData) != "true"` → `guard !isUploading`
- `DefaultsStore.set("true", for: .postingData)` → `isUploading = true`
- `DefaultsStore.set("false", for: .postingData)` → `isUploading = false`

After the change, `checkAndUploadPending` should look like:

```swift
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
```

And inside `post(_:completion:)` remove the two `DefaultsStore.set("false", for: .postingData)` calls (the caller `checkAndUploadPending` now owns the flag).

- [ ] **Step 3: Build**

`Cmd+B`. Expected: Build Succeeded.

- [ ] **Step 4: Confirm `DefaultsStore.Key.postingData` is no longer referenced**

```bash
grep -r "postingData" ios/
```

Expected: zero results (or only in `DefaultsStore` definition if the key still exists there — that's fine, just unused).

- [ ] **Step 5: Commit**

```bash
git add ios/Location/LocationUploader.swift
git commit -m "fix: replace UserDefaults postingData mutex with in-memory isUploading flag"
```

---

### Task 4 (Important): Fix `PermissionGate` main-thread block

**Files:**
- Modify: `ios/Permissions/PermissionGate.swift:20–28`

**Context:** `canStartTracking` dispatches `CLLocationManager.locationServicesEnabled()` to a background queue then calls `group.wait()` on the main thread. `locationServicesEnabled()` is safe and synchronous on any thread — no dispatch needed.

**Interfaces:**
- Consumes: nothing from prior tasks
- Produces: nothing consumed downstream

- [ ] **Step 1: Remove the DispatchGroup and background dispatch**

Replace:

```swift
func canStartTracking(locationManager: CLLocationManager?) -> Bool {
  var servicesEnabled = true
  let group = DispatchGroup()
  group.enter()
  DispatchQueue.global(qos: .userInitiated).async {
    servicesEnabled = CLLocationManager.locationServicesEnabled()
    group.leave()
  }
  group.wait()
  if !servicesEnabled {
```

with:

```swift
func canStartTracking(locationManager: CLLocationManager?) -> Bool {
  let servicesEnabled = CLLocationManager.locationServicesEnabled()
  if !servicesEnabled {
```

- [ ] **Step 2: Build**

`Cmd+B`. Expected: Build Succeeded.

- [ ] **Step 3: Commit**

```bash
git add ios/Permissions/PermissionGate.swift
git commit -m "fix: call locationServicesEnabled directly instead of blocking main thread"
```

---

### Task 5 (Important): Promote network errors to `.error` level in Log.swift

**Files:**
- Modify: `ios/Logging/Log.swift:27–38`

**Context:** `Log.Category.debug` and `Log.Category.info` are gated by `#if DEBUG`. Network errors in `LocationUploader` are logged with `Log.network.debug(...)` and are therefore invisible in production builds. `os.Logger` levels should match severity — errors must reach production crash logs.

**Interfaces:**
- Consumes: nothing from prior tasks
- Produces: nothing consumed downstream

- [ ] **Step 1: Remove `#if DEBUG` from `info`**

In `ios/Logging/Log.swift`, change `info` from:

```swift
func info(_ message: @autoclosure () -> String) {
  #if DEBUG
  let text = message()
  logger.info("\(text, privacy: .public)")
  #endif
}
```

to:

```swift
func info(_ message: @autoclosure () -> String) {
  let text = message()
  logger.info("\(text, privacy: .public)")
}
```

Leave `debug` gated by `#if DEBUG` — verbose fix-level output is intentionally debug-only.

- [ ] **Step 2: Update network error call sites in LocationUploader to use `.error`**

In `ios/Location/LocationUploader.swift`, change:

```swift
if let error { Log.network.debug("network error: \(error.localizedDescription)") }
```

to:

```swift
if let error { Log.network.error("network error: \(error.localizedDescription)") }
```

And change the HTTP non-200 path's debug log to error level if you add one (currently it just calls `completion(false)` silently — add):

```swift
guard let resp = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
      let status = resp["status"] as? Int, status == 200 else {
  let raw = data.flatMap { String(data: $0, encoding: .utf8) } ?? ""
  Log.network.error("upload rejected — HTTP \(code) body=\(raw)")
  completion(false); return
}
```

- [ ] **Step 3: Build**

`Cmd+B`. Expected: Build Succeeded.

- [ ] **Step 4: Commit**

```bash
git add ios/Logging/Log.swift ios/Location/LocationUploader.swift
git commit -m "fix: promote network errors to os.Logger .error level for production visibility"
```

---

### Task 6 (Important): Fix wrong log string in `applyFullPower`

**Files:**
- Modify: `ios/GPS/LocationModeManager.swift:86`

**Context:** `applyFullPower` logs `filter=none` but `movingDistanceFilter` is 5 metres. The log is used for battery/accuracy regression debugging — a wrong value makes post-mortem analysis misleading.

**Interfaces:**
- Consumes: nothing from prior tasks
- Produces: nothing consumed downstream

- [ ] **Step 1: Find the constant value for `movingDistanceFilter`**

Search `LocationModeManager.swift` for `movingDistanceFilter` to confirm its value:

```bash
grep -n "movingDistanceFilter" ios/GPS/LocationModeManager.swift
```

Note the exact value (expected: `5` or `CLLocationDistance = 5`).

- [ ] **Step 2: Fix the log string**

Change line ~86 from:

```swift
GPSLogger.info("MODE_FULL", note: "accuracy=best filter=none reason=\(reason)")
```

to (replace `5` with the actual value if different):

```swift
GPSLogger.info("MODE_FULL", note: "accuracy=best filter=\(Int(movingDistanceFilter))m reason=\(reason)")
```

- [ ] **Step 3: Build**

`Cmd+B`. Expected: Build Succeeded.

- [ ] **Step 4: Commit**

```bash
git add ios/GPS/LocationModeManager.swift
git commit -m "fix: log actual movingDistanceFilter value in MODE_FULL log"
```

---

### Task 7 (Important): Add acausal-smoother comment + Kalman tuning comment

**Files:**
- Modify: `ios/GPS/GPSTrackSmoother.swift` (around lines 544–555)
- Modify: `ios/GPS/GPSKalmanSmoother.swift:17`

**Context:** Two reviewer findings: (1) the Gaussian smoother is intentionally acausal (offline batch) but has no comment — future maintainers will mistake it for a causal filter and wrongly try to make it one-sided. (2) `sigmaAccel = 3.0 m/s²` has no tuning guidance — future maintainers will blindly adjust it.

**Interfaces:**
- Consumes: nothing from prior tasks
- Produces: nothing consumed downstream

- [ ] **Step 1: Add acausal comment to GPSTrackSmoother**

Find the Gaussian kernel application loop in `ios/GPS/GPSTrackSmoother.swift` around lines 544–555. Directly above the loop that applies weights to both past and future indices, add:

```swift
// Intentionally acausal: this smoother runs on a stored batch before upload,
// so future points are available. Using a centered (symmetric) kernel gives
// lower error than a one-sided causal filter would. Do NOT convert this to
// causal/one-sided — it is correct as written.
```

- [ ] **Step 2: Add tuning comment to GPSKalmanSmoother**

In `ios/GPS/GPSKalmanSmoother.swift`, change line 17 from:

```swift
private static let sigmaAccel: Double = 3.0
```

to:

```swift
// 3 m/s² covers both pedestrian (~1.5 m/s² peak) and automotive (~3–4 m/s²).
// Increase for vehicles with harder acceleration; decrease for pedestrian-only
// use to get tighter smoothing. Changing this also rescales process noise Q.
private static let sigmaAccel: Double = 3.0
```

- [ ] **Step 3: Build**

`Cmd+B`. Expected: Build Succeeded.

- [ ] **Step 4: Commit**

```bash
git add ios/GPS/GPSTrackSmoother.swift ios/GPS/GPSKalmanSmoother.swift
git commit -m "docs: add acausal smoother comment and sigmaAccel tuning guidance"
```

---

### Task 8 (Important): Fix `syncLocationData` stopping updates during upload

**Files:**
- Modify: `ios/Bridge/LocationBridge.swift:111–119`

**Context:** `syncLocationData` calls `mgr.stopLocationUpdates()` before uploading, creating a gap in location collection for the duration of the upload (up to 30s per batch). Since `checkAndUploadPending` already has the `isUploading` mutex (after Task 3), collection can continue in parallel with upload.

**Interfaces:**
- Consumes: Task 3 must be complete (relies on `isUploading` mutex being in-memory, not UserDefaults)
- Produces: nothing consumed downstream

- [ ] **Step 1: Remove the `stopLocationUpdates` call from `syncLocationData`**

In `ios/Bridge/LocationBridge.swift`, change:

```swift
@objc func syncLocationData() {
  DispatchQueue.main.async { [weak self] in
    guard let self else { return }
    let mgr = LocationManager.shared
    mgr.stopLocationUpdates()
    let total = mgr.locationCount()
    self.processSyncUpload(mgr: mgr, total: total, uploaded: 0)
  }
}
```

to:

```swift
@objc func syncLocationData() {
  DispatchQueue.main.async { [weak self] in
    guard let self else { return }
    let mgr = LocationManager.shared
    let total = mgr.locationCount()
    self.processSyncUpload(mgr: mgr, total: total, uploaded: 0)
  }
}
```

- [ ] **Step 2: Update `processSyncUpload` failure path to not restart updates**

Since we no longer stop updates, the failure path should not call `startUpdateLocation()`. Change:

```swift
} else {
  if self.hasListeners { self.sendEvent(withName: "onUploadComplete", body: ["status": "Retry"]) }
  mgr.startUpdateLocation()
}
```

to:

```swift
} else {
  if self.hasListeners { self.sendEvent(withName: "onUploadComplete", body: ["status": "Retry"]) }
}
```

And the success/empty path should similarly not call `startUpdateLocation()`:

```swift
if batch.isEmpty {
  if hasListeners { sendEvent(withName: "onUploadComplete", body: ["status": "completed"]) }
  return
}
```

- [ ] **Step 3: Build**

`Cmd+B`. Expected: Build Succeeded.

- [ ] **Step 4: Verify `endUserSession` still stops updates**

Search that `stopLocationUpdates` is still called from `endUserSession` (location must stop when the session ends):

```bash
grep -n "stopLocationUpdates\|endUserSession" ios/Bridge/LocationBridge.swift
```

Expected: `stopLocationUpdates` appears inside `endUserSession`, not inside `syncLocationData`.

- [ ] **Step 5: Commit**

```bash
git add ios/Bridge/LocationBridge.swift
git commit -m "fix: do not stop location updates during syncLocationData upload"
```

---

## Self-Review

**Spec coverage:**
- Critical 1 (bgTask retain cycle): Task 1 ✓
- Critical 2 (context.reset race): Task 2 ✓
- Important: postingData flag: Task 3 ✓
- Important: PermissionGate main-thread block: Task 4 ✓
- Important: Log levels silent in production: Task 5 ✓
- Important: wrong filter=none log: Task 6 ✓
- Important: missing comments (acausal + sigmaAccel): Task 7 ✓
- Important: syncLocationData stops updates: Task 8 ✓
- Skipped (per user): GPSLogger FileHandle, clongitute typo, sigmaAccel minor

**Task 8 dependency on Task 3** is noted in Interfaces — enforce ordering when dispatching.

**Placeholder scan:** No TBDs. All code blocks are complete and reference real method names from the read files.

**Type consistency:** All method names (`stopLocationUpdates`, `startUpdateLocation`, `processSyncUpload`, `checkAndUploadPending`, `isUploading`, `context.performAndWait`) match what was read from the actual source files.
