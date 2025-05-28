'use client';

import { Button } from '@/components/ui/button';
import { LayoutGrid, List } from 'lucide-react';

interface ViewModeToggleProps {
  viewMode: 'LIST' | 'GALLERY';
  onViewModeChange: (mode: 'LIST' | 'GALLERY') => void;
  disabled?: boolean;
}

export function ViewModeToggle({ viewMode, onViewModeChange, disabled = false }: ViewModeToggleProps) {
  return (
    <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
      <Button
        variant={viewMode === 'LIST' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('LIST')}
        disabled={disabled}
        className={`px-2 py-1.5 text-xs font-medium transition-all cursor-pointer ${
          viewMode === 'LIST' 
            ? 'bg-white shadow-sm text-gray-900' 
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === 'GALLERY' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('GALLERY')}
        disabled={disabled}
        className={`px-2 py-1.5 text-xs font-medium transition-all cursor-pointer ${
          viewMode === 'GALLERY' 
            ? 'bg-white shadow-sm text-gray-900' 
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
    </div>
  );
} 