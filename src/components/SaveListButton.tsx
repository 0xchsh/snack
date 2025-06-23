'use client';

import { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SaveListButtonProps {
  listId: string;
  initialSaved: boolean;
}

export function SaveListButton({ listId, initialSaved }: SaveListButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/saved-lists', {
        method: saved ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId }),
      });
      const result = await res.json();
      if (!res.ok) {
        console.error('Save/Unsave error:', result.error);
        toast.error(result.error || 'Failed to update saved state');
        throw new Error(result.error || 'Failed to update saved state');
      }
      setSaved(!saved);
      toast.success(saved ? 'List unsaved!' : 'List saved!');
      window.dispatchEvent(new Event('snack:saved-list-changed'));
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Error');
      toast.error(err.message || 'Error saving list');
      console.error('SaveListButton error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      disabled={loading}
      aria-pressed={saved}
      className="flex items-center gap-2"
    >
      {saved ? 'Unsave' : 'Save'}
      <Bookmark className="w-4 h-4" fill={saved ? 'currentColor' : 'none'} />
    </Button>
  );
} 