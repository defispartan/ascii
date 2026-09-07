import { BackButton } from "@/components/back-button"
import { SpartanHead } from "@/lib/ascii/animations/spartan-head/spartan-head"

export default function SpartanHeadPage() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#111111]">
      <BackButton />
      <SpartanHead mode="fullscreen" />
    </main>
  )
}
