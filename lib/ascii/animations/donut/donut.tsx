"use client"

import { useMemo } from "react"

import { AsciiStage } from "@/lib/ascii/engine/ascii-stage"
import type { AnimationMode } from "@/lib/ascii/engine/use-char-grid-size"
import type { RenderConfig, RotationSpeed } from "@/lib/ascii/engine/types"

import { getDonutPoints } from "./model"

const RAMP = ".,-~:;=!*#$@"
const LIGHT_DIR: readonly [number, number, number] = [0, 0.7071, -0.7071]
const ROTATION_SPEED: RotationSpeed = { x: 0.07, y: 0, z: 0.03 }

export function Donut({ mode = "preview" }: { mode?: AnimationMode }) {
  const points = useMemo(() => getDonutPoints(), [])
  const renderOptions: Omit<RenderConfig, "width" | "height"> = useMemo(
    () => ({ scale: 1.7, distance: 5, ramp: RAMP, lightDir: LIGHT_DIR }),
    []
  )

  return (
    <AsciiStage
      points={points}
      mode={mode}
      rotationSpeed={ROTATION_SPEED}
      renderOptions={renderOptions}
      filename="donut"
    />
  )
}
