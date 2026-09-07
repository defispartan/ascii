import { createHeightmapPointCloud, type Heightmap } from "@/lib/ascii/engine/heightmap-model"
import type { Point3D } from "@/lib/ascii/engine/types"

import heightmapData from "./heightmap.json"

const heightmap = heightmapData as Heightmap

let cached: Point3D[] | null = null

export function getSpartanHeadPoints(): Point3D[] {
  if (cached) return cached
  cached = createHeightmapPointCloud(heightmap)
  return cached
}
