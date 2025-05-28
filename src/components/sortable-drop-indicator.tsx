'use client';

import { useDroppable } from '@dnd-kit/core';

interface SortableDropIndicatorProps {
  id: string;
  isActive: boolean;
  viewMode: 'LIST' | 'GALLERY';
}

export function SortableDropIndicator({ id, isActive, viewMode }: SortableDropIndicatorProps) {
  const { setNodeRef } = useDroppable({ id });

  if (!isActive) return null;

  return (
    <div
      ref={setNodeRef}
      className={`${
        viewMode === 'LIST' 
          ? 'h-3 w-full' 
          : 'h-full w-full min-h-[200px]'
      } bg-blue-500/20 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center transition-all duration-200`}
    >
      <div className="text-blue-600 text-sm font-medium opacity-75">
        {viewMode === 'LIST' ? 'Drop here' : 'Drop here'}
      </div>
    </div>
  );
} 