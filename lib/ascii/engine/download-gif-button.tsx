"use client"

import { useEffect, useRef, useState } from "react"
import { Download, Loader2 } from "lucide-react"

import { fitScaleToFill, loopFrameCount, renderColoredFrames } from "./render"
import { downloadBlob, exportAsciiGif } from "./gif-export"
import type { Point3D, RenderConfig, RotationSpeed } from "./types"

interface DownloadGifButtonProps {
  points: Point3D[]
  renderOptions: Omit<RenderConfig, "width" | "height">
  rotationSpeed: RotationSpeed
  initialRotation: RotationSpeed
  filename: string
  /** Palette of text colors, indexed by each point's `colorIndex`. Defaults to a single white entry. */
  colors?: string[]
}

interface AspectOption {
  label: string
  ratio: number
}

// 1:1 (square) and 1.91:1 (the standard Facebook/LinkedIn/X link-preview
// ratio) - the two shapes that actually render well as social posts.
const ASPECT_OPTIONS: AspectOption[] = [
  { label: "1:1", ratio: 1 },
  { label: "1.91:1", ratio: 1.91 },
]

// Fixed character grid the GIF is rendered at, independent of whatever size
// the viewer's window happens to be, so exports are consistent no matter
// where the download button is clicked from. Rows are tall relative to cols
// (beyond what the monospace glyph ratio alone would give) so the rendered
// content comes closer to filling a square export instead of leaving a big
// letterboxed gap above and below it.
const EXPORT_COLS = 110
const EXPORT_ROWS = 54
const EXPORT_FONT_SIZE = 15
// How much of the export grid the animation should occupy at its widest
// point over a full rotation - the live `scale` each animation defines is
// tuned for how it looks on screen, not for filling a downloaded GIF, so
// export re-derives its own scale from this instead of reusing that value.
const TARGET_FILL = 0.92
const LINE_HEIGHT = 1.15
const DEFAULT_COLORS = ["#ffffff"]
const BACKGROUND_COLOR = "#111111"
const FPS = 20
// Canvas's 2D context can't resolve CSS custom properties (var(--font-mono)),
// so GIF export uses a plain monospace stack instead of the page's webfont -
// visually indistinguishable for a fixed-width character grid.
const FONT_FAMILY = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"

export function DownloadGifButton({
  points,
  renderOptions,
  rotationSpeed,
  initialRotation,
  filename,
  colors = DEFAULT_COLORS,
}: DownloadGifButtonProps) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [open])

  async function handleSelect(aspectRatio: number) {
    if (pending) return
    setOpen(false)
    setPending(true)
    try {
      const baseConfig: RenderConfig = { ...renderOptions, width: EXPORT_COLS, height: EXPORT_ROWS }
      const frameCount = loopFrameCount(rotationSpeed)
      const fittedScale = fitScaleToFill(points, baseConfig, rotationSpeed, initialRotation, frameCount, TARGET_FILL)
      const config: RenderConfig = { ...baseConfig, scale: fittedScale }
      const frames = renderColoredFrames(points, config, rotationSpeed, initialRotation, frameCount)
      const blob = await exportAsciiGif({
        frames,
        fontSize: EXPORT_FONT_SIZE,
        lineHeight: LINE_HEIGHT,
        fontFamily: FONT_FAMILY,
        colors,
        backgroundColor: BACKGROUND_COLOR,
        fps: FPS,
        aspectRatio,
      })
      downloadBlob(blob, `${filename}.gif`)
    } finally {
      setPending(false)
    }
  }

  return (
    <div ref={rootRef} className="fixed top-4 right-4 z-10 flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        aria-label="Download GIF"
        title="Download GIF"
        className="text-white/60 transition-colors hover:text-white disabled:opacity-50"
      >
        {pending ? <Loader2 className="size-5 animate-spin" /> : <Download className="size-5" />}
      </button>
      {open && (
        <div className="flex flex-col overflow-hidden rounded-md border border-white/10 bg-[#111111]">
          {ASPECT_OPTIONS.map(({ label, ratio }) => (
            <button
              key={label}
              type="button"
              onClick={() => handleSelect(ratio)}
              className="px-3 py-1.5 text-left font-mono text-xs whitespace-nowrap text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
