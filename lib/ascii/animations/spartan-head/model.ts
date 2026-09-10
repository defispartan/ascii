import { createHeightmapPointCloud, type Heightmap } from "@/lib/ascii/engine/heightmap-model"
import type { Point3D } from "@/lib/ascii/engine/types"

import heightmapData from "./heightmap.json"

const heightmap = heightmapData as Heightmap

let cached: Point3D[] | null = null

export function getSpartanHeadPoints(): Point3D[] {
  if (cached) return cached
  // A true flat cross-section: the silhouette carries no depth at all, so the
  // helmet reads as a 2D cutout spinning on its axis and vanishes to a line
  // edge-on. The default relief would push the thickest interior cells (the
  // right side of the crown) ~0.6 toward the camera, which reads as a 3D bulge
  // jutting out of an otherwise flat plate at those edge-on angles. Shading is
  // unaffected -- normals come from the height-field gradient, not from z.
  cached = createHeightmapPointCloud(heightmap, { reliefDepth: 0 })
  return cached
}
