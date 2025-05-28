'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import Link from 'next/link';

interface List {
  id: string;
  publicId: string;
  title: string;
  description: string | null;
  emoji: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface DashboardClientProps {
  lists: List[];
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
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{list.emoji || '📝'}</span>
                    <CardTitle className="truncate">{list.title}</CardTitle>
                  </div>
                  {list.description && (
                    <CardDescription className="line-clamp-2">
                      {list.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>ID: {list.publicId}</span>
                    <span>{new Date(list.updatedAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 