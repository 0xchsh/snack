'use client'

import { SparklesIcon, LinkIcon, ShareIcon, ChartBarIcon, SwatchIcon, UsersIcon, BookmarkIcon, BoltIcon } from '@heroicons/react/24/solid'

const features = [
  { icon: SparklesIcon, label: 'Curate your favorite links' },
  { icon: LinkIcon, label: 'Share with one link' },
  { icon: ShareIcon, label: 'Perfect for X/Twitter' },
  { icon: ChartBarIcon, label: 'Track your analytics' },
  { icon: SwatchIcon, label: 'Customize your lists' },
  { icon: UsersIcon, label: 'Build your audience' },
  { icon: BookmarkIcon, label: 'Save links instantly' },
  { icon: BoltIcon, label: 'Quick and lightweight' },
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
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-4">
                <feature.icon className="w-5 h-5 text-neutral-600" />
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
