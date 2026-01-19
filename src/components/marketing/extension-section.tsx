'use client'

import { PuzzlePieceIcon, BoltIcon, BookmarkIcon } from '@heroicons/react/24/solid'

const features = [
  {
    icon: PuzzlePieceIcon,
    title: 'One-click save',
    description: 'Save any link from X/Twitter directly to your Snack lists without leaving the page.',
  },
  {
    icon: BoltIcon,
    title: 'Lightning fast',
    description: 'Add links to your lists instantly. No copy-pasting, no switching tabs.',
  },
  {
    icon: BookmarkIcon,
    title: 'Stay organized',
    description: 'Choose which list to save to, or create new lists on the fly.',
  },
]

export function ExtensionSection() {
  return (
    <section className="py-20 px-4 bg-neutral-50">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white border border-neutral-200 rounded-full px-4 py-1.5 mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-neutral-600">New</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold text-neutral-900 mb-4">
            Save links directly from X
          </h2>
          <p className="text-lg text-neutral-500 max-w-2xl mx-auto">
            Our browser extension lets you save links to your Snack lists without ever leaving your timeline.
          </p>
        </div>

        {/* Browser mockup */}
        <div className="mb-12">
          <div className="rounded-xl border border-neutral-200 bg-white shadow-lg overflow-hidden max-w-3xl mx-auto">
            {/* Browser chrome */}
            <div className="border-b border-neutral-100 px-4 py-2 flex items-center gap-2 bg-neutral-50">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-neutral-300" />
                <div className="w-3 h-3 rounded-full bg-neutral-300" />
                <div className="w-3 h-3 rounded-full bg-neutral-300" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-white border border-neutral-200 rounded-md px-3 py-1 w-full max-w-sm flex items-center gap-2">
                  <svg className="w-4 h-4 text-neutral-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span className="text-xs text-neutral-400">x.com/home</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 opacity-0">
                <div className="w-3 h-3" />
                <div className="w-3 h-3" />
                <div className="w-3 h-3" />
              </div>
            </div>

            {/* Content area */}
            <div className="p-6">
              {/* Mock tweet */}
              <div className="border border-neutral-200 rounded-xl p-4 max-w-md">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-neutral-900 text-sm">Designer</span>
                      <span className="text-neutral-400 text-sm">@designer · 2h</span>
                    </div>
                    <p className="text-neutral-700 text-sm mb-3">
                      Just found this amazing design resource, definitely adding it to my collection
                    </p>
                    {/* Link preview card */}
                    <div className="border border-neutral-200 rounded-lg overflow-hidden">
                      <div className="h-24 bg-gradient-to-br from-neutral-100 to-neutral-200" />
                      <div className="p-3 bg-neutral-50">
                        <p className="text-xs text-neutral-400 mb-0.5">designresources.io</p>
                        <p className="text-sm font-medium text-neutral-900">Free Design Resources</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Extension popup mockup */}
                <div className="mt-4 flex justify-end">
                  <div className="bg-neutral-900 text-white rounded-lg px-3 py-2 shadow-xl flex items-center gap-2 text-sm">
                    <BookmarkIcon className="w-4 h-4" />
                    <span>Save to Snack</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div key={i} className="bg-white rounded-xl p-6 border border-neutral-200">
              <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                <feature.icon className="w-5 h-5 text-neutral-600" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">{feature.title}</h3>
              <p className="text-neutral-500 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-sm text-neutral-400">
            Available for Chrome · Coming soon to Firefox and Safari
          </p>
        </div>
      </div>
    </section>
  )
}
