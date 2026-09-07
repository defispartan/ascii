import { GIFEncoder } from "gifenc"

export interface AsciiGifOptions {
  frames: string[]
  cols: number
  rows: number
  fontSize: number
  lineHeight: number
  fontFamily: string
  textColor: string
  backgroundColor: string
  fps: number
  /** Output canvas width / height. The rendered animation is never stretched to
   * reach it - the canvas is padded with `backgroundColor` on whichever axis
   * the target ratio adds space to. */
  aspectRatio: number
}

const GRAYSCALE_STEPS = 24

function parseColor(color: string): [number, number, number] {
  const ctx = document.createElement("canvas").getContext("2d")!
  ctx.fillStyle = color
  const normalized = ctx.fillStyle // browser resolves to "#rrggbb"
  const r = parseInt(normalized.slice(1, 3), 16)
  const g = parseInt(normalized.slice(3, 5), 16)
  const b = parseInt(normalized.slice(5, 7), 16)
  return [r, g, b]
}

function buildGrayscalePalette(bg: [number, number, number], fg: [number, number, number]): number[][] {
  return Array.from({ length: GRAYSCALE_STEPS }, (_, i) => {
    const t = i / (GRAYSCALE_STEPS - 1)
    return [
      Math.round(bg[0] + (fg[0] - bg[0]) * t),
      Math.round(bg[1] + (fg[1] - bg[1]) * t),
      Math.round(bg[2] + (fg[2] - bg[2]) * t),
    ]
  })
}

/**
 * Maps each pixel straight to a palette index instead of running a generic
 * nearest-color search: every pixel here is a blend between exactly two flat
 * colors (the background fill and the text fill, blended only at glyph
 * anti-aliased edges), so the blend factor - and thus the palette index -
 * can be read directly off one channel instead of searched for.
 */
function indexFrame(rgba: Uint8ClampedArray, bg: [number, number, number], fg: [number, number, number]): Uint8Array {
  const channel = Math.abs(fg[0] - bg[0]) >= Math.abs(fg[1] - bg[1]) ? 0 : 1
  const bgC = bg[channel]
  const fgC = fg[channel]
  const denom = fgC - bgC || 1
  const pixelCount = rgba.length / 4
  const out = new Uint8Array(pixelCount)

  for (let i = 0; i < pixelCount; i++) {
    const v = rgba[i * 4 + channel]
    let t = (v - bgC) / denom
    if (t < 0) t = 0
    else if (t > 1) t = 1
    out[i] = Math.round(t * (GRAYSCALE_STEPS - 1))
  }

  return out
}

/** Renders ASCII frames onto an offscreen canvas and encodes them as a looping GIF. */
export async function exportAsciiGif({
  frames,
  cols,
  rows,
  fontSize,
  lineHeight,
  fontFamily,
  textColor,
  backgroundColor,
  fps,
  aspectRatio,
}: AsciiGifOptions): Promise<Blob> {
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
  const fg = parseColor(textColor)
  const palette = buildGrayscalePalette(bg, fg)
  const encoder = GIFEncoder()
  const delay = 1000 / fps

  for (let i = 0; i < frames.length; i++) {
    ctx.font = `${fontSize}px ${fontFamily}`
    ctx.textBaseline = "top"
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = textColor

    const lines = frames[i].split("\n")
    for (let line = 0; line < lines.length; line++) {
      ctx.fillText(lines[line], offsetX, offsetY + line * lineHeightPx)
    }

    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const indexed = indexFrame(data, bg, fg)

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
