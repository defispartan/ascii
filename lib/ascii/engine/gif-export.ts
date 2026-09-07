import { GIFEncoder } from "gifenc"

import type { RenderedFrame } from "./render"

export interface AsciiGifOptions {
  frames: RenderedFrame[]
  fontSize: number
  lineHeight: number
  fontFamily: string
  /** Palette of text colors, indexed by each frame cell's color index. */
  colors: string[]
  backgroundColor: string
  fps: number
  /** Output canvas width / height. The rendered animation is never stretched to
   * reach it - the canvas is padded with `backgroundColor` on whichever axis
   * the target ratio adds space to. */
  aspectRatio: number
}

type RGB = [number, number, number]

// Blend steps sampled between the background and each foreground color
// (excluding the shared t=0 step, which is just the background itself) -
// enough to keep anti-aliased glyph edges smooth without bloating the palette.
const BLEND_STEPS = 16

function parseColor(color: string): RGB {
  const ctx = document.createElement("canvas").getContext("2d")!
  ctx.fillStyle = color
  const normalized = ctx.fillStyle // browser resolves to "#rrggbb"
  const r = parseInt(normalized.slice(1, 3), 16)
  const g = parseInt(normalized.slice(3, 5), 16)
  const b = parseInt(normalized.slice(5, 7), 16)
  return [r, g, b]
}

/**
 * Builds a palette of background-to-foreground blends for every color in the
 * palette, sharing a single entry (index 0) for pure background - since every
 * color's own t=0 step is identical to it.
 */
function buildPalette(bg: RGB, colors: RGB[]): number[][] {
  const palette: number[][] = [[bg[0], bg[1], bg[2]]]
  for (const fg of colors) {
    for (let i = 1; i < BLEND_STEPS; i++) {
      const t = i / (BLEND_STEPS - 1)
      palette.push([
        Math.round(bg[0] + (fg[0] - bg[0]) * t),
        Math.round(bg[1] + (fg[1] - bg[1]) * t),
        Math.round(bg[2] + (fg[2] - bg[2]) * t),
      ])
    }
  }
  return palette
}

/**
 * Maps each pixel to a palette index. Glyphs of different colors occupy
 * disjoint regions of the canvas, anti-aliased only against the background -
 * so for each candidate foreground color, the pixel's blend factor `t` is
 * read off by projecting it onto that color's background-to-foreground line,
 * and whichever candidate leaves the smallest residual wins.
 */
function indexFrame(rgba: Uint8ClampedArray, bg: RGB, colors: RGB[]): Uint8Array {
  const pixelCount = rgba.length / 4
  const out = new Uint8Array(pixelCount)

  const deltas = colors.map((fg): RGB => [fg[0] - bg[0], fg[1] - bg[1], fg[2] - bg[2]])
  const denoms = deltas.map(([dx, dy, dz]) => dx * dx + dy * dy + dz * dz || 1)

  for (let i = 0; i < pixelCount; i++) {
    const r = rgba[i * 4]
    const g = rgba[i * 4 + 1]
    const b = rgba[i * 4 + 2]
    const dr = r - bg[0]
    const dg = g - bg[1]
    const db = b - bg[2]

    let bestIndex = 0
    let bestResidual = dr * dr + dg * dg + db * db // candidate: pure background (t=0)

    for (let c = 0; c < colors.length; c++) {
      const [dx, dy, dz] = deltas[c]
      let t = (dr * dx + dg * dy + db * dz) / denoms[c]
      if (t < 0) t = 0
      else if (t > 1) t = 1

      const px = bg[0] + dx * t
      const py = bg[1] + dy * t
      const pz = bg[2] + dz * t
      const rr = r - px
      const rg = g - py
      const rb = b - pz
      const residual = rr * rr + rg * rg + rb * rb

      if (residual < bestResidual) {
        bestResidual = residual
        const step = Math.round(t * (BLEND_STEPS - 1))
        bestIndex = step === 0 ? 0 : 1 + c * (BLEND_STEPS - 1) + (step - 1)
      }
    }

    out[i] = bestIndex
  }

  return out
}

/** Renders ASCII frames onto an offscreen canvas and encodes them as a looping GIF. */
export async function exportAsciiGif({
  frames,
  fontSize,
  lineHeight,
  fontFamily,
  colors,
  backgroundColor,
  fps,
  aspectRatio,
}: AsciiGifOptions): Promise<Blob> {
  const cols = frames[0]?.width ?? 0
  const rows = frames[0]?.height ?? 0

  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!
  ctx.font = `${fontSize}px ${fontFamily}`
  const charWidth = ctx.measureText("0").width
  const lineHeightPx = fontSize * lineHeight

  const contentWidth = Math.ceil(charWidth * cols)
  const contentHeight = Math.ceil(lineHeightPx * rows)
  const contentAspect = contentWidth / contentHeight

  // "Contain" the unstretched content inside the target aspect ratio: grow
  // whichever axis the target ratio needs more of, and center the content in
  // the extra space rather than scaling it.
  const canvasWidth = aspectRatio > contentAspect ? Math.round(contentHeight * aspectRatio) : contentWidth
  const canvasHeight = aspectRatio > contentAspect ? contentHeight : Math.round(contentWidth / aspectRatio)
  const offsetX = Math.round((canvasWidth - contentWidth) / 2)
  const offsetY = Math.round((canvasHeight - contentHeight) / 2)

  canvas.width = canvasWidth
  canvas.height = canvasHeight

  const bg = parseColor(backgroundColor)
  const fgColors = colors.map(parseColor)
  const palette = buildPalette(bg, fgColors)
  const encoder = GIFEncoder()
  const delay = 1000 / fps

  for (let i = 0; i < frames.length; i++) {
    const { width, height, chars, colorIndex } = frames[i]

    ctx.font = `${fontSize}px ${fontFamily}`
    ctx.textBaseline = "top"
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    for (let y = 0; y < height; y++) {
      const rowStart = y * width
      let runStart = 0
      let runColor = colorIndex[rowStart]
      for (let x = 1; x <= width; x++) {
        const atEnd = x === width
        if (!atEnd && colorIndex[rowStart + x] === runColor) continue

        const text = chars.slice(rowStart + runStart, rowStart + x).join("")
        if (text.trim().length > 0) {
          ctx.fillStyle = colors[runColor] ?? colors[0]
          ctx.fillText(text, offsetX + runStart * charWidth, offsetY + y * lineHeightPx)
        }

        if (!atEnd) {
          runStart = x
          runColor = colorIndex[rowStart + x]
        }
      }
    }

    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const indexed = indexFrame(data, bg, fgColors)

    encoder.writeFrame(indexed, canvas.width, canvas.height, {
      palette: i === 0 ? palette : undefined,
      first: i === 0,
      delay,
      repeat: 0,
    })
  }

  encoder.finish()
  const bytes = encoder.bytes()
  return new Blob([bytes.buffer as ArrayBuffer], { type: "image/gif" })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
