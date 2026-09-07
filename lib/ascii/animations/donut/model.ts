import type { Point3D } from "@/lib/ascii/engine/types"

const R1 = 1 // tube radius
const R2 = 2 // torus center radius
const THETA_STEP = 0.07 // around the tube
const PHI_STEP = 0.02 // around the torus

let cached: Point3D[] | null = null

/** Generates the torus point cloud once (matches the reference's R1/R2/step constants). */
export function getDonutPoints(): Point3D[] {
  if (cached) return cached

  const points: Point3D[] = []

  for (let theta = 0; theta < Math.PI * 2; theta += THETA_STEP) {
    const ct = Math.cos(theta)
    const st = Math.sin(theta)
    const tubeRadius = R2 + R1 * ct

    for (let phi = 0; phi < Math.PI * 2; phi += PHI_STEP) {
      const cp = Math.cos(phi)
      const sp = Math.sin(phi)

      points.push({
        x: tubeRadius * cp,
        y: tubeRadius * sp,
        z: R1 * st,
        nx: ct * cp,
        ny: ct * sp,
        nz: st,
      })
    }
  }

  cached = points
  return points
}
