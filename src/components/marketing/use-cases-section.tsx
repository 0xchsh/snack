'use client'

import { useEffect, useRef } from 'react'
import { SwatchIcon, PaperAirplaneIcon, VideoCameraIcon, CodeBracketIcon, BookOpenIcon, UsersIcon, RocketLaunchIcon, MusicalNoteIcon, CameraIcon, FireIcon, PuzzlePieceIcon } from '@heroicons/react/24/solid'

const useCases = [
  { icon: SwatchIcon, label: 'Designers', bg: 'bg-pink-100', color: 'text-pink-600' },
  { icon: PaperAirplaneIcon, label: 'Travelers', bg: 'bg-sky-100', color: 'text-sky-600' },
  { icon: VideoCameraIcon, label: 'Creators', bg: 'bg-red-100', color: 'text-red-600' },
  { icon: CodeBracketIcon, label: 'Developers', bg: 'bg-violet-100', color: 'text-violet-600' },
  { icon: FireIcon, label: 'Foodies', bg: 'bg-orange-100', color: 'text-orange-600' },
  { icon: BookOpenIcon, label: 'Writers', bg: 'bg-amber-100', color: 'text-amber-600' },
  { icon: UsersIcon, label: 'Communities', bg: 'bg-teal-100', color: 'text-teal-600' },
  { icon: RocketLaunchIcon, label: 'Founders', bg: 'bg-indigo-100', color: 'text-indigo-600' },
  { icon: MusicalNoteIcon, label: 'Musicians', bg: 'bg-fuchsia-100', color: 'text-fuchsia-600' },
  { icon: CameraIcon, label: 'Photographers', bg: 'bg-slate-200', color: 'text-slate-600' },
  { icon: FireIcon, label: 'Fitness', bg: 'bg-lime-100', color: 'text-lime-600' },
  { icon: PuzzlePieceIcon, label: 'Gamers', bg: 'bg-cyan-100', color: 'text-cyan-600' },
]

export function UseCasesSection() {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scrollContainer = scrollRef.current
    if (!scrollContainer) return

    let animationId: number
    let scrollPosition = 0
    const scrollSpeed = 0.3

    const animate = () => {
      scrollPosition += scrollSpeed
      const totalWidth = scrollContainer.scrollWidth / 2

      if (scrollPosition >= totalWidth) {
        scrollPosition = 0
      }

      scrollContainer.style.transform = `translateX(-${scrollPosition}px)`
      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationId)
  }, [])

  return (
    <section className="py-20 overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 mb-8">
        <h2 className="text-2xl sm:text-3xl font-semibold text-neutral-900 text-center mb-3">
          Lists for everyone
        </h2>
        <p className="text-lg text-neutral-500 text-center">
          Whatever you're into, organize and share it beautifully.
        </p>
      </div>

      {/* Marquee */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="relative overflow-hidden">
          {/* Left fade */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10" />

          <div ref={scrollRef} className="flex gap-3 w-max">
            {[...useCases, ...useCases].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-neutral-50 hover:bg-neutral-100 transition-colors rounded-full px-5 py-3 cursor-default"
              >
                <div className={`w-7 h-7 rounded-full ${item.bg} flex items-center justify-center`}>
                  <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                </div>
                <span className="font-medium text-neutral-900 whitespace-nowrap">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Right fade */}
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10" />
        </div>
      </div>
    </section>
  )
}
