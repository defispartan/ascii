import { rotatePoint } from "./math"
import type { Point3D, RenderConfig, RotationSpeed } from "./types"

/**
 * Rotates every point, perspective-projects it into a width x height character
 * grid, resolves occlusion with a 1/z depth buffer, and shades each visible
 * cell by the dot product of its rotated normal with the light direction -
 * the same rotate -> project -> z-buffer -> shade-by-normal technique the
 * reference donut.js uses, generalized to work over any point cloud.
 */
export function renderFrame(
  points: Point3D[],
  rotation: RotationSpeed,
  config: RenderConfig
): string {
  const { width, height, scale, distance, ramp, lightDir, ambient = 0 } = config
  const size = width * height
  const buffer = new Array<string>(size).fill(" ")
  const zbuffer = new Array<number>(size).fill(0)
  const [lx, ly, lz] = lightDir

  for (const point of points) {
    const p = rotatePoint(point, rotation)
    const ooz = 1 / (p.z + distance)

    const xp = Math.floor(width / 2 + (width / 4) * scale * ooz * p.x)
    const yp = Math.floor(height / 2 - (height / 4) * scale * ooz * p.y)

    if (xp < 0 || xp >= width || yp < 0 || yp >= height) continue

    const idx = xp + width * yp
    if (ooz <= zbuffer[idx]) continue
    zbuffer[idx] = ooz

    const luminance = p.nx * lx + p.ny * ly + p.nz * lz + ambient
    const rampIndex = Math.max(0, Math.min(ramp.length - 1, Math.floor(luminance * 8)))
    buffer[idx] = ramp[rampIndex]
  }

  const lines: string[] = []
  for (let y = 0; y < height; y++) {
    lines.push(buffer.slice(y * width, y * width + width).join(""))
  }
  return lines.join("\n")
}

/**
 * Renders a deterministic sequence of frames starting from `initialRotation`
 * and advancing by `rotationSpeed` each step - the same math the live
 * animation loop uses, replayed independently so it can be exported (e.g. to
 * a GIF) without depending on wall-clock timing.
 */
export function renderFrames(
  points: Point3D[],
  config: RenderConfig,
  rotationSpeed: RotationSpeed,
  initialRotation: RotationSpeed,
  frameCount: number
): string[] {
  const frames: string[] = []
  let rotation = initialRotation

  for (let i = 0; i < frameCount; i++) {
    frames.push(renderFrame(points, rotation, config))
    rotation = {
      x: rotation.x + rotationSpeed.x,
      y: rotation.y + rotationSpeed.y,
      z: rotation.z + rotationSpeed.z,
    }
  }

  return frames
}

/**
 * Picks a frame count that loops as seamlessly as the rotation allows: a
 * full 2*pi revolution on whichever axis is rotating fastest, clamped to a
 * range that keeps GIF export fast and the file size reasonable.
 */
export function loopFrameCount(rotationSpeed: RotationSpeed): number {
  const dominant = Math.max(Math.abs(rotationSpeed.x), Math.abs(rotationSpeed.y), Math.abs(rotationSpeed.z))
  if (dominant === 0) return 60
  return Math.min(150, Math.max(40, Math.round((Math.PI * 2) / dominant)))
}

/**
 * Finds the `scale` that makes a point cloud fill `targetFill` of its grid
 * at its widest point over a full rotation, so every animation - hand-tuned
 * or generated from a PNG - exports at a consistent, share-ready size
 * instead of whatever `scale` happens to look right live (which is
 * frequently a much smaller silhouette than the full grid). The projection
 * in `renderFrame` is linear in `scale`, so this only needs one measurement
 * pass at the current scale, not a search: fill fraction scales with `scale`
 * exactly, so `correction = target / measuredFraction` lands on target in a
 * single step.
 */
export function fitScaleToFill(
  points: Point3D[],
  config: RenderConfig,
  rotationSpeed: RotationSpeed,
  initialRotation: RotationSpeed,
  frameCount: number,
  targetFill: number
): number {
  let minCol = Infinity
  let maxCol = -Infinity
  let minRow = Infinity
  let maxRow = -Infinity
  let rotation = initialRotation

  for (let i = 0; i < frameCount; i++) {
    const lines = renderFrame(points, rotation, config).split("\n")
    for (let row = 0; row < lines.length; row++) {
      const line = lines[row]
      for (let col = 0; col < line.length; col++) {
        if (line[col] === " ") continue
        if (col < minCol) minCol = col
        if (col > maxCol) maxCol = col
        if (row < minRow) minRow = row
        if (row > maxRow) maxRow = row
      }
    }
    rotation = {
      x: rotation.x + rotationSpeed.x,
      y: rotation.y + rotationSpeed.y,
      z: rotation.z + rotationSpeed.z,
    }
  }

  if (!isFinite(minCol)) return config.scale

  const widthFraction = (maxCol - minCol + 1) / config.width
  const heightFraction = (maxRow - minRow + 1) / config.height
  const measuredFill = Math.max(widthFraction, heightFraction)
  const correction = Math.min(4, Math.max(0.25, targetFill / measuredFill))

  return config.scale * correction
}
