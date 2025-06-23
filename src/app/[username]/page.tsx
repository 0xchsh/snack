import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ShareProfileButton } from '@/components/ShareProfileButton';
import Link from 'next/link';
import { clerkClient } from '@clerk/nextjs/server';

async function getUserProfileAndLists(username: string) {
  try {
    if (!username) return null;

    // Fetch all users from Clerk to find the one with the matching public metadata username
    const client = await clerkClient();
    const usersResponse = await client.users.getUserList(); // Fetches all users
    
    // Find the user whose publicMetadata.username matches the requested username
    const clerkUser = usersResponse.data.find(
      (u) => (u.publicMetadata as { username?: string })?.username === username
    );

    if (!clerkUser) {
      console.log(`[PublicProfile] Clerk user with public metadata username "${username}" not found.`);
      return null;
    }

    // Use the Clerk user ID to find the corresponding user in your database
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', clerkUser.id)
      .single();

    if (userError || !dbUser) {
      console.log(`[PublicProfile] DB user not found for Clerk ID: ${clerkUser.id}`, userError);
      return null;
    }

    // Fetch lists using the CORRECT internal database user ID
    const { data: lists, error: listsError } = await supabase
      .from('lists')
      .select('id, public_id, title, emoji, created_at, updated_at, items(count)')
      .eq('user_id', dbUser.id) // FIX: Using dbUser.id
      // .eq('is_public', true) // Temporarily disabled to show all lists
      .order('updated_at', { ascending: false });

    if (listsError) {
      console.log(`[PublicProfile] Error fetching lists for user ID: ${dbUser.id}`, listsError);
      return null;
    }
    
    // Now, combine Clerk and DB user data for the UI
    const user = {
      ...dbUser,
      ...clerkUser,
      username: (clerkUser.publicMetadata as any)?.username || clerkUser.username,
      first_name: clerkUser.firstName,
      last_name: clerkUser.lastName,
      image_url: clerkUser.imageUrl, // Use the definitive image URL from Clerk
    };

    const stats = {
      lists: lists?.length || 0,
      saves: user.saves_count || 0,
      views: user.views_count || 0,
    };

    return {
      user,
      lists: (lists || []).map((l: any) => ({
        id: l.id,
        publicId: l.public_id,
        title: l.title,
        emoji: l.emoji,
        itemCount: Array.isArray(l.items) ? l.items.length : 0,
      })),
      stats,
    };
  } catch (error) {
    console.error(`[PublicProfilePage] Failed to fetch profile for ${username}:`, error);
    return null;
  }
}

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const data = await getUserProfileAndLists(username);

  if (!data) return notFound();

  // Redirect to canonical username if needed
  if (data.user.username !== username) {
    redirect(`/${data.user.username}`);
  }

  const { user, lists, stats } = data;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
        <img
          src={user.image_url}
          alt={user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
          style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', marginBottom: 16 }}
        />
        <h1 style={{ fontSize: 32, fontWeight: 700 }}>{user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}</h1>
        <div style={{ color: '#f97316', fontWeight: 500, marginBottom: 8 }}>@{user.username}</div>
        <div style={{ color: '#555', marginBottom: 16 }}>
          {stats.lists} lists · {stats.saves.toLocaleString()} saves · {stats.views.toLocaleString()} views
        </div>
        <ShareProfileButton username={user.username} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
        {lists.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#888', padding: '2rem 0' }}>
            No public lists yet.
          </div>
        ) : (
          lists.map((list: any, idx: number) => (
            <Link
              key={list.id}
              href={`/${user.username}/${list.publicId}`}
              style={{
                border: '1px solid #eee',
                borderRadius: 12,
                padding: 20,
                background: '#fff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'box-shadow 0.2s',
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }}>{list.emoji || '📦'}</div>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{list.title}</div>
              <div style={{ color: '#555', fontSize: 14 }}>{user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username} · {list.itemCount} items</div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
} 