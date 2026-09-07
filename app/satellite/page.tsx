import { BackButton } from "@/components/back-button"
import { Satellite } from "@/lib/ascii/animations/satellite/satellite"

export default function SatellitePage() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#111111]">
      <BackButton />
      <Satellite mode="fullscreen" />
    </main>
  )
}
