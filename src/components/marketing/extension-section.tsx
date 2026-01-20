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
          <p className="text-lg text-neutral-500 max-w-2xl mx-auto mb-6">
            Our browser extension lets you save links to your Snack lists without ever leaving your timeline.
          </p>
          <a
            href="#"
            className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full px-5 py-2.5 text-sm font-medium transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0zM1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29zm13.342 2.166a5.446 5.446 0 0 1 1.45 7.09l.002.001h-.002l-3.952 6.848a12.014 12.014 0 0 0 9.62-9.797H15.27zm-3.254 2.094a2.27 2.27 0 1 0 0 4.54 2.27 2.27 0 0 0 0-4.54z"/>
            </svg>
            Add to Chrome
          </a>
        </div>

        {/* Browser mockup */}
        <div className="mb-12">
          <div className="rounded-xl border border-neutral-200 bg-white shadow-xl shadow-neutral-200/50 overflow-hidden">
            {/* Browser chrome */}
            <div className="border-b border-neutral-100 px-4 py-2 flex items-center gap-2" aria-hidden="true">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-neutral-200" />
                <div className="w-3 h-3 rounded-full bg-neutral-200" />
                <div className="w-3 h-3 rounded-full bg-neutral-200" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-neutral-100 rounded-md px-3 py-1 w-full max-w-sm flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 text-neutral-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span className="text-xs text-neutral-400">x.com</span>
                </div>
              </div>
              {/* Spacer to balance traffic lights */}
              <div className="flex items-center gap-2 opacity-0">
                <div className="w-3 h-3" />
                <div className="w-3 h-3" />
                <div className="w-3 h-3" />
              </div>
            </div>

            {/* Content area */}
            <div className="p-8 flex justify-center">
              <div className="w-full max-w-lg">
                {/* Tweet */}
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-black">Designer</span>
                      <span className="text-gray-500">@designer · 2h</span>
                    </div>
                    <p className="text-black mb-3">
                      Just found this amazing design resource, definitely adding it to my collection
                    </p>
                    {/* Link preview */}
                    <div className="border border-gray-200 rounded-2xl overflow-hidden mb-3">
                      <div className="h-36 bg-gray-100" />
                      <div className="p-3 border-t border-gray-200 bg-white">
                        <p className="text-sm text-gray-500">designresources.io</p>
                        <p className="font-medium text-black">Free Design Resources</p>
                      </div>
                    </div>
                    {/* Tweet actions */}
                    <div className="flex gap-8 text-gray-400">
                      <span className="flex items-center gap-1.5 text-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
                        </svg>
                        12
                      </span>
                      <span className="flex items-center gap-1.5 text-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
                        </svg>
                        3
                      </span>
                      <span className="flex items-center gap-1.5 text-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                        </svg>
                        48
                      </span>
                      <span className="flex items-center gap-1.5 text-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                        </svg>
                      </span>
                      <span className="flex items-center gap-1.5 text-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Save to Snack button */}
                <div className="mt-6 flex justify-end">
                  <div className="bg-neutral-900 text-white rounded-full px-5 py-2.5 shadow-lg flex items-center gap-2 font-medium">
                    <BookmarkIcon className="w-4 h-4" />
                    Save to Snack
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div key={i} className="bg-white rounded-xl p-6">
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
