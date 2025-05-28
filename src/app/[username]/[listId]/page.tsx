import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { Favicon } from '@/components/favicon';
import { Metadata } from 'next';

interface PublicListPageProps {
  params: Promise<{
    username: string;
    listId: string;
  }>;
}

// Generate metadata for SEO and social sharing
export async function generateMetadata({ params }: PublicListPageProps): Promise<Metadata> {
  const { username, listId } = await params;
  
  const list = await prisma.list.findFirst({
    where: {
      publicId: listId,
      user: {
        username: username,
      },
    },
    include: {
      user: true,
      items: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!list) {
    return {
      title: 'List Not Found',
    };
  }

  const title = `${list.emoji ? list.emoji + ' ' : ''}${list.title} by ${list.user.username}`;
  const description = list.description || `A curated list of ${list.items.length} links by ${list.user.username}`;

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

  // Fetch the list with user and items
  const list = await prisma.list.findFirst({
    where: {
      publicId: listId,
      user: {
        username: username,
      },
    },
    include: {
      user: true,
      items: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!list) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-[960px] mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            {list.emoji && (
              <span className="text-5xl drop-shadow-sm">{list.emoji}</span>
            )}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              {list.title}
            </h1>
          </div>
          
          {list.description && (
            <p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
              {list.description}
            </p>
          )}
          
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200 shadow-sm">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {list.user.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm text-gray-600">Curated by</span>
            <span className="font-semibold text-gray-900">{list.user.username}</span>
            <span className="text-gray-400">•</span>
            <span className="text-sm text-gray-600">
              {list.items.length} {list.items.length === 1 ? 'link' : 'links'}
            </span>
          </div>
        </div>

        {/* List Items */}
        {list.viewMode === 'LIST' ? (
          <div className="max-w-[672px] mx-auto">
            <div className="space-y-3">
              {list.items.map((item, index) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-md transition-all duration-200 group border border-gray-200 bg-white h-full rounded-xl gap-0 py-0">
                  <CardContent className="p-0 h-full flex flex-col">
                    <a 
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2 h-[72px] hover:cursor-pointer"
                    >
                      {/* Image */}
                      {item.image ? (
                        <div className="w-[137px] h-[72px] flex-shrink-0 relative overflow-hidden rounded-lg bg-gray-50">
                          <Image
                            src={item.image}
                            alt={item.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-200"
                            sizes="137px"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-[137px] h-[72px] flex-shrink-0 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center">
                          <ExternalLink className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0 h-[72px] flex flex-col justify-center">
                        <div className="space-y-1">
                          <h3 className="font-medium line-clamp-2 leading-snug text-sm transition-colors duration-200 text-gray-900 group-hover:text-blue-600">
                            {item.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Favicon src={item.favicon} size={12} />
                            <span className="truncate hover:text-blue-600 transition-colors duration-200">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {list.items.map((item, index) => (
              <Card key={item.id} className="group hover:shadow-md transition-all duration-200 border border-gray-200 bg-white h-full gap-0 py-0 cursor-pointer rounded-xl">
                <CardContent className="p-0 h-full flex flex-col">
                  <a 
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col h-full hover:cursor-pointer"
                  >
                    {/* Image */}
                    <div className="w-full aspect-[1.91/1] relative bg-gray-100 overflow-hidden rounded-t-lg">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-200"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
                        <h3 className="font-medium line-clamp-2 leading-snug text-sm transition-colors duration-200 text-gray-900 group-hover:text-blue-600">
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
            ))}
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
  );
} 