'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, Trash2, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Favicon } from '@/components/favicon';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ListItem {
  id: string;
  title: string;
  url: string;
  description: string | null;
  image: string | null;
  favicon: string | null;
  order?: number;
}

interface GalleryListItemProps {
  item: ListItem;
  onDelete: (itemId: string) => void;
  isDeleting?: boolean;
  isDragOverlay?: boolean;
}

export const GalleryListItem = ({ item, onDelete, isDeleting = false, isDragOverlay = false }: GalleryListItemProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: item.id,
    disabled: isDragOverlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={isDragOverlay ? undefined : setNodeRef}
      style={isDragOverlay ? undefined : style}
      className={`group hover:shadow-md transition-all duration-200 border border-gray-200 bg-white h-full gap-0 rounded-xl ${isDragOverlay ? 'opacity-80' : ''} ${isDragging && !isDragOverlay ? 'opacity-50' : ''} ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <Card className="h-full bg-transparent shadow-none border-0 p-0 m-0">
        <CardContent 
          className={`p-0 h-full flex flex-col m-0 ${!isDragOverlay ? 'cursor-grab active:cursor-grabbing' : ''}`}
          {...(!isDragOverlay ? attributes : {})}
          {...(!isDragOverlay ? listeners : {})}
        >
          <a 
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col h-full cursor-inherit"
          >
            {/* Image */}
            <div className="w-full aspect-[1.91/1] relative bg-gray-100 overflow-hidden rounded-t-lg">
              {item.image && item.image.trim() !== '' && !imageError ? (
                <>
                  {imageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                      <div className="animate-pulse bg-gray-200 w-8 h-8 rounded"></div>
                    </div>
                  )}
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className={`object-cover group-hover:scale-110 transition-transform duration-200 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                    unoptimized
                    onError={() => {
                      setImageError(true);
                      setImageLoading(false);
                    }}
                    onLoad={() => setImageLoading(false)}
                  />
                </>
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
          {/* Delete button overlay */}
          {!isDragOverlay && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity md:opacity-100 md:group-hover:opacity-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (confirm('Are you sure you want to delete this link?')) {
                    onDelete(item.id);
                  }
                }}
                disabled={isDeleting}
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full h-8 w-8"
              >
                {isDeleting ? (
                  <Loader2 className="h-3 w-3 animate-spin text-red-500" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
