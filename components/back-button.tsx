"use client"

import Link from "next/link"

export function BackButton() {
  return (
    <Link
      href="/"
      className="fixed top-4 left-4 z-10 font-mono text-sm text-white/60 transition-colors hover:text-white"
    >
      &lt; back
    </Link>
  )
}
