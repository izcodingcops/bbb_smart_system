//
//  GPSKalmanSmoother.swift
//  bbb_smart_system
//

import Foundation

/// Alternative to GPSTrackSmoother: a 2D constant-velocity Kalman filter with a
/// Rauch–Tung–Striebel backward pass (a true smoother, not just a causal filter).
/// Same public shape and same payload keys as GPSTrackSmoother so it's a drop-in.
public enum GPSKalmanSmoother {

  // Time gap larger than this = a different segment; reset the filter.
  private static let gapSec: Double = 60.0

  // Assumed manoeuvring acceleration (m/s²) — drives the process noise Q.
  // 3 m/s² covers both pedestrian (~1.5 m/s² peak) and automotive (~3–4 m/s²).
  // Increase for harder-accelerating vehicles; decrease for pedestrian-only use
  // to get tighter smoothing. Changing this rescales the entire Q matrix.
  private static let sigmaAccel: Double = 3.0

  public static func smoothInPlace(_ points: inout [[String: String]]) {
    let count = points.count
    if count < 3 { return }

    var t     = [Double](repeating: 0, count: count)
    var lat   = [Double](repeating: 0, count: count)
    var lon   = [Double](repeating: 0, count: count)
    var acc   = [Double](repeating: 0, count: count)
    var valid = [Bool](repeating: false, count: count)

    // Same parsing as GPSTrackSmoother (timestamp is ms since epoch).
    for i in 0..<count {
      let d = points[i]
      guard let tsStr = d["timestamp"], let ts = Double(tsStr),
            let laStr = d["latitude"],  let la = Double(laStr),
            let loStr = d["longitude"], let lo = Double(loStr) else { continue }
      let ac = Double(d["horizontal_accuracy"] ?? "") ?? 10
      if !ts.isFinite || !la.isFinite || !lo.isFinite { continue }
      t[i]     = ts / 1000.0
      lat[i]   = la
      lon[i]   = lo
      acc[i]   = max(ac, 1)
      valid[i] = true
    }

    var idx: [Int] = []
    for i in 0..<count where valid[i] { idx.append(i) }
    if idx.count < 3 { return }

    let metersPerDegLat = 111_320.0

    // Smooth one contiguous segment (indices into `idx`), write coords back.
    func flush(_ a: Int, _ b: Int) {
      let seg = Array(idx[a...b])
      let n = seg.count
      if n < 3 { return }

      let lat0 = lat[seg[n / 2]]
      let metersPerDegLon = metersPerDegLat * cos(lat0 * .pi / 180.0)
      let latOrigin = lat[seg[0]]
      let lonOrigin = lon[seg[0]]

      var zx = [Double](repeating: 0, count: n)  // east  (m)
      var zy = [Double](repeating: 0, count: n)  // north (m)
      var r  = [Double](repeating: 0, count: n)
      var dt = [Double](repeating: 0, count: n)
      for s in 0..<n {
        let i = seg[s]
        zx[s] = (lon[i] - lonOrigin) * metersPerDegLon
        zy[s] = (lat[i] - latOrigin) * metersPerDegLat
        r[s]  = acc[i] * acc[i]
        dt[s] = s == 0 ? 0 : (t[seg[s]] - t[seg[s - 1]])
      }

      let sx = rtsSmooth(z: zx, r: r, dt: dt)
      let sy = rtsSmooth(z: zy, r: r, dt: dt)

      for s in 0..<n {
        let i = seg[s]
        let newLon = lonOrigin + sx[s] / metersPerDegLon
        let newLat = latOrigin + sy[s] / metersPerDegLat
        points[i]["longitude"] = String(format: "%.7f", newLon)
        points[i]["latitude"]  = String(format: "%.7f", newLat)
      }
    }

    // Split into segments on gaps > gapSec.
    var s = 0
    while s < idx.count {
      var e = s
      while e + 1 < idx.count && (t[idx[e + 1]] - t[idx[e]]) <= gapSec { e += 1 }
      flush(s, e)
      s = e + 1
    }
  }

