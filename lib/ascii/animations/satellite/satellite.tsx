"use client"

import { useMemo } from "react"

import { AsciiStage } from "@/lib/ascii/engine/ascii-stage"
import type { AnimationMode } from "@/lib/ascii/engine/use-char-grid-size"
import type { RenderConfig, RotationSpeed } from "@/lib/ascii/engine/types"

import { getSatellitePoints } from "./model"

const RAMP = ".,-~:;=!*#$@"
const LIGHT_DIR: readonly [number, number, number] = [-0.2, 0.5, 0.85]
// A gentle two-axis tumble - the offset antenna makes the full rotation
// unmistakable instead of just repeating every half turn.
const ROTATION_SPEED: RotationSpeed = { x: 0.015, y: 0.05, z: 0 }
const INITIAL_ROTATION: RotationSpeed = { x: 0.3, y: 0, z: 0.1 }
// Terminal green.
const COLOR = "#39ff14"

export function Satellite({ mode = "preview" }: { mode?: AnimationMode }) {
  const points = useMemo(() => getSatellitePoints(), [])
  const renderOptions: Omit<RenderConfig, "width" | "height"> = useMemo(
    () => ({ scale: 1.9, distance: 6, ramp: RAMP, lightDir: LIGHT_DIR, ambient: 0.15 }),
    []
  )

  return (
    <AsciiStage
      points={points}
      mode={mode}
      rotationSpeed={ROTATION_SPEED}
      initialRotation={INITIAL_ROTATION}
      renderOptions={renderOptions}
      filename="satellite"
      color={COLOR}
    />
  )
}
