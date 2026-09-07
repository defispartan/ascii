/**
 * Generates a new ASCII animation from a PNG image.
 *
 * Usage:
 *   pnpm generate --image path/to/image.png [--name "Display Name"] [--axis horizontal|vertical|random|auto] [--color "#rrggbb"]
 *
 * The PNG's alpha channel isolates the subject from its background (so a
 * transparent-background cutout works best) - opaque pixels become a
 * silhouette mask, and each interior pixel bulges toward the camera by its
 * distance from the silhouette's edge, the same "embossed badge" relief
 * lib/ascii/engine/heightmap-model.ts turns into a point cloud for any
 * heightmap-backed animation.
 */
import fs from "node:fs"
import path from "node:path"
import sharp from "sharp"

const REPO_ROOT = path.resolve(import.meta.dirname, "..")
const ANIMATIONS_DIR = path.join(REPO_ROOT, "lib/ascii/animations")
const APP_DIR = path.join(REPO_ROOT, "app")
const REGISTRY_PATH = path.join(ANIMATIONS_DIR, "registry.ts")

const MAX_DIM = 130
const MASK_THRESHOLD = 128
const AXES = ["horizontal", "vertical", "random", "auto"] as const
type Axis = (typeof AXES)[number]
type ResolvedAxis = "horizontal" | "vertical"
const DEFAULT_COLOR = "#ffffff"
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/

interface Args {
  image?: string
  name?: string
  axis?: string
  color?: string
}

function parseArgs(argv: string[]): Args {
  const args: Record<string, string | boolean> = {}
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]
    if (!token.startsWith("--")) continue
    const key = token.slice(2)
    const next = argv[i + 1]
    if (next !== undefined && !next.startsWith("--")) {
      args[key] = next
      i++
    } else {
      args[key] = true
    }
  }
  return args as Args
}

function fail(message: string): never {
  console.error(`\nError: ${message}\n`)
  process.exit(1)
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function toDisplayName(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function toPascalCase(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("")
}

/**
 * Two-pass chamfer distance transform: approximates, for every foreground
 * (mask=1) cell, its Euclidean distance to the nearest background cell.
 * O(n) rather than the O(n^2) a brute-force nearest-background search would
 * cost at these grid sizes.
 */
function distanceToEdge(mask: Uint8Array, width: number, height: number): Float32Array {
  const INF = 1e6
  const DIAGONAL = Math.SQRT2
  const dist = new Float32Array(width * height)
  for (let i = 0; i < mask.length; i++) dist[i] = mask[i] ? INF : 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      if (!mask[idx]) continue
      let best = dist[idx]
      if (x > 0) best = Math.min(best, dist[idx - 1] + 1)
      if (y > 0) best = Math.min(best, dist[idx - width] + 1)
      if (x > 0 && y > 0) best = Math.min(best, dist[idx - width - 1] + DIAGONAL)
      if (x < width - 1 && y > 0) best = Math.min(best, dist[idx - width + 1] + DIAGONAL)
      dist[idx] = best
    }
  }

  for (let y = height - 1; y >= 0; y--) {
    for (let x = width - 1; x >= 0; x--) {
      const idx = y * width + x
      if (!mask[idx]) continue
      let best = dist[idx]
      if (x < width - 1) best = Math.min(best, dist[idx + 1] + 1)
      if (y < height - 1) best = Math.min(best, dist[idx + width] + 1)
      if (x < width - 1 && y < height - 1) best = Math.min(best, dist[idx + width + 1] + DIAGONAL)
      if (x > 0 && y < height - 1) best = Math.min(best, dist[idx + width - 1] + DIAGONAL)
      dist[idx] = best
    }
  }

  return dist
}

async function buildHeightmap(imagePath: string) {
  const { data, info } = await sharp(imagePath)
    .resize(MAX_DIM, MAX_DIM, { fit: "inside", withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height, channels } = info
  const mask = new Uint8Array(width * height)
  for (let i = 0; i < width * height; i++) {
    mask[i] = data[i * channels + 3] >= MASK_THRESHOLD ? 1 : 0
  }

  if (!mask.some(Boolean)) {
    fail("The image has no opaque pixels - nothing to build a silhouette from. Use a PNG with a transparent background around your subject.")
  }

  const dist = distanceToEdge(mask, width, height)
  let maxDist = 0
  for (let i = 0; i < dist.length; i++) if (mask[i]) maxDist = Math.max(maxDist, dist[i])

  const elevation = new Array<number>(width * height)
  for (let i = 0; i < dist.length; i++) elevation[i] = mask[i] ? dist[i] / (maxDist || 1) : 0

  return { width, height, mask: Array.from(mask), elevation }
}

function resolveAxis(requested: string | undefined, width: number, height: number): ResolvedAxis {
  const axis = (requested ?? "auto") as Axis
  if (!AXES.includes(axis)) {
    fail(`--axis must be one of: ${AXES.join(", ")} (got "${requested}")`)
  }
  if (axis === "horizontal" || axis === "vertical") return axis
  if (axis === "random") return Math.random() < 0.5 ? "horizontal" : "vertical"
  // auto: a portrait-shaped subject reads best spinning like a turntable
  // (vertical axis); a landscape-shaped one reads best tumbling like a wheel
  // (horizontal axis).
  return height >= width ? "vertical" : "horizontal"
}

function resolveColor(requested: string | undefined): string {
  if (requested === undefined) return DEFAULT_COLOR
  if (!HEX_COLOR_PATTERN.test(requested)) {
    fail(`--color must be a 6-digit hex color like "#18453b" (got "${requested}")`)
  }
  return requested
}

const ROTATION_BY_AXIS = {
  vertical: { rotationSpeed: { x: 0, y: 0.05, z: 0 }, initialRotation: { x: 0.08, y: 0, z: 0 } },
  horizontal: { rotationSpeed: { x: 0.05, y: 0, z: 0 }, initialRotation: { x: 0, y: 0.08, z: 0 } },
} as const

function writeFile(filePath: string, content: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content)
}

