'use client'

import { Sparkles, Link2, Share2, BarChart3, Palette, Users, Bookmark, Zap } from 'lucide-react'

const features = [
  { icon: Sparkles, label: 'Curate your favorite links' },
  { icon: Link2, label: 'Share with one link' },
  { icon: Share2, label: 'Perfect for X/Twitter' },
  { icon: BarChart3, label: 'Track your analytics' },
  { icon: Palette, label: 'Customize your lists' },
  { icon: Users, label: 'Build your audience' },
  { icon: Bookmark, label: 'Save links instantly' },
  { icon: Zap, label: 'Quick and lightweight' },
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
                <feature.icon className="w-5 h-5 text-neutral-600" strokeWidth={1.5} />
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
