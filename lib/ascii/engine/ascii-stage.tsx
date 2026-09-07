"use client"

import { Fragment, useMemo, useRef, type ReactNode } from "react"

import { DownloadGifButton } from "./download-gif-button"
import type { RenderedFrame } from "./render"
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
  /** Palette of text colors, indexed by each point's `colorIndex`. Defaults to a single white entry. */
  colors?: string[]
}

const ZERO_ROTATION: RotationSpeed = { x: 0, y: 0, z: 0 }
const DEFAULT_COLORS = ["#ffffff"]

/** Splits a rendered frame into per-line runs of same-color characters, so each row is a handful of spans instead of one per cell. */
function renderLines(frame: RenderedFrame, colors: string[]): ReactNode[] {
  const { width, height, chars, colorIndex } = frame
  if (width === 0 || height === 0) return []

  const lines: ReactNode[] = []
  for (let y = 0; y < height; y++) {
    const rowStart = y * width
    let runStart = 0
    let runColor = colorIndex[rowStart]
    for (let x = 1; x <= width; x++) {
      const atEnd = x === width
      if (!atEnd && colorIndex[rowStart + x] === runColor) continue
      const text = chars.slice(rowStart + runStart, rowStart + x).join("")
      lines.push(
        <span key={`${y}-${runStart}`} style={{ color: colors[runColor] ?? colors[0] }}>
          {text}
        </span>
      )
      if (!atEnd) {
        runStart = x
        runColor = colorIndex[rowStart + x]
      }
    }
    if (y < height - 1) lines.push(<Fragment key={`${y}-nl`}>{"\n"}</Fragment>)
  }
  return lines
}

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
  colors = DEFAULT_COLORS,
}: AsciiStageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { width, height, fontSize } = useCharGridSize(mode, containerRef)

  const config: RenderConfig = useMemo(
    () => ({ ...renderOptions, width, height }),
    [renderOptions, width, height]
  )

  const frame = useAsciiAnimation({ points, config, rotationSpeed, initialRotation })
  const lines = useMemo(() => renderLines(frame, colors), [frame, colors])

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full items-center justify-center overflow-hidden"
    >
      <pre
        className="m-0 whitespace-pre select-none"
        style={{ fontSize, lineHeight: 1.15, fontFamily: "var(--font-mono, monospace)" }}
      >
        {lines}
      </pre>
      {mode === "fullscreen" && (
        <DownloadGifButton
          points={points}
          renderOptions={renderOptions}
          rotationSpeed={rotationSpeed}
          initialRotation={initialRotation}
          filename={filename}
          colors={colors}
        />
      )}
    </div>
  )
}
