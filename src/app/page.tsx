import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-foreground mb-6">
            Snack
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create, organize, and share curated collections of links. 
            Discover amazing content curated by creators around the world.
          </p>
          <div className="space-x-4">
            <Link href="/auth/sign-up" className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors inline-block">
              Get Started
            </Link>
            <button className="border border-border text-foreground px-8 py-3 rounded-lg font-semibold hover:bg-accent transition-colors">
              Explore Lists
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}