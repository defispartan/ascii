"use client"

import { useMemo } from "react"

import { AsciiStage } from "@/lib/ascii/engine/ascii-stage"
import type { AnimationMode } from "@/lib/ascii/engine/use-char-grid-size"
import type { RenderConfig, RotationSpeed } from "@/lib/ascii/engine/types"

import { getRingedPlanetPoints } from "./model"

const RAMP = ".,-~:;=!*#$@"
const LIGHT_DIR: readonly [number, number, number] = [-0.3, 0.5, 0.8]
const ROTATION_SPEED: RotationSpeed = { x: 0, y: 0.05, z: 0 }
// Tilts the whole system on its side, like Saturn's rings as seen from Earth.
const INITIAL_ROTATION: RotationSpeed = { x: 0.45, y: 0, z: 0 }
// Terminal cyan.
const COLOR = "#00e5ff"

export function RingedPlanet({ mode = "preview" }: { mode?: AnimationMode }) {
  const points = useMemo(() => getRingedPlanetPoints(), [])
  const renderOptions: Omit<RenderConfig, "width" | "height"> = useMemo(
    () => ({ scale: 1.35, distance: 6, ramp: RAMP, lightDir: LIGHT_DIR, ambient: 0.12 }),
    []
  )

  return (
    <AsciiStage
      points={points}
      mode={mode}
      rotationSpeed={ROTATION_SPEED}
      initialRotation={INITIAL_ROTATION}
      renderOptions={renderOptions}
      filename="ringed-planet"
      color={COLOR}
    />
  )
}
