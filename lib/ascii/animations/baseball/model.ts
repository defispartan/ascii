import type { Point3D } from "@/lib/ascii/engine/types"

const BALL_RADIUS = 1.4
const THETA_STEP = 0.05 // latitude
const PHI_STEP = 0.05 // longitude

// The seam sits marginally outside the ball's surface so it always wins the
// per-pixel depth test against body points at the same angular position,
// instead of flickering against them.
const SEAM_RADIUS = BALL_RADIUS * 1.01
const SEAM_STEP = 0.01
// How far the seam swings from the equator, in radians - kept well short of
// the poles (a tighter swing than a first pass at this) so the turnarounds
// stay wide, rounded horseshoe bends instead of narrowing toward a point as
// they approach the pole's shrinking latitude circle.
const SEAM_AMPLITUDE = 1.0
// Two full swings per revolution in longitude, the shape that makes one
// closed curve read as the baseball's interlocking figure-eight seam.
const SEAM_WAVES = 2
// Lateral offsets applied perpendicular to the curve's own tangent (see
// `addSeam`), so the stitching reads as a constant-width band a few
// characters wide - rather than offsetting latitude directly, which looks
// fine at the turnarounds but pinches to zero width along the steep middle
// stretch of the curve, where latitude offset runs nearly parallel to it.
const SEAM_THICKNESS_OFFSETS = [-0.05, -0.025, 0, 0.025, 0.05]

const BODY_COLOR = 0
const SEAM_COLOR = 1

let cached: Point3D[] | null = null

function addBody(points: Point3D[]) {
  for (let theta = 0; theta < Math.PI; theta += THETA_STEP) {
    const st = Math.sin(theta)
    const ct = Math.cos(theta)
    for (let phi = 0; phi < Math.PI * 2; phi += PHI_STEP) {
      const sp = Math.sin(phi)
      const cp = Math.cos(phi)
      const nx = st * cp
      const ny = ct
      const nz = st * sp
      points.push({
        x: BALL_RADIUS * nx,
        y: BALL_RADIUS * ny,
        z: BALL_RADIUS * nz,
        nx,
        ny,
        nz,
        colorIndex: BODY_COLOR,
      })
    }
  }
}

function addSeam(points: Point3D[]) {
  // Built in the seam's own polar frame (pole along x) rather than the ball's
  // spin axis (y) - so as the ball spins around y, the seam's two turning
  // points sweep from side to face-on instead of sitting still at the poles.
  for (let phi = 0; phi < Math.PI * 2; phi += SEAM_STEP) {
    const theta = Math.PI / 2 + SEAM_AMPLITUDE * Math.sin(SEAM_WAVES * phi)
    // d(theta)/d(phi), needed to get the curve's actual tangent direction.
    const thetaPrime = SEAM_AMPLITUDE * SEAM_WAVES * Math.cos(SEAM_WAVES * phi)
    const st = Math.sin(theta)
    const ct = Math.cos(theta)
    const sp = Math.sin(phi)
    const cp = Math.cos(phi)

    // The curve's point on the unit sphere - which, being on the unit
    // sphere, doubles as the local surface normal.
    const px = ct
    const py = st * cp
    const pz = st * sp

    // d/d(phi) of (px, py, pz) above, by the chain and product rules.
    const tx = -st * thetaPrime
    const ty = ct * cp * thetaPrime - st * sp
    const tz = ct * sp * thetaPrime + st * cp
    const tLen = Math.sqrt(tx * tx + ty * ty + tz * tz) || 1
    const utx = tx / tLen
    const uty = ty / tLen
    const utz = tz / tLen

    // The tangent-plane direction perpendicular to travel (surface normal
    // cross tangent) - offsetting along this, rather than along theta
    // directly, keeps the seam's width constant along its whole length,
    // including through the turnarounds, instead of collapsing to zero
    // wherever the raw theta offset happens to run parallel to the curve.
    let bx = py * utz - pz * uty
    let by = pz * utx - px * utz
    let bz = px * uty - py * utx
    const bLen = Math.sqrt(bx * bx + by * by + bz * bz) || 1
    bx /= bLen
    by /= bLen
    bz /= bLen

    for (const offset of SEAM_THICKNESS_OFFSETS) {
      const ox = px + offset * bx
      const oy = py + offset * by
      const oz = pz + offset * bz
      const len = Math.sqrt(ox * ox + oy * oy + oz * oz) || 1
      const nx = ox / len
      const ny = oy / len
      const nz = oz / len
      points.push({
        x: SEAM_RADIUS * nx,
        y: SEAM_RADIUS * ny,
        z: SEAM_RADIUS * nz,
        nx,
        ny,
        nz,
        colorIndex: SEAM_COLOR,
      })
    }
  }
}

/** Generates a baseball: a latitude/longitude sphere with a red stitched seam curve. */
export function getBaseballPoints(): Point3D[] {
  if (cached) return cached

  const points: Point3D[] = []
  addBody(points)
  addSeam(points)

  cached = points
  return points
}
