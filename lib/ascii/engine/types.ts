export interface Point3D {
  x: number
  y: number
  z: number
  nx: number
  ny: number
  nz: number
}

export interface RenderConfig {
  width: number
  height: number
  scale: number
  distance: number
  ramp: string
  lightDir: readonly [number, number, number]
  /** Flat brightness added before shading, so surfaces facing away from the
   * light stay dimly visible instead of dropping to blank. Defaults to 0. */
  ambient?: number
}

export interface RotationSpeed {
  x: number
  y: number
  z: number
}
