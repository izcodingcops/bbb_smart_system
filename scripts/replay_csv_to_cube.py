#!/usr/bin/env python3
"""
Replay GPS fixes from gps_track_log.csv to the cube endpoint.

One-off recovery tool: pulls FIX rows that were captured by TrackingLogger
but never reached the upload queue (because of the missing first-fix
guard), reshapes them into the same JSON payload LocationUploader.kt
posts, and sends them in batches of 400.

Usage:
    ./replay_csv_to_cube.py \\
        --csv ~/Downloads/gps_track_log.csv \\
        --cube-url https://your.cube.endpoint/... \\
        --session-id 3848884 \\
        --shift-id 1 \\
        --user-id 27612 \\
        --device-id lake \\
        --device-name "POCO C75" \\
        [--walking-only] \\
        [--smooth] \\
        [--dry-run]

By default ALL FIX rows in the CSV are posted. --walking-only restricts
to fixes that fall between an ActivityRecognition "WALKING enter" (type=0)
and "WALKING exit" (type=1) transition.

--smooth applies the same Gaussian + inverse-variance smoothing the
production BatchSmoother uses (window 8s, sigma 4s). Off by default so
you can see raw chip output on the map first.

--dry-run prints the payloads to stdout and skips the HTTP POST.
"""

import argparse
import csv
import json
import math
import sys
from datetime import datetime, timezone
from typing import List, Dict, Optional
from urllib import request, error

BATCH_SIZE = 400


def parse_ts(s: str) -> Optional[float]:
    """CSV time column → unix seconds (local-tz-aware)."""
    try:
        # Format: "2026-06-18 18:00:30.998"
        return datetime.strptime(s, "%Y-%m-%d %H:%M:%S.%f").timestamp()
    except ValueError:
        return None


def iso_utc(ts_ms: str) -> str:
    """ms-since-epoch string → 'YYYY-MM-DDTHH:MM:SS' UTC (matches uploader format)."""
    try:
        secs = int(ts_ms[:10])
        return datetime.fromtimestamp(secs, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")
    except Exception:
        return ""


def load_fixes(csv_path: str, walking_only: bool) -> List[Dict]:
    fixes = []
    walking = False
    with open(csv_path, newline='', encoding='utf-8', errors='replace') as f:
        reader = csv.reader(f)
        next(reader, None)  # header
        for row in reader:
            if len(row) < 8:
                continue
            time_str, event, lat, lon, acc, speed, mode, note = row[:8]
            if event == "INFO":
                # Watch for ActivityRecognition transitions; activity 7 = WALKING.
                if "transition activity=7 type=0" in note:
                    walking = True
                elif "transition activity=7 type=1" in note:
                    walking = False
                continue
            if event != "FIX":
                continue
            if walking_only and not walking:
                continue
            ts_sec = parse_ts(time_str)
            if ts_sec is None:
                continue
            ts_ms = str(int(ts_sec * 1000))
            fixes.append({
                "latitude": lat,
                "longitude": lon,
                "timestamp": ts_ms,
                "horizontal_accuracy": acc,
                "online_or_offline": "online",
                "log_created_date": iso_utc(ts_ms),
            })
    return fixes


def smooth(batch: List[Dict]) -> None:
    """In-place Gaussian + inverse-variance smoothing (port of BatchSmoother.kt)."""
    n = len(batch)
    if n < 3:
        return
    WINDOW = 8.0
    SIGMA = 4.0
    GAP = 60.0
    two_sigma_sq = 2.0 * SIGMA * SIGMA

    ts = [float(r["timestamp"]) / 1000.0 for r in batch]
    lats = [float(r["latitude"]) for r in batch]
    lons = [float(r["longitude"]) for r in batch]
    accs = [max(float(r.get("horizontal_accuracy") or 10.0), 1.0) for r in batch]
    out_lat = lats[:]
    out_lon = lons[:]

    for i in range(n):
        wsum = lat_acc = lon_acc = 0.0
        j = i
        while j >= 0:
            dt = ts[i] - ts[j]
            if dt > WINDOW:
                break
            if j < i and ts[j + 1] - ts[j] > GAP:
                break
            w = math.exp(-(dt * dt) / two_sigma_sq) / (accs[j] * accs[j])
            wsum += w
            lat_acc += w * lats[j]
            lon_acc += w * lons[j]
            j -= 1
        k = i + 1
        while k < n:
            dt = ts[k] - ts[i]
            if dt > WINDOW:
                break
            if ts[k] - ts[k - 1] > GAP:
                break
            w = math.exp(-(dt * dt) / two_sigma_sq) / (accs[k] * accs[k])
            wsum += w
            lat_acc += w * lats[k]
            lon_acc += w * lons[k]
            k += 1
        if wsum > 0:
            out_lat[i] = lat_acc / wsum
            out_lon[i] = lon_acc / wsum

    for i in range(n):
        batch[i]["latitude"] = f"{out_lat[i]:.7f}"
        batch[i]["longitude"] = f"{out_lon[i]:.7f}"


def post_batch(url: str, payload: Dict, dry_run: bool) -> bool:
    body = json.dumps(payload).encode("utf-8")
    if dry_run:
        print(f"[dry-run] would POST {len(payload['data'])} rows to {url}")
        return True
    req = request.Request(
        url, data=body,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )
    try:
        with request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8", "replace")
            print(f"  HTTP {resp.status} — {raw[:200]}")
            return 200 <= resp.status < 300
    except error.HTTPError as e:
        print(f"  HTTP {e.code} — {e.read().decode('utf-8', 'replace')[:200]}")
        return False
    except Exception as e:
        print(f"  network error: {e}")
        return False


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--csv", required=True)
    p.add_argument("--cube-url", required=True)
    p.add_argument("--session-id", required=True)
    p.add_argument("--shift-id", required=True)
    p.add_argument("--user-id", required=True)
    p.add_argument("--device-id", default="")
    p.add_argument("--device-name", default="")
    p.add_argument("--device-type", default="android")
    p.add_argument("--walking-only", action="store_true",
                   help="only include fixes inside an ActivityRecognition WALKING window")
    p.add_argument("--smooth", action="store_true",
                   help="apply the same smoothing the production uploader uses")
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()

    fixes = load_fixes(args.csv, args.walking_only)
    print(f"loaded {len(fixes)} fixes from {args.csv}"
          + (" (walking-only)" if args.walking_only else ""))
    if not fixes:
        return 0

    total_ok = 0
    for i in range(0, len(fixes), BATCH_SIZE):
        chunk = fixes[i:i + BATCH_SIZE]
        if args.smooth:
            smooth(chunk)
        payload = {
            "data": chunk,
            "sessionId": args.session_id,
            "deviceId": args.device_id,
            "deviceType": args.device_type,
            "deviceName": args.device_name,
            "shiftId": args.shift_id,
            "user_id": args.user_id,
        }
        print(f"batch {i // BATCH_SIZE + 1}: posting {len(chunk)} rows…")
        if post_batch(args.cube_url, payload, args.dry_run):
            total_ok += len(chunk)
        else:
            print("aborting on first failure")
            break

    print(f"done — {total_ok}/{len(fixes)} fixes uploaded")
    return 0 if total_ok == len(fixes) else 1


if __name__ == "__main__":
    sys.exit(main())
