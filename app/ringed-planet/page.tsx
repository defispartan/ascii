import { BackButton } from "@/components/back-button"
import { RingedPlanet } from "@/lib/ascii/animations/ringed-planet/ringed-planet"

export default function RingedPlanetPage() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#111111]">
      <BackButton />
      <RingedPlanet mode="fullscreen" />
    </main>
  )
}
