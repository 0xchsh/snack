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

interface SortableListItemProps {
  item: ListItem;
  onDelete: (itemId: string) => void;
  isDeleting?: boolean;
  isDragOverlay?: boolean;
}

export function SortableListItem({ item, onDelete, isDeleting = false, isDragOverlay = false }: SortableListItemProps) {
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

  return (
    <div
      ref={isDragOverlay ? undefined : setNodeRef}
      style={isDragOverlay ? undefined : style}
      className={`${isDragging && !isDragOverlay ? 'opacity-50' : ''} ${isDeleting ? 'opacity-50 pointer-events-none' : ''} transition-all duration-200 relative`}
    >
      <Card className={`overflow-hidden hover:shadow-md transition-all duration-200 group border border-[#D1D5DB] ${isDragging && !isDragOverlay ? 'bg-gray-200 border-gray-300' : 'bg-white'} rounded-lg ${isDragOverlay ? 'shadow-xl' : ''} gap-0 py-0`}>
        <CardContent 
          className={`p-2 ${!isDragOverlay ? 'cursor-grab active:cursor-grabbing' : ''}`}
          {...(!isDragOverlay ? attributes : {})}
          {...(!isDragOverlay ? listeners : {})}
        >
          <div className="flex items-center gap-3">
            {/* Image */}
            <div className={`w-[137px] h-[72px] flex-shrink-0 relative overflow-hidden rounded ${isDragging && !isDragOverlay ? 'bg-gray-200' : 'bg-gray-50'}`}>
              {item.image && item.image.trim() !== '' && !imageError && !(isDragging && !isDragOverlay) ? (
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-200"
                  sizes="137px"
                  unoptimized
                  onError={() => {
                    console.log('Image failed to load:', item.image);
                    setImageError(true);
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-50 to-gray-100 rounded">
                  <ExternalLink className="h-4 w-4" />
                </div>
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 flex flex-col justify-center min-w-0 h-[72px]">
              <div className="space-y-1">
                <h3 className={`font-medium line-clamp-2 leading-tight text-sm transition-colors duration-200 ${isDragging && !isDragOverlay ? 'text-gray-400' : 'text-gray-900'}`}>
                  {item.title}
                </h3>
                <div 
                  className={`flex items-center gap-1.5 text-xs ${isDragging && !isDragOverlay ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-200`}
                >
                  <Favicon src={item.favicon} size={12} />
                  <span className="truncate">
                    {new URL(item.url).hostname}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            {!isDragOverlay && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 relative z-20">
                {/* Delete Button */}
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
                  onPointerDown={(e) => {
                    e.stopPropagation();
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                  }}
                  disabled={isDeleting}
                  className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 disabled:opacity-50 rounded h-6 w-6 cursor-pointer relative z-30"
                  data-delete-button
                >
                  {isDeleting ? (
                    <div className="animate-spin rounded-full h-2.5 w-2.5 border-b-2 border-red-500"></div>
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 