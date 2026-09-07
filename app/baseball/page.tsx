import { BackButton } from "@/components/back-button"
import { Baseball } from "@/lib/ascii/animations/baseball/baseball"

export default function BaseballPage() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#111111]">
      <BackButton />
      <Baseball mode="fullscreen" />
    </main>
  )
}
