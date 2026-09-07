import type { ComponentType } from "react"

import type { AnimationMode } from "@/lib/ascii/engine/use-char-grid-size"

import { Donut } from "./donut/donut"
import { SpartanHead } from "./spartan-head/spartan-head"
import { Turbine } from "./turbine/turbine"
import { RingedPlanet } from "./ringed-planet/ringed-planet"
import { Satellite } from "./satellite/satellite"

export interface AnimationEntry {
  slug: string
  name: string
  Component: ComponentType<{ mode?: AnimationMode }>
}

export const animations: AnimationEntry[] = [
  { slug: "donut", name: "Donut", Component: Donut },
  { slug: "spartan-head", name: "Spartan Head", Component: SpartanHead },
  { slug: "turbine", name: "Turbine", Component: Turbine },
  { slug: "ringed-planet", name: "Ringed Planet", Component: RingedPlanet },
  { slug: "satellite", name: "Satellite", Component: Satellite },
]
