'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

// Types for different list data structures
export interface BaseListData {
  id: string;
  publicId: string;
  title: string;
  emoji: string | null;
  itemCount?: number;
}

export interface DashboardListData extends BaseListData {
  username?: string;
}

export interface ExploreListData extends BaseListData {
  description: string | null;
  user: {
    username: string;
    imageUrl?: string | null;
  } | null;
}

export type ListCardData = DashboardListData | ExploreListData;

export interface ListCardProps {
  list: ListCardData;
  variant?: 'dashboard' | 'explore' | 'profile';
  href?: string;
  showLiveCount?: boolean;
}

// LiveItemCount component - shows real-time item count from Supabase
function LiveItemCount({ listId, initialCount }: { listId: string, initialCount?: number }) {
  const [count, setCount] = useState<number | undefined>(initialCount);
  
  useEffect(() => {
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

// Helper function to determine if list has explore data
function isExploreList(list: ListCardData): list is ExploreListData {
  return 'user' in list;
}

// Helper function to get the username from either data structure
function getUsername(list: ListCardData): string {
  if (isExploreList(list)) {
    return list.user?.username || 'unknown';
  }
  return (list as DashboardListData).username || '';
}

// Helper function to get the description (only available in explore data)
function getDescription(list: ListCardData): string | null {
  if (isExploreList(list)) {
    return list.description;
  }
  return null;
}

export function ListCard({ 
  list, 
  variant = 'dashboard', 
  href,
  showLiveCount = true 
}: ListCardProps) {
  // Generate href if not provided
  const linkHref = href || (
    variant === 'dashboard' 
      ? `/dashboard/lists/${list.publicId}`
      : `/${getUsername(list)}/${list.publicId}`
  );

  const username = getUsername(list);
  const description = getDescription(list);

  return (
    <Link href={linkHref}>
      <Card className="flex flex-col items-start justify-center p-4 border border-[#D1D5DB] rounded-xl bg-white min-h-[120px] hover:shadow-md transition-shadow cursor-pointer">
        {/* Emoji Icon - Dashboard style with circular border */}
        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-white border border-[#E5E7EB] rounded-full text-[24px] font-bold mb-3">
          <span>{list.emoji || '📦'}</span>
        </div>
        
        {/* Content */}
        <div className="flex flex-col items-start justify-center min-w-0 text-left w-full">
          {/* Title */}
          <div className="text-[16px] font-semibold text-[#111827] truncate w-full text-left max-w-[720px]">
            {list.title}
          </div>
          
          {/* Description - Always hidden */}
          
          {/* Subtitle with username and item count */}
          <div className="text-[14px] font-medium text-[#6B7280] truncate mt-1 w-full text-left">
            {username && (
              <>
                {variant === 'explore' ? '@' : ''}{username}
                {(showLiveCount || list.itemCount !== undefined) && ' • '}
              </>
            )}
            {showLiveCount ? (
              <LiveItemCount listId={list.id} initialCount={list.itemCount} />
            ) : (
              list.itemCount !== undefined && `${list.itemCount} item${list.itemCount === 1 ? '' : 's'}`
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}