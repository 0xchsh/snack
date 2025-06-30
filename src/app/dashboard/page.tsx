import { redirect } from 'next/navigation';
import { createServerSupabaseClient, createServerAuth } from '@/lib/auth-server';
import { DashboardClient } from './dashboard-client';
import { Button } from '@/components/ui/button';
import { Settings, User } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default async function DashboardPage() {
  const serverAuth = createServerAuth();
  const user = await serverAuth.getUser();
  
  if (!user) {
    redirect('/auth/sign-in');
  }

  const supabase = createServerSupabaseClient();

  // With Supabase auth, user.id is the primary key - no need for separate user creation
  // The user should already exist in the users table due to auth hooks
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

  // Fetch lists for this user
  const { data: lists, error: listErr } = await supabase
    .from('lists')
    .select('*, items(count), users:users(username)')
    .eq('user_id', user.id)
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

  // Fetch saved lists for this user (join with lists)
  const { data: saved, error: savedErr } = await supabase
    .from('saved_lists')
    .select('list_id, lists(*, items(count), users:users(username))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (savedErr) throw savedErr;

  const mappedSavedLists = (saved || [])
    .map((s: any) => {
      const l = s.lists;
      if (!l) return undefined;
      return {
        id: l.id,
        publicId: l.public_id,
        title: l.title,
        description: l.description,
        emoji: l.emoji,
        createdAt: l.created_at ? new Date(l.created_at) : new Date(),
        updatedAt: l.updated_at ? new Date(l.updated_at) : new Date(),
        itemCount: Array.isArray(l.items) ? l.items.length : 0,
        username: l.users?.username || '',
      };
    })
    .filter((l: any): l is NonNullable<typeof l> => !!l);

  // Placeholder stats
  const stats = {
    lists: mappedLists.length,
    saves: mappedSavedLists.length,
    views: 74, // placeholder
    shares: 3, // placeholder
  };

  return (
    <DashboardClient
      lists={mappedLists}
      savedLists={mappedSavedLists}
      stats={stats}
    />
  );
} 