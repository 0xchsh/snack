import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient, createServerAuth } from '@/lib/auth-server';
import { ProfileSettings } from '@/components/profile-settings';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function ProfilePage() {
  const serverAuth = createServerAuth();
  const user = await serverAuth.getUser();
  
  if (!user) {
    redirect('/auth/sign-in');
  }

  const supabase = createServerSupabaseClient();
  
  // Get user data from database
  let { data: dbUser, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error && error.code === 'PGRST116') {
    // User doesn't exist in database, create them
    const { data: newUser, error: insertErr } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email,
        username: user.user_metadata?.username || `user_${Date.now()}`,
        first_name: user.user_metadata?.first_name,
        last_name: user.user_metadata?.last_name,
        avatar_url: user.user_metadata?.avatar_url,
      })
      .select('*')
      .single();

    if (insertErr) throw insertErr;
    dbUser = newUser;
  } else if (error) {
    throw error;
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
        <ProfileSettings user={dbUser} authUser={user} />
      </Suspense>
    </div>
  );
} 