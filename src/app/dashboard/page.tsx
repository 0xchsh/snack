import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { DashboardClient } from './dashboard-client';
import { Button } from '@/components/ui/button';
import { Settings, User } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const user = await currentUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  // Get or create user in Supabase
  let { data: dbUser, error } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned, ignore for create
    throw error;
  }

  if (!dbUser) {
    const { data: newUser, error: insertErr } = await supabase
      .from('users')
      .insert({
        clerk_id: user.id,
        username: user.username || `user_${Date.now()}`,
      })
      .select('*')
      .single();

    if (insertErr) throw insertErr;
    dbUser = newUser;
  }

  // Fetch lists for this user
  const { data: lists, error: listErr } = await supabase
    .from('lists')
    .select('*, items(count), users:users(username)')
    .eq('user_id', dbUser.id)
    .order('updated_at', { ascending: false });

  if (listErr) throw listErr;

  const mappedLists = (lists || []).map((l: any) => ({
    id: l.id,
    publicId: l.public_id,
    title: l.title,
    description: l.description,
    emoji: l.emoji,
    createdAt: l.created_at ? new Date(l.created_at) : new Date(),
    updatedAt: l.updated_at ? new Date(l.updated_at) : new Date(),
    itemCount: Array.isArray(l.items) ? l.items.length : 0,
    username: l.users?.username || '',
  }));

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Lists</h1>
          <p className="text-muted-foreground">
            Create and manage your curated lists
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {user.imageUrl ? (
            <img
              src={user.imageUrl}
              alt="Profile picture"
              className="w-8 h-8 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center border border-gray-200">
              <User className="w-4 h-4 text-gray-500" />
            </div>
          )}
          <Link href="/dashboard/profile">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Profile
            </Button>
          </Link>
        </div>
      </div>
      
      <DashboardClient lists={mappedLists} />
    </div>
  );
} 