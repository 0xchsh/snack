import { redirect } from 'next/navigation';
import { createServerAuth } from '@/lib/auth-server';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function Home() {
  const serverAuth = createServerAuth();
  const user = await serverAuth.getUser();
  
  // If user is authenticated, redirect to dashboard
  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold">🍿 Snack</h1>
          <h2 className="text-4xl font-bold tracking-tight">
            Curate and share your favorite links
          </h2>
          <p className="text-xl text-muted-foreground max-w-lg mx-auto">
            Create beautiful, shareable lists of your favorite websites, articles, tools, and resources.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link href="/auth/sign-up">
            <Button size="lg" className="text-lg px-8 py-6">
              Get Started
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground">
            Sign up to start creating your first list
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div className="space-y-2">
            <div className="text-3xl">📝</div>
            <h3 className="font-semibold">Create Lists</h3>
            <p className="text-sm text-muted-foreground">
              Organize your favorite links into beautiful, themed collections
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-3xl">🔗</div>
            <h3 className="font-semibold">Add Links</h3>
            <p className="text-sm text-muted-foreground">
              Automatically fetch previews and organize with drag-and-drop
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-3xl">🚀</div>
            <h3 className="font-semibold">Share</h3>
            <p className="text-sm text-muted-foreground">
              Share your curated lists with a beautiful, public URL
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}