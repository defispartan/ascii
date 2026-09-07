"use client"

import { useMemo, useRef } from "react"

import { DownloadGifButton } from "./download-gif-button"
import { useAsciiAnimation } from "./use-ascii-animation"
import { useCharGridSize, type AnimationMode } from "./use-char-grid-size"
import type { Point3D, RenderConfig, RotationSpeed } from "./types"

export interface AsciiStageProps {
  points: Point3D[]
  mode?: AnimationMode
  rotationSpeed: RotationSpeed
  initialRotation?: RotationSpeed
  /** Look/shading parameters for this animation - everything but width/height/scale, which come from the container. */
  renderOptions: Omit<RenderConfig, "width" | "height">
  /** Base filename (no extension) used for the downloaded GIF. */
  filename: string
  /** Text color for the rendered characters, live and in the downloaded GIF. Defaults to white. */
  color?: string
}

const ZERO_ROTATION: RotationSpeed = { x: 0, y: 0, z: 0 }
const DEFAULT_COLOR = "#ffffff"

/**
 * Shared rendering shell for every point-cloud animation: measures its
 * container into a character grid, runs the rotation loop, and prints the
 * resulting ASCII frame. In fullscreen mode it also exposes a GIF download
 * button, since only the individual animation page (not the gallery preview
 * tile) needs one.
 */
export function AsciiStage({
  points,
  mode = "preview",
  rotationSpeed,
  initialRotation = ZERO_ROTATION,
  renderOptions,
  filename,
  color = DEFAULT_COLOR,
}: AsciiStageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { width, height, fontSize } = useCharGridSize(mode, containerRef)

  const config: RenderConfig = useMemo(
    () => ({ ...renderOptions, width, height }),
    [renderOptions, width, height]
  )

  const frame = useAsciiAnimation({ points, config, rotationSpeed, initialRotation })

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full items-center justify-center overflow-hidden"
    >
      <pre
        className="m-0 whitespace-pre select-none"
        style={{ fontSize, lineHeight: 1.15, fontFamily: "var(--font-mono, monospace)", color }}
      >
        {frame}
      </pre>
      {mode === "fullscreen" && (
        <DownloadGifButton
          points={points}
          renderOptions={renderOptions}
          rotationSpeed={rotationSpeed}
          initialRotation={initialRotation}
          filename={filename}
          color={color}
        />
      )}
    </div>
  )
}
