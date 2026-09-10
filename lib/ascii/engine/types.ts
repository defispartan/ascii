export interface Point3D {
  x: number
  y: number
  z: number
  nx: number
  ny: number
  nz: number
  /** Index into the animation's color palette. Defaults to 0 (the primary color) when omitted. */
  colorIndex?: number
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
  /** Whether depth foreshortens the projection. Defaults to true, the usual
   * look for a solid 3D body. Set false for a flat cutout, whose depth is an
   * artifact of how it is rotated rather than real thickness: under
   * perspective its size pulses over a revolution - widest face-on, where
   * every point shares one depth, and smallest edge-on - which reads as the
   * shape breathing instead of turning. */
  perspective?: boolean
}

export interface RotationSpeed {
  x: number
  y: number
  z: number
}
