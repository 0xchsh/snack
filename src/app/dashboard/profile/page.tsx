import { Suspense } from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ProfileSettings } from '@/components/profile-settings';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

async function getUser(clerkId: string) {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_id', clerkId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return user;
}

export default async function ProfilePage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  const user = await getUser(userId);
  
  if (!user) {
    redirect('/dashboard');
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and profile information.
        </p>
      </div>
      
      <Suspense fallback={<div>Loading...</div>}>
        <ProfileSettings user={user} />
      </Suspense>
    </div>
  );
} 