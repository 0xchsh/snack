import React from 'react';
import { headers } from 'next/headers';

interface ExploreList {
  id: string;
  publicId: string;
  title: string;
  emoji: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  itemCount: number;
  user: {
    username: string;
    imageUrl: string;
  } | null;
}

async function fetchExploreListsSSR(): Promise<{ lists: ExploreList[]; count: number }> {
  let url = '/api/explore?limit=20&offset=0';
  try {
    // On SSR, build an absolute URL using headers
    if (typeof window === 'undefined') {
      const host = (await headers()).get('host');
      const protocol = host?.startsWith('localhost') ? 'http' : 'https';
      url = `${protocol}://${host}/api/explore?limit=20&offset=0`;
    }
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch lists');
    return res.json();
  } catch (e: any) {
    throw new Error(`Failed to parse URL from ${url}`);
  }
}

export default async function ExplorePage() {
  let lists: ExploreList[] = [];
  let count = 0;
  let error = '';
  try {
    const data = await fetchExploreListsSSR();
    lists = data.lists;
    count = data.count;
  } catch (e: any) {
    error = e.message || 'Unknown error';
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8 text-center">Explore Public Lists</h1>
        {error ? (
          <div className="text-center text-red-500 py-12">{error}</div>
        ) : lists.length === 0 ? (
          <div className="text-center text-gray-500 py-12">No public lists found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {lists.map((list) => (
              <div key={list.id} className="bg-white rounded-xl shadow border p-6 flex flex-col gap-3 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{list.emoji || '📦'}</span>
                  <span className="font-semibold text-lg truncate">{list.title}</span>
                </div>
                <div className="text-gray-600 text-sm line-clamp-2 mb-2">{list.description}</div>
                <div className="flex items-center gap-2 mt-auto">
                  {list.user?.imageUrl && (
                    <img src={list.user.imageUrl} alt={list.user.username} className="w-7 h-7 rounded-full object-cover border" />
                  )}
                  <span className="text-xs text-gray-500">@{list.user?.username || 'unknown'}</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-xs text-gray-500">{list.itemCount} items</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 