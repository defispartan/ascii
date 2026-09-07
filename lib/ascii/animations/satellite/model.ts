import type { Point3D } from "@/lib/ascii/engine/types"

const BODY_HALF: readonly [number, number, number] = [0.45, 0.45, 0.65] // x, y, z half-extents
const BODY_STEP = 0.09

const STRUT_GAP = 0.15
const PANEL_LENGTH = 1.7
const PANEL_HALF_HEIGHT = 0.55
const PANEL_STEP = 0.12

const ANTENNA_LENGTH = 1.3
const ANTENNA_STEP = 0.05
const ANTENNA_DIR: readonly [number, number, number] = [0.25, 0.92, 0.3] // breaks mirror symmetry
const DISH_RADIUS = 0.16
const DISH_STEP = 0.04

let cached: Point3D[] | null = null

function normalize([x, y, z]: readonly [number, number, number]): [number, number, number] {
  const len = Math.sqrt(x * x + y * y + z * z) || 1
  return [x / len, y / len, z / len]
}

/** Samples one flat rectangular face of a box, held fixed on `axis` at `value`. */
function addBoxFace(
  points: Point3D[],
  axis: 0 | 1 | 2,
  value: number,
  extentsU: number,
  extentsV: number
) {
  const normal: [number, number, number] = [0, 0, 0]
  normal[axis] = Math.sign(value)

  for (let u = -extentsU; u <= extentsU; u += BODY_STEP) {
    for (let v = -extentsV; v <= extentsV; v += BODY_STEP) {
      const p: [number, number, number] = [0, 0, 0]
      p[axis] = value
      const otherAxes = [0, 1, 2].filter((a) => a !== axis) as [number, number]
      p[otherAxes[0]] = u
      p[otherAxes[1]] = v
      points.push({ x: p[0], y: p[1], z: p[2], nx: normal[0], ny: normal[1], nz: normal[2] })
    }
  }
}

function addBody(points: Point3D[]) {
  const [hx, hy, hz] = BODY_HALF
  addBoxFace(points, 0, hx, hy, hz)
  addBoxFace(points, 0, -hx, hy, hz)
  addBoxFace(points, 1, hy, hx, hz)
  addBoxFace(points, 1, -hy, hx, hz)
  addBoxFace(points, 2, hz, hx, hy)
  addBoxFace(points, 2, -hz, hx, hy)
}

function addPanels(points: Point3D[]) {
  const [hx] = BODY_HALF
  for (const side of [1, -1]) {
    const xStart = side * (hx + STRUT_GAP)
    const xEnd = side * (hx + STRUT_GAP + PANEL_LENGTH)
    const xMin = Math.min(xStart, xEnd)
    const xMax = Math.max(xStart, xEnd)

    for (let x = xMin; x <= xMax; x += PANEL_STEP) {
      for (let y = -PANEL_HALF_HEIGHT; y <= PANEL_HALF_HEIGHT; y += PANEL_STEP) {
        points.push({ x, y, z: 0, nx: 0, ny: 0, nz: 1 })
        points.push({ x, y, z: 0, nx: 0, ny: 0, nz: -1 })
      }
    }
  }
}

function addAntenna(points: Point3D[]) {
  const [hx, hy, hz] = BODY_HALF
  const [dx, dy, dz] = normalize(ANTENNA_DIR)
  const originX = hx * 0.5
  const originY = hy
  const originZ = hz

  for (let t = 0; t <= ANTENNA_LENGTH; t += ANTENNA_STEP) {
    points.push({
      x: originX + dx * t,
      y: originY + dy * t,
      z: originZ + dz * t,
      nx: dy,
      ny: -dx,
      nz: 0,
    })
  }

  // Small flat dish at the antenna tip, facing back along the antenna direction.
  const tipX = originX + dx * ANTENNA_LENGTH
  const tipY = originY + dy * ANTENNA_LENGTH
  const tipZ = originZ + dz * ANTENNA_LENGTH
  // Cross the antenna direction with an arbitrary non-parallel reference axis
  // to build a basis (u, v) spanning the plane perpendicular to it.
  const ref: [number, number, number] = Math.abs(dy) < 0.9 ? [0, 1, 0] : [1, 0, 0]
  const [ux, uy, uz] = normalize([
    dy * ref[2] - dz * ref[1],
    dz * ref[0] - dx * ref[2],
    dx * ref[1] - dy * ref[0],
  ])
  const vx = dy * uz - dz * uy
  const vy = dz * ux - dx * uz
  const vz = dx * uy - dy * ux

  for (let r = 0; r <= DISH_RADIUS; r += DISH_STEP) {
    for (let phi = 0; phi < Math.PI * 2; phi += 0.35) {
      const cp = Math.cos(phi)
      const sp = Math.sin(phi)
      points.push({
        x: tipX + r * (cp * ux + sp * vx),
        y: tipY + r * (cp * uy + sp * vy),
        z: tipZ + r * (cp * uz + sp * vz),
        nx: -dx,
        ny: -dy,
        nz: -dz,
      })
    }
  }
}

/** Generates a satellite: a boxy body, two offset solar panels, and an antenna that breaks the mirror symmetry. */
export function getSatellitePoints(): Point3D[] {
  if (cached) return cached

  const points: Point3D[] = []
  addBody(points)
  addPanels(points)
  addAntenna(points)

  cached = points
  return points
}
