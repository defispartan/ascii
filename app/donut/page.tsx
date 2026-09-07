import { BackButton } from "@/components/back-button"
import { Donut } from "@/lib/ascii/animations/donut/donut"

export default function DonutPage() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#111111]">
      <BackButton />
      <Donut mode="fullscreen" />
    </main>
  )
}
