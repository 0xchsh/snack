'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { AnimatedListDemo, FeaturesSection, FAQSection, UseCasesSection, UsernameSection } from '@/components/marketing'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading || user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="pt-16 pb-12 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-semibold text-neutral-900 mb-4">
            Never forget your favorite links
          </h1>
          <p className="text-lg text-neutral-500 mb-8">
            Organize and share them as simple, beautiful lists.
          </p>

          <div className="flex items-center justify-center gap-3 mb-12">
            <Button asChild className="px-6 bg-transparent border border-neutral-300 text-neutral-700 hover:bg-neutral-50">
              <Link href="/auth/sign-in">Login</Link>
            </Button>
            <Button asChild className="px-6 bg-neutral-900 hover:bg-neutral-800 text-white">
              <Link href="/discover">See examples</Link>
            </Button>
          </div>

          {/* Demo in page container */}
          <div className="rounded-xl border border-neutral-200 bg-white shadow-xl shadow-neutral-200/50 overflow-hidden">
            <div className="border-b border-neutral-100 px-4 py-2 flex items-center gap-2" aria-hidden="true">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-neutral-200" />
                <div className="w-3 h-3 rounded-full bg-neutral-200" />
                <div className="w-3 h-3 rounded-full bg-neutral-200" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-neutral-100 rounded-md px-3 py-1 w-full max-w-sm">
                  <span className="text-xs text-neutral-400">snack.xyz/charles/sites</span>
                </div>
              </div>
              {/* Spacer to balance traffic lights */}
              <div className="flex items-center gap-2 opacity-0">
                <div className="w-3 h-3" />
                <div className="w-3 h-3" />
                <div className="w-3 h-3" />
              </div>
            </div>
            <div className="p-6 h-[520px] overflow-hidden">
              <AnimatedListDemo />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <FeaturesSection />

      {/* Username Section */}
      <UsernameSection />

      {/* Use Cases */}
      <UseCasesSection />

      {/* FAQ */}
      <FAQSection />

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-neutral-100">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-sm text-neutral-400">
          <Link href="/">
            <Image
              src="/images/logomark.svg"
              alt="Snack"
              width={80}
              height={24}
              style={{ filter: 'none' }}
            />
          </Link>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-neutral-600">Terms</Link>
            <Link href="/privacy" className="hover:text-neutral-600">Privacy</Link>
            <a href="mailto:hi@snack.xyz" className="hover:text-neutral-600">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
