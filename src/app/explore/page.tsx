import React from 'react';
import { headers } from 'next/headers';
import { ListCard, type ExploreListData } from '@/components/ui/list-card';

type ExploreList = ExploreListData & {
  createdAt: string;
  updatedAt: string;
};

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
      <div className="max-w-[960px] mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8 text-center">Explore Public Lists</h1>
        {error ? (
          <div className="text-center text-red-500 py-12">{error}</div>
        ) : lists.length === 0 ? (
          <div className="text-center text-gray-500 py-12">No public lists found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-6" style={{ gap: '24px' }}>
            {lists.map((list) => (
              <ListCard 
                key={list.id} 
                list={list} 
                variant="explore"
                showLiveCount={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 