function updateRegistry(slug: string, pascalName: string, displayName: string) {
  const source = fs.readFileSync(REGISTRY_PATH, "utf8")
  if (source.includes(`"${slug}"`)) {
    fail(`"${slug}" is already registered in ${path.relative(REPO_ROOT, REGISTRY_PATH)}. Pick a different --name.`)
  }

  const importLine = `import { ${pascalName} } from "./${slug}/${slug}"\n`
  const lastImportMatch = [...source.matchAll(/^import .+\n/gm)].pop()
  if (!lastImportMatch) fail("Could not find an import statement to anchor the new import in registry.ts")
  const importInsertAt = lastImportMatch.index! + lastImportMatch[0].length

  let updated = source.slice(0, importInsertAt) + importLine + source.slice(importInsertAt)

  const entryLine = `  { slug: "${slug}", name: "${displayName}", Component: ${pascalName} },\n`
  const closingBracketIndex = updated.lastIndexOf("]")
  if (closingBracketIndex === -1) fail("Could not find the closing `]` of the animations array in registry.ts")
  updated = updated.slice(0, closingBracketIndex) + entryLine + updated.slice(closingBracketIndex)

  fs.writeFileSync(REGISTRY_PATH, updated)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (!args.image) fail("--image <path-to-png> is required")
  const imagePath = path.resolve(process.cwd(), args.image)
  if (!fs.existsSync(imagePath)) fail(`Image not found: ${imagePath}`)
  if (path.extname(imagePath).toLowerCase() !== ".png") fail("Only .png images are supported (so transparency can isolate the subject)")

  const slug = slugify(args.name ?? path.basename(imagePath, path.extname(imagePath)))
  if (!slug) fail("Could not derive a name - pass --name")
  const displayName = args.name ?? toDisplayName(slug)
  const pascalName = toPascalCase(slug)

  const animationDir = path.join(ANIMATIONS_DIR, slug)
  if (fs.existsSync(animationDir)) fail(`lib/ascii/animations/${slug} already exists - pick a different --name`)

  console.log(`Building silhouette from ${path.relative(REPO_ROOT, imagePath)}...`)
  const heightmap = await buildHeightmap(imagePath)

  const axis = resolveAxis(args.axis, heightmap.width, heightmap.height)
  const { rotationSpeed, initialRotation } = ROTATION_BY_AXIS[axis]
  console.log(`Rotation axis: ${axis}`)

  const color = resolveColor(args.color)

  writeFile(path.join(animationDir, "heightmap.json"), JSON.stringify(heightmap))

  writeFile(
    path.join(animationDir, "model.ts"),
    `import { createHeightmapPointCloud, type Heightmap } from "@/lib/ascii/engine/heightmap-model"
import type { Point3D } from "@/lib/ascii/engine/types"

import heightmapData from "./heightmap.json"

const heightmap = heightmapData as Heightmap

let cached: Point3D[] | null = null

export function get${pascalName}Points(): Point3D[] {
  if (cached) return cached
  cached = createHeightmapPointCloud(heightmap)
  return cached
}
`
  )

  writeFile(
    path.join(animationDir, `${slug}.tsx`),
    `"use client"

import { useMemo } from "react"

import { AsciiStage } from "@/lib/ascii/engine/ascii-stage"
import type { AnimationMode } from "@/lib/ascii/engine/use-char-grid-size"
import type { RenderConfig, RotationSpeed } from "@/lib/ascii/engine/types"

import { get${pascalName}Points } from "./model"

const RAMP = ".,-~:;=!*#$@"
const LIGHT_DIR: readonly [number, number, number] = [-0.15, 0.2, 0.96]
const ROTATION_SPEED: RotationSpeed = ${JSON.stringify(rotationSpeed)}
const INITIAL_ROTATION: RotationSpeed = ${JSON.stringify(initialRotation)}
const COLOR = ${JSON.stringify(color)}

export function ${pascalName}({ mode = "preview" }: { mode?: AnimationMode }) {
  const points = useMemo(() => get${pascalName}Points(), [])
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
      filename="${slug}"
      color={COLOR}
    />
  )
}
`
  )

  writeFile(
    path.join(APP_DIR, slug, "page.tsx"),
    `import { BackButton } from "@/components/back-button"
import { ${pascalName} } from "@/lib/ascii/animations/${slug}/${slug}"

export default function ${pascalName}Page() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#111111]">
      <BackButton />
      <${pascalName} mode="fullscreen" />
    </main>
  )
}
`
  )

  updateRegistry(slug, pascalName, displayName)

  console.log(`\nDone. Added "${displayName}" at /${slug}.`)
  console.log(`Run "pnpm dev" and open http://localhost:3000/${slug} to see it.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
