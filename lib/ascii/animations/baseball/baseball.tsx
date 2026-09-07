"use client"

import { useMemo } from "react"

import { AsciiStage } from "@/lib/ascii/engine/ascii-stage"
import type { AnimationMode } from "@/lib/ascii/engine/use-char-grid-size"
import type { RenderConfig, RotationSpeed } from "@/lib/ascii/engine/types"

import { getBaseballPoints } from "./model"

const RAMP = ".,-~:;=!*#$@"
const LIGHT_DIR: readonly [number, number, number] = [-0.3, 0.5, 0.8]
const ROTATION_SPEED: RotationSpeed = { x: 0.02, y: 0.06, z: 0 }
const INITIAL_ROTATION: RotationSpeed = { x: 0.2, y: 0, z: 0 }
// Index 0 (body) is white, index 1 (seam) is red - matching each point's `colorIndex`.
const COLORS = ["#ffffff", "#e02020"]

export function Baseball({ mode = "preview" }: { mode?: AnimationMode }) {
  const points = useMemo(() => getBaseballPoints(), [])
  const renderOptions: Omit<RenderConfig, "width" | "height"> = useMemo(
    () => ({ scale: 3.0, distance: 6, ramp: RAMP, lightDir: LIGHT_DIR, ambient: 0.15 }),
    []
  )

  return (
    <AsciiStage
      points={points}
      mode={mode}
      rotationSpeed={ROTATION_SPEED}
      initialRotation={INITIAL_ROTATION}
      renderOptions={renderOptions}
      filename="baseball"
      colors={COLORS}
    />
  )
}
