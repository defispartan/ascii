"use client"

import { useMemo } from "react"

import { AsciiStage } from "@/lib/ascii/engine/ascii-stage"
import type { AnimationMode } from "@/lib/ascii/engine/use-char-grid-size"
import type { RenderConfig, RotationSpeed } from "@/lib/ascii/engine/types"

import { getSpartanHeadPoints } from "./model"

const RAMP = ".,-~:;=!*#$@"
// Dominant +z so the camera-facing side of the relief is lit, biased up-left
// for a classic emboss look that reveals the bulge as it spins.
const LIGHT_DIR: readonly [number, number, number] = [-0.15, 0.2, 0.96]
const ROTATION_SPEED: RotationSpeed = { x: 0, y: 0.05, z: 0 }
// No initial tilt, so it spins level around the vertical axis - a perfect
// horizontal circle instead of a wobbly one.
const INITIAL_ROTATION: RotationSpeed = { x: 0, y: 0, z: 0 }
// Michigan State Spartan lime green.
const COLOR = "#7BBD00"

export function SpartanHead({ mode = "preview" }: { mode?: AnimationMode }) {
  const points = useMemo(() => getSpartanHeadPoints(), [])
  const renderOptions: Omit<RenderConfig, "width" | "height"> = useMemo(
    () => ({
      scale: 2.2,
      distance: 5,
      ramp: RAMP,
      lightDir: LIGHT_DIR,
      // Keeps the relief dimly visible on its unlit "back" rotation phase
      // instead of dropping to blank, since it's a single-sided surface.
      ambient: 0.22,
    }),
    []
  )

  return (
    <AsciiStage
      points={points}
      mode={mode}
      rotationSpeed={ROTATION_SPEED}
      initialRotation={INITIAL_ROTATION}
      renderOptions={renderOptions}
      filename="spartan-head"
      colors={[COLOR]}
    />
  )
}
