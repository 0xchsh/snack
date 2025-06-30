'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bookmark, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface SaveAndCopyButtonsProps {
  listId: string;
  initialSaved: boolean;
  isOwner: boolean;
}

export function SaveAndCopyButtons({ listId, initialSaved, isOwner }: SaveAndCopyButtonsProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const isSignedIn = !!user;
  const router = useRouter();

  const handleSave = async () => {
    if (!isSignedIn) {
      // Redirect to sign up for non-authenticated users
      router.push('/auth/sign-up');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/saved-lists', {
        method: saved ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || 'Failed to update saved state');
        throw new Error(result.error || 'Failed to update saved state');
      }
      setSaved(!saved);
      toast.success(saved ? 'List unsaved!' : 'List saved!');
    } catch (err: any) {
      toast.error(err.message || 'Error saving list');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className="flex gap-2">
      {!isOwner && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
          className="border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg cursor-pointer"
        >
          {isSaving ? 'Saving...' : saved ? 'Unsave' : 'Save'}
          <Bookmark className="h-4 w-4 ml-2" fill={saved ? 'currentColor' : 'none'} />
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className="border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg cursor-pointer"
      >
        Copy
        <Copy className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}