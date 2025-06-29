import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { Favicon } from '@/components/favicon';
import { Metadata } from 'next';
import Link from 'next/link';
import { SaveListButton } from '@/components/SaveListButton';
import { currentUser, clerkClient } from '@clerk/nextjs/server';
import { ListViewNavbar } from '@/components/list-view-navbar';

interface PublicListPageProps {
  params: Promise<{
    username: string;
    listId: string;
  }>;
}

// Function to get all necessary data for the page
async function getPageData(username: string, listId: string) {
  // 1. Fetch user from Clerk
  const client = await clerkClient();
  const response = await client.users.getUserList({ limit: 200 }); // Fetch a list of users
  // Find the user by checking the publicMetadata
  const clerkUser = response.data.find((u: { publicMetadata: { username?: string } }) => u.publicMetadata?.username === username);
  
  if (!clerkUser) return null;

  // 2. Fetch list data, ensuring it belongs to the correct user (via join on clerk_id)
  const { data: list, error } = await supabase
    .from('lists')
    .select('*, items(*), users!inner(clerk_id)')
    .eq('public_id', listId)
    .eq('users.clerk_id', clerkUser.id)
    .single();

  if (error || !list) return null;

  return {
    list: { ...list, users: { ...list.users, ...clerkUser } },
    clerkUser,
  };
}

// Generate metadata for SEO and social sharing
export async function generateMetadata({ params }: PublicListPageProps): Promise<Metadata> {
  const { username, listId } = await params;
  const pageData = await getPageData(username, listId);

  if (!pageData) {
    return { title: 'List Not Found' };
  }
  const { list } = pageData;
  const authorUsername = (list.users.publicMetadata as { username?: string })?.username || list.users.username || 'a user';
  
  const title = `${list.emoji ? list.emoji + ' ' : ''}${list.title} by @${authorUsername}`;
  const description = list.description || `A curated list of ${list.items.length} links by @${authorUsername}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `/${username}/${listId}`,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default async function PublicListPage({ params }: PublicListPageProps) {
  const { username, listId } = await params;
  const pageData = await getPageData(username, listId);

  if (!pageData) {
    notFound();
  }
  const { list } = pageData;

  // Determine if the current user has saved this list
  let initialSaved = false;
  const user = await currentUser();
  const isOwner = user && list.users?.clerk_id === user.id;
  if (user) {
    // Get the user's DB id
    const { data: dbUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', user.id)
      .single();
    if (dbUser) {
      const { data: saved } = await supabase
        .from('saved_lists')
        .select('id')
        .eq('user_id', dbUser.id)
        .eq('list_id', list.id)
        .maybeSingle();
      initialSaved = !!saved;
    }
  }

  const authorUsername = (list.users.publicMetadata as { username?: string })?.username || list.users.username;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <ListViewNavbar
          listId={list.id}
          listOwnerId={list.users?.clerk_id || ''}
          listTitle={list.title}
          publicId={listId}
          username={authorUsername}
          mode="view"
        />
      <div className="max-w-[960px] mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-left mb-12 max-w-[672px] mx-auto">
          {/* Emoji */}
          {list.emoji && (
            <div className="text-6xl mb-4">{list.emoji}</div>
          )}
          
          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
            {list.title}
          </h1>
          
          {/* Description */}
          {list.description && (
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              {list.description}
            </p>
          )}
          
          {/* Creator Info */}
          <div className="flex items-center gap-3 mb-8">
            <Image
              src={list.users.imageUrl}
              alt={authorUsername}
              width={48}
              height={48}
              className="w-12 h-12 rounded-full"
            />
            <div className="text-left">
              <div className="font-semibold text-gray-900 text-lg">
                {authorUsername}
              </div>
              <div className="text-sm text-gray-500">
                {(() => {
                  // Get user count from database or default
                  const userCount = 24; // This would come from database
                  const joinDate = new Date(list.users.createdAt);
                  const joinMonth = joinDate.toLocaleString('default', { month: 'short' });
                  const joinYear = joinDate.getFullYear();
                  return `${userCount} lists • Joined ${joinMonth} ${joinYear}`;
                })()}
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {!isOwner && <SaveListButton listId={list.id} initialSaved={initialSaved} />}
            {/* Share button would go here */}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 mb-8"></div>

      {/* List Items */}
      {list.view_mode === 'LIST' ? (
        <div className="max-w-[960px] mx-auto px-4">
          <div className="space-y-4">
            {list.items.map((item: any) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-sm transition-all duration-200 group border border-gray-200 bg-white rounded-lg">
                <CardContent className="p-6">
                  <a 
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-6 hover:cursor-pointer"
                  >
                    {/* Image */}
                    {item.image ? (
                      <div className="w-[120px] h-[120px] flex-shrink-0 relative overflow-hidden rounded-lg bg-gray-50">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="120px"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-[120px] h-[120px] flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                        <ExternalLink className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg text-gray-900 line-clamp-1 mb-2">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Favicon src={item.favicon} size={16} />
                        <span className="truncate">
                          {new URL(item.url).hostname}
                        </span>
                      </div>
                    </div>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-[1296px] mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {list.items.map((item: any) => (
              <Card key={item.id} className="group hover:shadow-sm transition-all duration-200 border border-gray-200 bg-white overflow-hidden rounded-lg">
                <CardContent className="p-0">
                  <a 
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block hover:cursor-pointer"
                  >
                    {/* Image */}
                    <div className="w-full aspect-[16/10] relative bg-gray-100 overflow-hidden">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-50 to-gray-100">
                          <ExternalLink className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-base text-gray-900 line-clamp-1 mb-2">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Favicon src={item.favicon} size={14} />
                        <span className="truncate">
                          {new URL(item.url).hostname}
                        </span>
                      </div>
                    </div>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {list.items.length === 0 && (
        <div className="text-center py-20">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
            <span className="text-3xl text-gray-400">🔗</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No links yet</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            This list is still being curated. Check back soon for amazing links!
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center mt-16 pt-8 border-t border-gray-200/60">
        <div className="inline-flex items-center gap-2 text-sm text-gray-500">
          <span>Create your own curated lists at</span>
          <a 
            href="/" 
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
          >
            <span className="text-lg">🍿</span>
            <span>Snack</span>
          </a>
        </div>
      </div>
    </div>
    </div>
    </>
  );
} 