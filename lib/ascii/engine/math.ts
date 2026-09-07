import type { Point3D, RotationSpeed } from "./types"

interface Vec3 {
  x: number
  y: number
  z: number
}

function rotateVecX(v: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return { x: v.x, y: v.y * c - v.z * s, z: v.y * s + v.z * c }
}

function rotateVecY(v: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return { x: v.x * c + v.z * s, y: v.y, z: -v.x * s + v.z * c }
}

function rotateVecZ(v: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c, z: v.z }
}

/** Rotates a point's position and normal together, in X -> Y -> Z axis order. */
export function rotatePoint(point: Point3D, angles: RotationSpeed): Point3D {
  let pos: Vec3 = { x: point.x, y: point.y, z: point.z }
  let normal: Vec3 = { x: point.nx, y: point.ny, z: point.nz }

  if (angles.x) {
    pos = rotateVecX(pos, angles.x)
    normal = rotateVecX(normal, angles.x)
  }
  if (angles.y) {
    pos = rotateVecY(pos, angles.y)
    normal = rotateVecY(normal, angles.y)
  }
  if (angles.z) {
    pos = rotateVecZ(pos, angles.z)
    normal = rotateVecZ(normal, angles.z)
  }

  return { x: pos.x, y: pos.y, z: pos.z, nx: normal.x, ny: normal.y, nz: normal.z }
}
