import type { Point3D } from "@/lib/ascii/engine/types"

const BLADE_COUNT = 8
const R_HUB = 0.55 // hub radius
const R_TIP = 2.3 // blade tip radius
const HALF_WIDTH_ROOT = 0.5 // tangential half-width at the hub
const HALF_WIDTH_TIP = 0.62 // tangential half-width at the tip (slight taper-out)
const PITCH = 0.55 // blade twist (radians) - gives the fan its 3D, three-quarter-visible face
const THICKNESS = 0.1 // blade half-thickness along its own twisted normal
const RADIAL_STEP = 0.045
const SPAN_STEP = 0.045

const HUB_HEIGHT = 0.7
const HUB_STEP = 0.09

const RING_RADIUS = R_TIP + 0.35
const RING_HALF_WIDTH = 0.22 // ring cross-section half-width (in the spin plane)
const RING_ANGLE_STEP = 0.03
const RING_WIDTH_STEP = 0.05

let cached: Point3D[] | null = null

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function addBlades(points: Point3D[]) {
  for (let b = 0; b < BLADE_COUNT; b++) {
    const baseAngle = (b * Math.PI * 2) / BLADE_COUNT
    const rx = Math.cos(baseAngle)
    const ry = Math.sin(baseAngle)
    // Tangential axis, twisted by PITCH toward the spin axis (z) - this is
    // what turns a flat sector into a propeller-like blade with a visible
    // face and a real surface normal instead of a knife-edge.
    const tx = -Math.sin(baseAngle) * Math.cos(PITCH)
    const ty = Math.cos(baseAngle) * Math.cos(PITCH)
    const tz = Math.sin(PITCH)
    // Thickness axis, perpendicular to both the radial and twisted-tangential axes.
    const nx = Math.sin(baseAngle) * Math.sin(PITCH)
    const ny = -Math.cos(baseAngle) * Math.sin(PITCH)
    const nz = Math.cos(PITCH)

    for (let r = R_HUB; r <= R_TIP; r += RADIAL_STEP) {
      const halfWidth = lerp(HALF_WIDTH_ROOT, HALF_WIDTH_TIP, (r - R_HUB) / (R_TIP - R_HUB))

      for (let s = -halfWidth; s <= halfWidth; s += SPAN_STEP) {
        for (const side of [1, -1]) {
          const d = side * THICKNESS
          points.push({
            x: r * rx + s * tx + d * nx,
            y: r * ry + s * ty + d * ny,
            z: s * tz + d * nz,
            nx: side * nx,
            ny: side * ny,
            nz: side * nz,
          })
        }
      }
    }
  }
}

function addHub(points: Point3D[]) {
  for (let phi = 0; phi < Math.PI * 2; phi += HUB_STEP) {
    const cx = Math.cos(phi)
    const cy = Math.sin(phi)
    for (let z = -HUB_HEIGHT / 2; z <= HUB_HEIGHT / 2; z += HUB_STEP) {
      points.push({ x: R_HUB * cx, y: R_HUB * cy, z, nx: cx, ny: cy, nz: 0 })
    }
  }
}

function addRingHousing(points: Point3D[]) {
  // A thin flattened ring just past the blade tips - suggests an outer
  // housing for depth without adding much visual noise.
  for (let phi = 0; phi < Math.PI * 2; phi += RING_ANGLE_STEP) {
    const cx = Math.cos(phi)
    const cy = Math.sin(phi)
    for (let w = -RING_HALF_WIDTH; w <= RING_HALF_WIDTH; w += RING_WIDTH_STEP) {
      const r = RING_RADIUS + w
      points.push({ x: r * cx, y: r * cy, z: 0, nx: cx, ny: cy, nz: 0 })
    }
  }
}

/** Generates a turbine rotor: a spoked hub, {@link BLADE_COUNT} twisted blades, and an outer housing ring. */
export function getTurbinePoints(): Point3D[] {
  if (cached) return cached

  const points: Point3D[] = []
  addHub(points)
  addBlades(points)
  addRingHousing(points)

  cached = points
  return points
}
