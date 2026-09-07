"use client"

import Link from "next/link"

import { animations } from "@/lib/ascii/animations/registry"

export function GalleryGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
      {animations.map(({ slug, name, Component }) => (
        <Link
          key={slug}
          href={`/${slug}`}
          className="group flex aspect-[4/3] flex-col gap-3 overflow-hidden border border-white/10 bg-[#111111] p-2 transition-colors hover:bg-white/5"
        >
          <div className="flex-1 overflow-hidden">
            <Component mode="preview" />
          </div>
          <span className="text-center font-mono text-xs tracking-widest text-white/50 uppercase group-hover:text-white">
            {name}
          </span>
        </Link>
      ))}
    </div>
  )
}
