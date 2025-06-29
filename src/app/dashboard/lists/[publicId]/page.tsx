import { currentUser } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ListViewClient } from './list-view-client';
import { ListViewNavbar } from '@/components/list-view-navbar';

interface ListPageProps {
  params: Promise<{
    publicId: string;
  }>;
}

export default async function ListPage({ params }: ListPageProps) {
  const { publicId } = await params;
  const user = await currentUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  // Get the list with its items and user
  const { data: list, error } = await supabase
    .from('lists')
    .select('*, items(*), users(*)')
    .eq('public_id', publicId)
    .single();

  if (error || !list) {
    notFound();
  }

  // Check if the current user owns this list
  if (list.users?.clerk_id !== user.id) {
    redirect('/dashboard');
  }

  // Map snake_case fields to camelCase for the client component
  const mappedList = {
    ...list,
    publicId: list.public_id,
    createdAt: list.created_at,
    updatedAt: list.updated_at,
    viewMode: list.view_mode,
    items: (list.items || []).map((item: any) => ({
      ...item,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      listId: item.list_id,
    })),
    user: list.users ? {
      id: list.users.id,
      username: list.users.username,
    } : undefined,
  };

  return (
    <>
      <ListViewNavbar
        listId={list.id}
        listOwnerId={user.id}
        listTitle={list.title}
        publicId={publicId}
        username={list.users?.username || ''}
      />
      <div className="container mx-auto py-8 px-4">
        <ListViewClient list={mappedList} />
      </div>
    </>
  );
} 