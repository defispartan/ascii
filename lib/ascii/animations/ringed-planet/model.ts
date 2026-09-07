import type { Point3D } from "@/lib/ascii/engine/types"

const PLANET_RADIUS = 1.4
const THETA_STEP = 0.05 // latitude
const PHI_STEP = 0.05 // longitude

const RING_INNER = 2.1
const RING_OUTER = 3.4
const RING_ANGLE_STEP = 0.025
const RING_RADIAL_STEP = 0.08

let cached: Point3D[] | null = null

function addPlanet(points: Point3D[]) {
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
        x: PLANET_RADIUS * nx,
        y: PLANET_RADIUS * ny,
        z: PLANET_RADIUS * nz,
        nx,
        ny,
        nz,
      })
    }
  }
}

function addRing(points: Point3D[]) {
  // A flat annulus sampled on both faces, so the underside shades correctly
  // once the tilt turns it toward the light.
  for (let r = RING_INNER; r <= RING_OUTER; r += RING_RADIAL_STEP) {
    for (let phi = 0; phi < Math.PI * 2; phi += RING_ANGLE_STEP) {
      const x = r * Math.cos(phi)
      const z = r * Math.sin(phi)
      points.push({ x, y: 0, z, nx: 0, ny: 1, nz: 0 })
      points.push({ x, y: 0, z, nx: 0, ny: -1, nz: 0 })
    }
  }
}

/** Generates a ringed planet: a latitude/longitude sphere plus a tilted flat ring. */
export function getRingedPlanetPoints(): Point3D[] {
  if (cached) return cached

  const points: Point3D[] = []
  addPlanet(points)
  addRing(points)

  cached = points
  return points
}
