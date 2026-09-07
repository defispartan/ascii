import type { Point3D } from "./types"

export interface Heightmap {
  width: number
  height: number
  mask: number[]
  elevation: number[]
}

export interface HeightmapModelOptions {
  /** How many fine samples to generate per source cell. */
  upsample?: number
  /** How far the relief bulges toward the camera. */
  reliefDepth?: number
  /** Half-width of the point cloud along its longer axis. */
  radius?: number
  /** Exaggerates the height-field gradient that feeds the surface normal. */
  normalStrength?: number
}

const DEFAULT_OPTIONS: Required<HeightmapModelOptions> = {
  upsample: 3,
  reliefDepth: 0.8,
  radius: 2,
  normalStrength: 6,
}

function sampleBilinear(grid: number[], w: number, h: number, x: number, y: number): number {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const x1 = Math.min(w - 1, x0 + 1)
  const y1 = Math.min(h - 1, y0 + 1)
  const tx = x - x0
  const ty = y - y0

  const v00 = grid[y0 * w + x0]
  const v10 = grid[y0 * w + x1]
  const v01 = grid[y1 * w + x0]
  const v11 = grid[y1 * w + x1]

  return v00 * (1 - tx) * (1 - ty) + v10 * tx * (1 - ty) + v01 * (1 - tx) * ty + v11 * tx * ty
}

/**
 * Builds a point cloud from a silhouette + distance-to-edge heightmap: the
 * silhouette is bilinearly upsampled into a fine grid, each interior cell
 * becomes a point bulging toward the camera by its normalized edge distance,
 * and normals come from the local height-field gradient - an "embossed
 * badge" shape a distance-transform relief produces. Shared by every
 * heightmap-backed animation (hand-authored or generated from a PNG).
 */
export function createHeightmapPointCloud(
  heightmap: Heightmap,
  options: HeightmapModelOptions = {}
): Point3D[] {
  const { upsample, reliefDepth, radius, normalStrength } = { ...DEFAULT_OPTIONS, ...options }
  const { width: w0, height: h0, mask, elevation } = heightmap
  const fineW = w0 * upsample
  const fineH = h0 * upsample

  const fine = new Float32Array(fineW * fineH)
  const fineMask = new Uint8Array(fineW * fineH)

  for (let fy = 0; fy < fineH; fy++) {
    const sy = (fy / (fineH - 1)) * (h0 - 1)
    for (let fx = 0; fx < fineW; fx++) {
      const sx = (fx / (fineW - 1)) * (w0 - 1)
      const idx = fy * fineW + fx
      const m = sampleBilinear(mask, w0, h0, sx, sy)
      fineMask[idx] = m > 0.5 ? 1 : 0
      fine[idx] = fineMask[idx] ? sampleBilinear(elevation, w0, h0, sx, sy) : 0
    }
  }

  const aspect = h0 / w0
  const points: Point3D[] = []

  for (let fy = 0; fy < fineH; fy++) {
    for (let fx = 0; fx < fineW; fx++) {
      const idx = fy * fineW + fx
      if (!fineMask[idx]) continue

      const xL = fine[fx > 0 ? idx - 1 : idx]
      const xR = fine[fx < fineW - 1 ? idx + 1 : idx]
      const yU = fine[fy > 0 ? idx - fineW : idx]
      const yD = fine[fy < fineH - 1 ? idx + fineW : idx]
      const dzdx = (xR - xL) / 2
      const dzdy = (yD - yU) / 2

      const ox = (fx / fineW - 0.5) * 2 * radius
      const oy = -(fy / fineH - 0.5) * 2 * radius * aspect
      const oz = fine[idx] * reliefDepth

      let nx = -dzdx * normalStrength
      let ny = dzdy * normalStrength
      let nz = 1
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1
      nx /= len
      ny /= len
      nz /= len

      points.push({ x: ox, y: oy, z: oz, nx, ny, nz })
    }
  }

  return points
}