  /// 1D constant-velocity Kalman forward pass + RTS backward pass.
  /// State = [position, velocity]; covariances stored flat as [p00,p01,p10,p11].
  /// Returns the smoothed position at each step. Measurement model H = [1, 0].
  private static func rtsSmooth(z: [Double], r: [Double], dt: [Double]) -> [Double] {
    let n = z.count
    if n == 0 { return [] }

    var xPost  = [[Double]](repeating: [0, 0], count: n)
    var PPost  = [[Double]](repeating: [0, 0, 0, 0], count: n)
    var xPrior = [[Double]](repeating: [0, 0], count: n)
    var PPrior = [[Double]](repeating: [0, 0, 0, 0], count: n)
    var dtUsed = [Double](repeating: 0, count: n)

    let q = sigmaAccel * sigmaAccel

    // Init: position = first measurement, velocity unknown (large covariance).
    xPost[0]  = [z[0], 0]
    PPost[0]  = [r[0], 0, 0, 1000]
    xPrior[0] = xPost[0]
    PPrior[0] = PPost[0]

    for i in 1..<n {
      let d = dt[i]
      dtUsed[i] = d

      // Predict: x = F x,  F = [[1,d],[0,1]]
      let px = xPost[i - 1]
      let xp = [px[0] + d * px[1], px[1]]

      // P_prior = F P Fᵀ + Q
      let P   = PPost[i - 1]
      let p00 = P[0], p01 = P[1], p10 = P[2], p11 = P[3]
      let fp00 = p00 + d * p10, fp01 = p01 + d * p11
      let fp10 = p10,           fp11 = p11
      let a00  = fp00 + d * fp01
      let a01  = fp01
      let a10  = fp10 + d * fp11
      let a11  = fp11
      let d2 = d * d, d3 = d2 * d, d4 = d2 * d2
      let Pp = [a00 + q * d4 / 4, a01 + q * d3 / 2,
                a10 + q * d3 / 2, a11 + q * d2]
      xPrior[i] = xp
      PPrior[i] = Pp

      // Update with z[i]:  K = P_prior Hᵀ / (H P_prior Hᵀ + R)
      let S  = Pp[0] + r[i]
      let k0 = Pp[0] / S
      let k1 = Pp[2] / S
      let y  = z[i] - xp[0]
      xPost[i] = [xp[0] + k0 * y, xp[1] + k1 * y]
      // P = (I - KH) P_prior, KH = [[k0,0],[k1,0]]
      PPost[i] = [(1 - k0) * Pp[0], (1 - k0) * Pp[1],
                  -k1 * Pp[0] + Pp[2], -k1 * Pp[1] + Pp[3]]
    }

    // RTS backward pass.
    var xs = xPost
    if n >= 2 {
      for i in stride(from: n - 2, through: 0, by: -1) {
        let d   = dtUsed[i + 1]
        let P   = PPost[i]
        let p00 = P[0], p01 = P[1], p10 = P[2], p11 = P[3]
        // P Fᵀ,  Fᵀ = [[1,0],[d,1]]
        let pf00 = p00 + p01 * d, pf01 = p01
        let pf10 = p10 + p11 * d, pf11 = p11
        // invert P_prior[i+1]
        let Pp  = PPrior[i + 1]
        let a   = Pp[0], b = Pp[1], c = Pp[2], dd = Pp[3]
        let det = a * dd - b * c
        if abs(det) < 1e-9 { continue }
        let inv00 = dd / det, inv01 = -b / det
        let inv10 = -c / det, inv11 =  a / det
        // C = P Fᵀ P_priorⁱⁿᵛ
        let c00 = pf00 * inv00 + pf01 * inv10
        let c01 = pf00 * inv01 + pf01 * inv11
        let c10 = pf10 * inv00 + pf11 * inv10
        let c11 = pf10 * inv01 + pf11 * inv11
        let dx0 = xs[i + 1][0] - xPrior[i + 1][0]
        let dx1 = xs[i + 1][1] - xPrior[i + 1][1]
        xs[i] = [xPost[i][0] + c00 * dx0 + c01 * dx1,
                 xPost[i][1] + c10 * dx0 + c11 * dx1]
      }
    }

    var out = [Double](repeating: 0, count: n)
    for i in 0..<n { out[i] = xs[i][0] }
    return out
  }
}
