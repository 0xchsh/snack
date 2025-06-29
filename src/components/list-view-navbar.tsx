'use client';

import Link from 'next/link';
import { ArrowLeft, Edit, Share, Bookmark } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useState } from 'react';

interface ListViewNavbarProps {
  listId: string;
  listOwnerId: string;
  listTitle: string;
  publicId: string;
  username: string;
}

export function ListViewNavbar({ 
  listId, 
  listOwnerId, 
  listTitle, 
  publicId,
  username 
}: ListViewNavbarProps) {
  const { isSignedIn, user } = useUser();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  
  // Check if current user owns this list
  const isOwner = isSignedIn && user?.id === listOwnerId;

  const handleBack = () => {
    router.back();
  };

  const handleSave = async () => {
    if (!isSignedIn) {
      // Redirect to sign up for public users
      router.push('/sign-up');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/saved-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId }),
      });

      if (response.ok) {
        // Show success feedback
        console.log('List saved successfully');
      } else {
        console.error('Failed to save list');
      }
    } catch (error) {
      console.error('Error saving list:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: listTitle,
          text: `Check out this list: ${listTitle}`,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled sharing or error occurred
        fallbackShare();
      }
    } else {
      fallbackShare();
    }
  };

  const fallbackShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      // Show success message
      console.log('Link copied to clipboard');
    }).catch(() => {
      console.error('Failed to copy link');
    });
  };

  if (isSignedIn) {
    return (
      <nav className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-6 h-14">
        {/* Left: Back button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-700 hover:text-orange-600 font-medium transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="hidden sm:inline">Back</span>
        </button>
        
        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          {isOwner ? (
            // Owner actions: Edit + Share
            <>
              <Link
                href={`/dashboard/lists/${publicId}`}
                className="flex items-center gap-2 text-gray-700 hover:text-orange-600 font-medium transition-colors"
                title="Edit list"
              >
                <Edit size={18} />
                <span className="hidden sm:inline">Edit</span>
              </Link>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 text-gray-700 hover:text-orange-600 font-medium transition-colors"
                title="Share list"
              >
                <Share size={18} />
                <span className="hidden sm:inline">Share</span>
              </button>
            </>
          ) : (
            // Non-owner actions: Save + Share
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 text-gray-700 hover:text-orange-600 font-medium transition-colors disabled:opacity-50"
                title="Save list"
              >
                <Bookmark size={18} />
                <span className="hidden sm:inline">
                  {isSaving ? 'Saving...' : 'Save'}
                </span>
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 text-gray-700 hover:text-orange-600 font-medium transition-colors"
                title="Share list"
              >
                <Share size={18} />
                <span className="hidden sm:inline">Share</span>
              </button>
            </>
          )}
        </div>
      </nav>
    );
  }

  // Public user navbar
  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-6 h-14">
      {/* Left: Made with Snack badge */}
      <Link 
        href="/" 
        className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors"
      >
        <span className="text-sm font-medium">Made with</span>
        <span className="font-bold text-orange-600">Snack</span>
        <span className="text-lg">🍿</span>
      </Link>
      
      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 text-gray-700 hover:text-orange-600 font-medium transition-colors"
          title="Save list (requires sign up)"
        >
          <Bookmark size={18} />
          <span className="hidden sm:inline">Save</span>
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-2 text-gray-700 hover:text-orange-600 font-medium transition-colors"
          title="Share list"
        >
          <Share size={18} />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>
    </nav>
  );
}