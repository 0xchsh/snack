'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, GripVertical, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { Favicon } from '@/components/favicon';
import { Button } from '@/components/ui/button';

interface ListItem {
  id: string;
  title: string;
  url: string;
  description: string | null;
  image: string | null;
  favicon: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

interface GalleryListItemProps {
  item: ListItem;
  onDelete: (itemId: string) => void;
  isDeleting?: boolean;
  isDragOverlay?: boolean;
}

export function GalleryListItem({ item, onDelete, isDeleting = false, isDragOverlay = false }: GalleryListItemProps) {
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

  const [imageError, setImageError] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this link?')) {
      onDelete(item.id);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on delete button or drag handle
    if ((e.target as HTMLElement).closest('[data-delete-button]') || 
        (e.target as HTMLElement).closest('[data-drag-handle]')) {
      return;
    }
    
    // Open link in new tab
    window.open(item.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      ref={isDragOverlay ? undefined : setNodeRef}
      style={isDragOverlay ? undefined : style}
      className={`${isDragging && !isDragOverlay ? 'opacity-50' : ''} ${isDeleting ? 'opacity-50 pointer-events-none' : ''} transition-all duration-200 relative h-full`}
    >
      <Card className={`overflow-hidden hover:shadow-md transition-all duration-200 group border border-gray-200 ${isDragging && !isDragOverlay ? 'bg-gray-200 border-gray-300' : 'bg-white'} h-full rounded-xl ${isDragOverlay ? 'shadow-xl' : ''} gap-0 py-0`}>
        <CardContent className="p-0 h-full flex flex-col">
          <div 
            className={`flex flex-col h-full ${!isDragOverlay ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
            {...(!isDragOverlay ? attributes : {})}
            {...(!isDragOverlay ? listeners : {})}
          >
            {/* Delete Button - Positioned absolutely */}
            {!isDragOverlay && (
              <div 
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-40"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                  }}
                  disabled={isDeleting}
                  className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 disabled:opacity-50 rounded-lg h-7 w-7 bg-white/90 backdrop-blur-sm shadow-sm cursor-pointer relative z-50"
                  data-delete-button
                >
                  {isDeleting ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-500"></div>
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            )}

            {/* Image */}
            <div className={`w-full aspect-[1.91/1] relative overflow-hidden rounded-t-xl ${isDragging && !isDragOverlay ? 'bg-gray-200' : 'bg-gray-50'}`}>
              {item.image && !imageError && !(isDragging && !isDragOverlay) ? (
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-200"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  unoptimized
                  onError={() => {
                    console.log('Image failed to load:', item.image);
                    setImageError(true);
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-50 to-gray-100 rounded-t-xl">
                  <ExternalLink className="h-8 w-8" />
                </div>
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 p-3 flex flex-col justify-between">
              <div className="space-y-1">
                <h3 className={`font-medium line-clamp-1 leading-snug text-sm transition-colors duration-200 ${isDragging && !isDragOverlay ? 'text-gray-400' : 'text-gray-900'}`}>
                  {item.title}
                </h3>
              </div>
              
              <div className={`flex items-center gap-2 text-xs mt-2 ${isDragging && !isDragOverlay ? 'text-gray-400' : 'text-gray-500'}`}>
                <Favicon src={item.favicon} size={12} />
                <span className="truncate">
                  {new URL(item.url).hostname}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 