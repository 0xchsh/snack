'use client'

import { Sparkle, Link, ShareNetwork, ChartBar, Palette, Users, BookmarkSimple, Lightning } from '@phosphor-icons/react'

const features = [
  { icon: Sparkle, label: 'Curate your favorite links' },
  { icon: Link, label: 'Share with one link' },
  { icon: ShareNetwork, label: 'Perfect for X/Twitter' },
  { icon: ChartBar, label: 'Track your analytics' },
  { icon: Palette, label: 'Customize your lists' },
  { icon: Users, label: 'Build your audience' },
  { icon: BookmarkSimple, label: 'Save links instantly' },
  { icon: Lightning, label: 'Quick and lightweight' },
]

export function FeaturesSection() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {features.map((feature, i) => (
            <div
              key={i}
              className="bg-neutral-50 rounded-xl p-5 hover:bg-neutral-100 transition-colors cursor-default"
            >
              <div className="size-10 bg-white rounded-full flex items-center justify-center mb-4">
                <feature.icon weight="bold" className="size-5 text-neutral-600" aria-hidden="true" />
              </div>
              <p className="text-base font-medium text-neutral-900">
                {feature.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
