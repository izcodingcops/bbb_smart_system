# GPS / Location Tracking — How It Works

Plain-language spec of the iOS location tracking system, so a future session can
compare behavior, spot regressions, or debug "why is it draining battery / not
resting / not uploading." Reflects the current (restored-baseline) implementation.

## Purpose

Track a worker's location during their shift, in the background, and upload the
trail to the backend ("Cube"), while spending as little battery as possible by
letting the GPS chip **rest** whenever the worker is standing still.

## The three power modes

`LocationModeManager` switches the CLLocationManager between three profiles:

| Mode  | When                          | desiredAccuracy            | distanceFilter |
|-------|-------------------------------|----------------------------|----------------|
| FULL  | walking / stationary-but-awake| Best                       | **5 m**        |
| DRIVE | motion sensor says automotive | BestForNavigation          | none           |
| REST  | confirmed stationary          | HundredMeters (~100 m)     | **50 m**       |

`wakeDistance = 50 m` (used by the backup wake, below).

Why these matter:
- **FULL filter = 5 m** is the key battery lever. A stationary worker doesn't move
  5 m, so iOS stops delivering fixes → the chip goes quiet → REST can trigger.
  (If this were `none`, iOS fires ~1 fix/sec even on a desk and REST never happens.)
- **REST** drops accuracy/filter so the chip sips power until the worker moves.

## How it decides the mode

1. **Motion sensor (`CMMotionActivityManager`)** is the primary signal:
   - walking/running/cycling/automotive (confident) → `isDeviceMoving = true`;
     if it was resting, **wake to FULL** (or DRIVE if automotive).
   - stationary (confident) → `isDeviceMoving = false`.
   - If Motion permission is denied / unavailable, we fall back to the location
     rules below only.

2. **No-movement timer (120 s)** is what puts it to REST:
   - A repeating 120 s timer calls `enterRestMode()`.
   - `enterRestMode()` only actually rests if the motion sensor says we're NOT
     moving (`guard !isDeviceMoving`). So it can't false-rest mid-walk.
   - Because FULL uses a 5 m filter, a still worker produces no fixes, so the
     timer is allowed to run out and REST kicks in.

3. **Waking from REST** happens ONLY on real movement (never on "a fix arrived"):
   - Motion sensor detects movement → `wake()`.
   - Backup wake (`applyBackupWake`): a fix lands more than `max(accuracy, 50 m)`
     from the previous fix → `wake()`. This is the fallback when Motion is denied.

4. **Foreground does NOT reset the mode.** `startUpdateLocation()` is guarded by
   an `isTracking` flag, so re-entry (e.g. `applicationDidBecomeActive`) re-checks
   permissions but does not re-run `gpsPower.start()` — REST is preserved across
   app foregrounds instead of being yanked back to FULL.

5. **Stationary presence point.** While resting, the 120 s timer drops one
   "presence" point (last known coords, fresh timestamp) roughly every 6 min
   (every 3rd tick) so a long stop still records that the worker was on-site —
   otherwise `saveBucket` records nothing when `distance == 0`. Logged as
   `SAVE … note:"presence"`, mode `REST`.

## The save filter gates (which fixes get stored)

Every accepted fix runs through `LocationFilterPipeline` before being saved to
Core Data. A fix is **rejected** if:
- **Age**: older than 20 s (iOS replays stale cached fixes on launch).
- **Accuracy**: worse than the gate — 20 m normally, 50 m for a real drive
  (automotive + speed ≥ 2 m/s), relaxed to 100 m for ~10 s right after waking
  (cold-start fixes are coarse).
- **Jump**: moved > 100 m in < 5 s (physically impossible → bad fix).

If it passes, a **save bucket** decides whether to actually persist it (throttle):
- **standing**: speed ≤ 0.5 m/s, moved 0–5 m, ≥ 20 s since last save.
- **walk**: speed 0.5–2 m/s, ≥ 3 s since last save.
- **drive**: speed ≥ 2 m/s, ≥ 1 s since last save.
- **displacement safety net**: if the fix is ≥ 15 m from the last saved point,
  always save it (classified walk/drive by speed) regardless of the cadence
  buckets — guarantees a real move is never dropped. Runs after the reject gates.

## Upload / batching

Points are saved to Core Data first, then uploaded to Cube in batches:
- **Never sends ≤ 5 pending** — only uploads when more than 5 points are queued.
- **Batch size**: up to 400 points per request, **oldest-first** (FIFO) — fetches
  are sorted by `ctimestamp`, which also keeps the smoother's input chronological.
- **Triggers**: pending count > 200 during tracking; the 120 s stationary
  check-in; and whenever the network comes back online.
- The `posting_Data` flag guards against concurrent uploads. It is reset to
  "false" on launch (`LocationManager.init`) and on every foreground
  (`applicationDidBecomeActive`) so a stuck flag can't permanently block uploads.
- Net effect: when resting (≈ no new points), the >5 gate is rarely met, so the
  radio rarely wakes — that's what keeps Network/Overhead energy low.

## Logging

`GPSLogger` writes a CSV to the app's Documents dir: `gps_track_log.csv`
(columns: time,event,lat,lon,accuracy,speed,mode,note), rotated at 5 MB.
Events: START/STOP, MODE_FULL/MODE_DRIVE/MODE_REST, WAKE, FIX, SAVE/SAVED,
REJECT_AGE/REJECT_ACC/REJECT_JUMP.
Export it from the app: **More → Share GPS Log** (iOS share sheet). Feed the CSV
to `scripts/replay_csv_to_cube.py` to replay a trail.

## Key files

| File | Role |
|------|------|
| `ios/Location/LocationManager.swift` | Orchestration: starts/stops tracking, `didUpdateLocations`, no-movement timer, network monitor, upload triggers |
| `ios/GPS/LocationModeManager.swift` | The FULL/DRIVE/REST mode machine + motion sensor |
| `ios/Location/LocationFilterPipeline.swift` | Age/accuracy/jump reject gates + save buckets |
| `ios/Location/LocationPersistenceStore.swift` | Core Data persistence (`LocationDataModel`) |
| `ios/Location/LocationUploader.swift` | Batched upload to Cube (>5 gate, 400/batch) |
| `ios/GPS/GPSLogger.swift` | CSV debug log |
| `ios/Bridge/LocationBridge.swift` (+ `.m`) | JS bridge (`NativeModules.LocationBridge`) |

## Known-good baseline (compare against this if behavior regresses)

These exact values are the proven battery-friendly config (ported from the
original optimized `bbb_mobile_application`). If the app stops resting or burns
battery, check these first:

- `movingDistanceFilter = 5`  (NOT `kCLDistanceFilterNone` — that breaks REST)
- `restingAccuracy = kCLLocationAccuracyHundredMeters`, `restingDistanceFilter = 50`
- `drivingDistanceFilter = kCLDistanceFilterNone`
- No-movement timer = 120 s
- **No per-fix wake** in `didUpdateLocations` — waking is movement-driven only.

### Regressions we already hit (history)

1. `movingDistanceFilter` was set to `kCLDistanceFilterNone` → chip fired ~1/sec
   even when still → 120 s timer kept resetting → never rested. Fixed back to 5 m.
2. `didUpdateLocations` called `gpsPower.wake(reason: "new fix")` on **every fix**
   → any fix during REST instantly forced FULL. Removed; waking is now only via
   motion sensor + `applyBackupWake` (>50 m). The original app never had this line.

Symptom of either bug: log shows continuous `FIX … mode=FULL`, zero `MODE_REST`,
fix gaps always < 120 s, and Energy Report shows Location/Network/Overhead high.
