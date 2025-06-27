'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface List {
  id: string;
  publicId: string;
  title: string;
  description: string | null;
  emoji: string | null;
  createdAt: Date;
  updatedAt: Date;
  itemCount?: number;
  username?: string;
}

interface DashboardClientProps {
  lists: List[];
  savedLists: List[];
  stats: {
    lists: number;
    saves: number;
    views: number;
    shares: number;
  };
  showCreateButton?: boolean;
}

// LiveItemCount component
function LiveItemCount({ listId, initialCount }: { listId: string, initialCount?: number }) {
  const [count, setCount] = useState<number | undefined>(initialCount);
  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    let isMounted = true;
    supabase
      .from('items')
      .select('id', { count: 'exact', head: true })
      .eq('list_id', listId)
      .then(({ count }) => {
        if (isMounted) setCount(count ?? 0);
      });
    return () => { isMounted = false; };
  }, [listId]);
  return <>{typeof count === 'number' ? `${count} item${count === 1 ? '' : 's'}` : ''}</>;
}

export function DashboardClient({ lists, savedLists, stats, showCreateButton = true }: DashboardClientProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState('created');
  const router = useRouter();

  const handleCreateList = async () => {
    setIsCreating(true);

    try {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Untitled List',
          description: null,
          emoji: '📝',
        }),
      });

      if (response.ok) {
        const newList = await response.json();
        router.push(`/dashboard/lists/${newList.public_id}`);
      } else {
        const errorData = await response.json();
        console.error('Failed to create list:', errorData);
        alert(errorData.error || 'Failed to create list');
      }
    } catch (error) {
      console.error('Failed to create list:', error);
      alert('Failed to create list');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Your Snacks</h1>
      </div>
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border p-6 text-center">
          <div className="text-sm text-gray-500 mb-1">Lists</div>
          <div className="text-2xl font-bold">{stats.lists}</div>
        </div>
        <div className="bg-white rounded-xl border p-6 text-center">
          <div className="text-sm text-gray-500 mb-1">Saves</div>
          <div className="text-2xl font-bold">{stats.saves}</div>
        </div>
        <div className="bg-white rounded-xl border p-6 text-center">
          <div className="text-sm text-gray-500 mb-1">Views</div>
          <div className="text-2xl font-bold">{stats.views}</div>
        </div>
        <div className="bg-white rounded-xl border p-6 text-center">
          <div className="text-sm text-gray-500 mb-1">Shares</div>
          <div className="text-2xl font-bold">{stats.shares}</div>
        </div>
      </div>
      <Tabs defaultValue="created" className="mb-8" onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex-1">
            <TabsList className="mb-0">
              <TabsTrigger value="created">Created</TabsTrigger>
              <TabsTrigger value="saved">Saved</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
            </TabsList>
          </div>
          {showCreateButton && activeTab === 'created' && (
            <Button
              onClick={handleCreateList}
              disabled={isCreating}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2 rounded-lg hidden sm:block cursor-pointer ml-4"
            >
              {isCreating ? 'Creating...' : 'Create a list +'}
            </Button>
          )}
        </div>
        <TabsContent value="created">
          {/* Create New List Button (mobile/under tabs) */}
          {showCreateButton && (
            <Button
              className="w-full sm:hidden mb-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold cursor-pointer"
              onClick={handleCreateList}
              disabled={isCreating}
            >
              {isCreating ? 'Creating...' : 'Create a list +'}
            </Button>
          )}
          {/* Created Lists Grid */}
          {lists.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-6xl mb-4">📝</div>
                <CardTitle className="mb-2">No lists yet</CardTitle>
                <CardDescription className="mb-4">
                  Create your first list to get started sharing your curated content.
                </CardDescription>
                <Button onClick={handleCreateList} disabled={isCreating}>
                  <Plus className="mr-2 h-4 w-4" />
                  {isCreating ? 'Creating...' : 'Create Your First List'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-6" style={{ gap: '24px' }}>
              {lists.map((list) => (
                <Link key={list.id} href={`/dashboard/lists/${list.publicId}`}>
                  <Card className="flex flex-col items-start justify-center p-4 border border-[#D1D5DB] rounded-lg bg-white min-h-[120px] hover:shadow-md transition-shadow cursor-pointer">
                    {/* Icon/Emoji */}
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-white border border-[#E5E7EB] rounded-full text-[24px] font-bold mb-3">
                        <span>{list.emoji || '📦'}</span>
                      </div>
                      {/* Text Info */}
                    <div className="flex flex-col items-start justify-center min-w-0 text-left w-full">
                      <div className="text-[16px] font-semibold text-[#111827] truncate w-full text-left">{list.title}</div>
                      <div className="text-[14px] font-medium text-[#6B7280] truncate mt-1 w-full text-left">{list.username || ''} &#8226; <LiveItemCount listId={list.id} initialCount={list.itemCount} /></div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="saved">
          {/* Saved Lists Grid */}
          {savedLists.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-6xl mb-4">🔖</div>
                <CardTitle className="mb-2">No saved lists yet</CardTitle>
                <CardDescription className="mb-4">
                  Save lists from other users to see them here.
                </CardDescription>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-6" style={{ gap: '24px' }}>
              {savedLists.map((list) => (
                <Link key={list.id} href={`/dashboard/lists/${list.publicId}`}>
                  <Card className="flex flex-col items-start justify-center p-4 border border-[#D1D5DB] rounded-lg bg-white min-h-[120px] hover:shadow-md transition-shadow cursor-pointer">
                    {/* Icon/Emoji */}
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-white border border-[#E5E7EB] rounded-full text-[24px] font-bold mb-3">
                        <span>{list.emoji || '📦'}</span>
                      </div>
                      {/* Text Info */}
                    <div className="flex flex-col items-start justify-center min-w-0 text-left w-full">
                      <div className="text-[16px] font-semibold text-[#111827] truncate w-full text-left">{list.title}</div>
                      <div className="text-[14px] font-medium text-[#6B7280] truncate mt-1 w-full text-left">{list.username || ''} &#8226; <LiveItemCount listId={list.id} initialCount={list.itemCount} /></div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="stats">
          <div className="text-center text-gray-500 py-12">Stats coming soon...</div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 