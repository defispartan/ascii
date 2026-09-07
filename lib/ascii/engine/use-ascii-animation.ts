"use client"

import { useEffect, useRef, useState } from "react"

import { renderColoredFrame, type RenderedFrame } from "./render"
import type { Point3D, RenderConfig, RotationSpeed } from "./types"

interface UseAsciiAnimationOptions {
  points: Point3D[]
  config: RenderConfig
  rotationSpeed: RotationSpeed
  initialRotation?: RotationSpeed
  fps?: number
}

const ZERO_ROTATION: RotationSpeed = { x: 0, y: 0, z: 0 }
const EMPTY_FRAME: RenderedFrame = { width: 0, height: 0, chars: [], colorIndex: new Uint8Array(0) }

export function useAsciiAnimation({
  points,
  config,
  rotationSpeed,
  initialRotation = ZERO_ROTATION,
  fps = 20,
}: UseAsciiAnimationOptions): RenderedFrame {
  const [frame, setFrame] = useState<RenderedFrame>(EMPTY_FRAME)
  const angleRef = useRef<RotationSpeed>(initialRotation)
  const lastTickRef = useRef(0)

  useEffect(() => {
    angleRef.current = initialRotation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points])

  useEffect(() => {
    const frameInterval = 1000 / fps
    let raf = requestAnimationFrame(tick)

    function tick(time: number) {
      raf = requestAnimationFrame(tick)
      if (time - lastTickRef.current < frameInterval) return
      lastTickRef.current = time

      angleRef.current = {
        x: angleRef.current.x + rotationSpeed.x,
        y: angleRef.current.y + rotationSpeed.y,
        z: angleRef.current.z + rotationSpeed.z,
      }

      setFrame(renderColoredFrame(points, angleRef.current, config))
    }

    return () => cancelAnimationFrame(raf)
  }, [points, config, rotationSpeed, fps])

  return frame
}
