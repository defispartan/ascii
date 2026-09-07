import { BackButton } from "@/components/back-button"
import { Turbine } from "@/lib/ascii/animations/turbine/turbine"

export default function TurbinePage() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#111111]">
      <BackButton />
      <Turbine mode="fullscreen" />
    </main>
  )
}
