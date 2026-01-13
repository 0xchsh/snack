'use client'

import { useEffect, useRef } from 'react'

const usernames = [
  'sarah',
  'alex',
  'jamie',
  'chris',
  'taylor',
  'morgan',
  'casey',
  'riley',
  'jordan',
  'sam',
  'emma',
  'noah',
  'olivia',
  'liam',
  'ava',
  'lucas',
  'mia',
  'ethan',
  'luna',
  'leo',
]

export function UsernameSection() {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scrollContainer = scrollRef.current
    if (!scrollContainer) return

    let animationId: number
    let scrollPosition = 0
    const scrollSpeed = 0.3

    const animate = () => {
      scrollPosition += scrollSpeed
      const totalHeight = scrollContainer.scrollHeight / 2

      if (scrollPosition >= totalHeight) {
        scrollPosition = 0
      }

      scrollContainer.style.transform = `translateY(-${scrollPosition}px)`
      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <section className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-semibold text-neutral-900 mb-3">
            Claim your username
          </h2>
          <p className="text-lg text-neutral-500">
            One link for all your lists. Short, simple, yours.
          </p>
        </div>

        {/* Card Container */}
        <div className="max-w-5xl mx-auto">
          <div className="bg-neutral-50 rounded-3xl py-12 px-8">
            {/* Username Animation */}
            <div className="flex items-center justify-center">
              <div className="flex items-start gap-0">
                {/* Domain - vertically centered with the list */}
                <span className="text-4xl sm:text-5xl font-medium text-neutral-300 tracking-tight leading-[56px] sm:leading-[64px] mt-[112px] sm:mt-[128px]">
                  snack.xyz/
                </span>

                {/* Scrolling usernames */}
                <div className="relative h-[280px] sm:h-[320px] overflow-hidden">
                  {/* Top fade */}
                  <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-neutral-50 via-neutral-50/80 to-transparent z-10" />

                  {/* Scrolling container */}
                  <div ref={scrollRef} className="flex flex-col">
                    {[...usernames, ...usernames].map((username, i) => (
                      <span
                        key={i}
                        className="text-4xl sm:text-5xl font-medium text-neutral-900 tracking-tight leading-[56px] sm:leading-[64px]"
                      >
                        {username}
                      </span>
                    ))}
                  </div>

                  {/* Bottom fade */}
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-neutral-50 via-neutral-50/80 to-transparent z-10" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
