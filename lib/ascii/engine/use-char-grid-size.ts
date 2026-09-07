"use client"

import { useEffect, useState, type RefObject } from "react"

export type AnimationMode = "preview" | "fullscreen"

export interface CharGridSize {
  width: number
  height: number
  fontSize: number
}

// Monospace glyphs are taller than they are wide - these ratios convert a
// pixel container size into a character grid that fills it without gaps.
const CHAR_WIDTH_RATIO = 0.6
const CHAR_HEIGHT_RATIO = 1.15

// Font size is fixed per mode (not derived from container size) so glyphs
// stay individually legible - a preview tile just shows fewer of them than
// fullscreen, rather than shrinking the text to cram more in.
const FONT_SIZE: Record<AnimationMode, number> = {
  preview: 9,
  fullscreen: 15,
}

// Used for both the server render and the client's first (pre-hydration)
// render, since actual container dimensions aren't knowable on the server -
// the real size is measured client-side after mount, in the effect below.
const DEFAULT_SIZE: Record<AnimationMode, CharGridSize> = {
  preview: { width: 46, height: 26, fontSize: FONT_SIZE.preview },
  fullscreen: { width: 110, height: 46, fontSize: FONT_SIZE.fullscreen },
}

export function useCharGridSize(
  mode: AnimationMode,
  containerRef: RefObject<HTMLElement | null>
): CharGridSize {
  const [size, setSize] = useState<CharGridSize>(DEFAULT_SIZE[mode])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const fontSize = FONT_SIZE[mode]
    const charWidth = fontSize * CHAR_WIDTH_RATIO
    const charHeight = fontSize * CHAR_HEIGHT_RATIO

    function applySize(pixelWidth: number, pixelHeight: number) {
      const width = Math.max(20, Math.floor(pixelWidth / charWidth))
      const height = Math.max(12, Math.floor(pixelHeight / charHeight))
      setSize({ width, height, fontSize })
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) applySize(width, height)
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [mode, containerRef])

  return size
}
