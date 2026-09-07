"use client"

import { useMemo } from "react"

import { AsciiStage } from "@/lib/ascii/engine/ascii-stage"
import type { AnimationMode } from "@/lib/ascii/engine/use-char-grid-size"
import type { RenderConfig, RotationSpeed } from "@/lib/ascii/engine/types"

import { getTurbinePoints } from "./model"

const RAMP = ".,-~:;=!*#$@"
const LIGHT_DIR: readonly [number, number, number] = [-0.2, 0.4, 0.9]
const ROTATION_SPEED: RotationSpeed = { x: 0, y: 0, z: 0.09 }
// Tilts the camera down onto the rotor so it reads as a three-quarter view
// instead of a flat, straight-on circle.
const INITIAL_ROTATION: RotationSpeed = { x: 0.5, y: 0, z: 0 }
// Terminal amber.
const COLOR = "#ffb000"

export function Turbine({ mode = "preview" }: { mode?: AnimationMode }) {
  const points = useMemo(() => getTurbinePoints(), [])
  const renderOptions: Omit<RenderConfig, "width" | "height"> = useMemo(
    () => ({ scale: 1.6, distance: 5, ramp: RAMP, lightDir: LIGHT_DIR, ambient: 0.15 }),
    []
  )

  return (
    <AsciiStage
      points={points}
      mode={mode}
      rotationSpeed={ROTATION_SPEED}
      initialRotation={INITIAL_ROTATION}
      renderOptions={renderOptions}
      filename="turbine"
      color={COLOR}
    />
  )
}
