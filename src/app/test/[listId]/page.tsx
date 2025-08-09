import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { Favicon } from '@/components/favicon';
import { Metadata } from 'next';
import { ListViewNavbar } from '@/components/list-view-navbar';
import { SaveAndCopyButtons } from '@/components/SaveAndCopyButtons';

interface TestListPageProps {
  params: Promise<{
    listId: string;
  }>;
}

// Function to get test list data (bypasses Clerk lookup)
async function getTestListData(listId: string) {
  const supabase = await createClient();
  // Fetch list data directly for test user
  const { data: list, error } = await supabase
    .from('lists')
    .select(`
      *,
      items(*),
      users!inner(*)
    `)
    .eq('public_id', listId)
    .eq('users.username', 'test')
    .single();

  if (error || !list) return null;

  return { list };
}

// Generate metadata for SEO and social sharing
export async function generateMetadata({ params }: TestListPageProps): Promise<Metadata> {
  const { listId } = await params;
  const pageData = await getTestListData(listId);

  if (!pageData) {
    return { title: 'List Not Found' };
  }
  const { list } = pageData;
  
  const title = `${list.emoji ? list.emoji + ' ' : ''}${list.title} by @test`;
  const description = list.description || `A curated list of ${list.items.length} links by @test`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `/test/${listId}`,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default async function TestListPage({ params }: TestListPageProps) {
  const { listId } = await params;
  const pageData = await getTestListData(listId);

  if (!pageData) {
    notFound();
  }
  const { list } = pageData;

  return (
    <>
      <ListViewNavbar
        listId={list.id}
        listOwnerId="test_user_123"
        listTitle={list.title}
        publicId={listId}
        username="test"
        mode="view"
      />
      
      <div className="max-w-[960px] mx-auto space-y-8 px-4 py-8">
        {/* Header */}
        <div className="space-y-6">
          <div className="text-left space-y-4 max-w-[672px] mx-auto">
            <div className="flex items-center gap-2">
              <div className="text-5xl">
                {list.emoji || '📝'}
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-left">
                {list.title}
              </h1>
              {list.description && (
                <p className="text-xl text-muted-foreground text-left">
                  {list.description}
                </p>
              )}
            </div>
          </div>

          {/* Author Info Section */}
          <div className="max-w-[672px] mx-auto">
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  T
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">
                    @test
                  </div>
                  <div className="text-sm text-gray-500">
                    Test user • 4 lists • Demo account
                  </div>
                </div>
                <SaveAndCopyButtons 
                  listId={list.id} 
                  initialSaved={false}
                  isOwner={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-8"></div>

      <div className="space-y-4">
        {/* Links */}
        {list.items.length === 0 ? (
          <div className="text-center py-20 max-w-[960px] mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">🔗</span>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-gray-900">No links yet</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                This list is still being curated. Check back soon for amazing links!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className={`flex items-center justify-between ${list.view_mode === 'LIST' ? 'max-w-[672px] mx-auto' : 'max-w-[1296px] mx-auto'}`}>
              <p className="text-sm text-gray-600">
                {list.items.length} {list.items.length === 1 ? 'link' : 'links'}
              </p>
            </div>
            
            {list.view_mode === 'LIST' ? (
              <div className="max-w-[672px] mx-auto">
                <div className="space-y-3">
                  {list.items.map((item: any) => (
                    <Card key={item.id} className="overflow-hidden hover:shadow-md transition-all duration-200 group border border-[#D1D5DB] bg-white rounded-lg gap-0">
                      <CardContent className="p-3 sm:p-4">
                        <a 
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 sm:gap-4 hover:cursor-pointer"
                        >
                          {/* Image */}
                          <div className="w-[80px] h-[60px] sm:w-[120px] sm:h-[72px] flex-shrink-0 relative overflow-hidden rounded bg-gray-50">
                            {item.image && item.image.trim() !== '' ? (
                              <Image
                                src={item.image}
                                alt={item.title}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-200"
                                sizes="(max-width: 640px) 80px, 120px"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-50 to-gray-100 rounded">
                                <ExternalLink className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 flex flex-col justify-center min-w-0 h-[60px] sm:h-[72px]">
                            <div className="space-y-1">
                              <h3 className="font-medium line-clamp-2 leading-tight text-xs sm:text-sm transition-colors duration-200 text-gray-900"> 
                                {item.title}
                              </h3>
                              <div className="flex items-center gap-1.5 text-xs text-gray-500 transition-colors duration-200">
                                <Favicon src={item.favicon} size={12} />
                                <span className="truncate text-xs">
                                  {new URL(item.url).hostname}
                                </span>
                              </div>
                            </div>
                          </div>
                        </a>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 max-w-[1296px] mx-auto px-4">
                {list.items.map((item: any) => (
                  <div key={item.id} className="group hover:shadow-md transition-all duration-200 border border-gray-200 bg-white h-full gap-0 rounded-xl">
                    <Card className="h-full bg-transparent shadow-none border-0 p-0 m-0">
                      <CardContent className="p-0 h-full flex flex-col m-0">
                        <a 
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col h-full cursor-pointer"
                        >
                          {/* Image */}
                          <div className="w-full aspect-[1.91/1] relative bg-gray-100 overflow-hidden rounded-t-lg">
                            {item.image && item.image.trim() !== '' ? (
                              <Image
                                src={item.image}
                                alt={item.title}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-200"
                                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-50 to-gray-100">
                                <ExternalLink className="h-8 w-8" />
                              </div>
                            )}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 p-3 flex flex-col justify-between">
                            <div className="space-y-1">
                              <h3 className="font-medium truncate leading-snug text-sm transition-colors duration-200 text-gray-900">
                                {item.title}
                              </h3>
                            </div>
                            <div className="flex items-center gap-2 text-xs mt-2 text-gray-500">
                              <Favicon src={item.favicon} size={12} />
                              <span className="truncate">
                                {new URL(item.url).hostname}
                              </span>
                            </div>
                          </div>
                        </a>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}