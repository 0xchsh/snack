'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

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

export function DashboardClient({ lists }: DashboardClientProps) {
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const handleCreateList = async () => {
    setIsCreating(true);

    try {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // No data needed, API will use defaults
      });

      if (response.ok) {
        const newList = await response.json();
        // Navigate directly to the new list
        router.push(`/dashboard/lists/${newList.publicId}`);
      } else {
        console.error('Failed to create list');
        alert('Failed to create list. Please try again.');
      }
    } catch (error) {
      console.error('Error creating list:', error);
      alert('Error creating list. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create New List Button */}
      <Button 
        className="w-full sm:w-auto" 
        onClick={handleCreateList}
        disabled={isCreating}
      >
        <Plus className="mr-2 h-4 w-4" />
        {isCreating ? 'Creating...' : 'Create New List'}
      </Button>

      {/* Lists Grid */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lists.map((list) => (
            <Link key={list.id} href={`/dashboard/lists/${list.publicId}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer p-0 overflow-hidden border-2 border-gray-200">
                {/* Image Stack */}
                <div className="relative h-32 w-full flex items-end justify-center bg-gradient-to-tr from-orange-100 to-purple-100">
                  {/* Simulate stack with colored divs */}
                  <div className="absolute left-6 top-4 w-4/5 h-20 rounded-xl bg-purple-200 z-0" style={{ filter: 'blur(2px)' }} />
                  <div className="absolute left-3 top-2 w-4/5 h-24 rounded-xl bg-orange-200 z-10" style={{ filter: 'blur(1px)' }} />
                  <div className="relative w-11/12 h-28 rounded-xl bg-white z-20 flex items-center justify-center overflow-hidden shadow-md">
                    {/* Main image or emoji fallback */}
                    <span className="text-5xl">{list.emoji || '📝'}</span>
                  </div>
                </div>
                {/* Info Section */}
                <div className="flex items-center gap-4 px-6 py-5 border-t border-gray-100 bg-white">
                  {/* Avatar */}
                  <div className="flex-shrink-0 w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-3xl border border-gray-200">
                    <span>{list.emoji || '🌐'}</span>
                  </div>
                  {/* Text Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xl leading-tight truncate">{list.title}</div>
                    <div className="text-gray-500 text-base truncate">{list.username || ''}</div>
                    <div className="text-gray-400 text-sm mt-1">
                      <LiveItemCount listId={list.id} initialCount={list.itemCount} /> · 72K views
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 