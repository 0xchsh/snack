'use client'

import Link from 'next/link'
import Image from 'next/image'

export function Footer() {
  return (
    <footer className="py-12 px-4 border-t border-neutral-200">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo */}
          <div className="flex items-center">
            <Image
              src="/images/logomark.svg"
              alt="Snack"
              width={80}
              height={24}
              className="opacity-60"
            />
          </div>

          {/* Links */}
          <nav className="flex items-center gap-6">
            <Link
              href="/terms"
              className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Privacy
            </Link>
            <a
              href="mailto:hi@snack.xyz"
              className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Contact
            </a>
          </nav>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            {/* X/Twitter */}
            <a
              href="https://x.com/snaborowmf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-neutral-900 transition-colors"
              aria-label="Follow us on X"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>

            {/* Farcaster */}
            <a
              href="https://warpcast.com/snack"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-neutral-900 transition-colors"
              aria-label="Follow us on Farcaster"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.24 2.4H5.76C3.936 2.4 2.4 3.936 2.4 5.76v12.48c0 1.824 1.536 3.36 3.36 3.36h12.48c1.824 0 3.36-1.536 3.36-3.36V5.76c0-1.824-1.536-3.36-3.36-3.36zM12 17.04c-2.784 0-5.04-2.256-5.04-5.04S9.216 6.96 12 6.96s5.04 2.256 5.04 5.04-2.256 5.04-5.04 5.04z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Bottom Text */}
        <div className="mt-8 pt-8 border-t border-neutral-100 text-center">
          <p className="text-xs text-neutral-400">
            Made with care by Rat Labs LLC
          </p>
        </div>
      </div>
    </footer>
  )
}
