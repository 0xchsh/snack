'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, ExternalLink, Edit, Trash2, Copy, GripVertical, Rows, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { EmojiPickerComponent } from '@/components/emoji-picker';
import { InlineEdit } from '@/components/inline-edit';
import { Favicon } from '@/components/favicon';
import { SortableListItem } from '@/components/sortable-list-item';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ViewModeToggle } from '@/components/view-mode-toggle';
import { GalleryListItem } from '@/components/gallery-list-item';
import { SortableDropIndicator } from '@/components/sortable-drop-indicator';
import { useToast } from "@/components/ui/use-toast"

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

interface List {
  id: string;
  publicId: string;
  title: string;
  description: string | null;
  emoji: string | null;
  viewMode: 'LIST' | 'GALLERY';
  createdAt: Date;
  updatedAt: Date;
  items: ListItem[];
  user: {
    id: string;
    username: string;
  };
}

interface ListViewClientProps {
  list: List;
}

export function ListViewClient({ list }: ListViewClientProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [url, setUrl] = useState('');
  const [items, setItems] = useState(list.items);
  const [isReordering, setIsReordering] = useState(false);
  const [viewMode, setViewMode] = useState<'LIST' | 'GALLERY'>(list.viewMode);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeletingList, setIsDeletingList] = useState(false);
  
  const [title, setTitle] = useState(list.title);
  const [description, setDescription] = useState(list.description || '');
  const [emoji, setEmoji] = useState(list.emoji || '');

  const { toast } = useToast()
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setItems(list.items);
    setTitle(list.title);
    setDescription(list.description || '');
    setEmoji(list.emoji || '');
  }, [list]);

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isAdding) return;

    setIsAdding(true);
    const urlsToAdd = url.trim().split(/[\s,]+/).filter(Boolean);

    try {
      const response = await fetch(`/api/lists/${list.publicId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlsToAdd[0] }), // Simplified for single URL for now
      });

      if (response.ok) {
        const newItem = await response.json();
        setItems(prev => [...prev, newItem]);
        setUrl('');
      } else {
        const errorData = await response.json();
        toast({
          variant: "destructive",
          title: "Failed to add link",
          description: errorData.error || "Could not parse the link.",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred.",
      })
    } finally {
      setIsAdding(false);
    }
  };

  const handleFieldUpdate = async (field: 'title' | 'description' | 'emoji', value: string | null) => {
    try {
      await fetch(`/api/lists/${list.publicId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      toast({
        title: `List ${field} updated!`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: `Could not update the list ${field}.`,
      })
    }
  };
  
  const copySnackLink = async () => {
    const snackLink = `${window.location.origin}/${list.user.username}/${list.publicId}`;
    await navigator.clipboard.writeText(snackLink);
    toast({
      title: "Copied to clipboard!",
      description: "The public link for your Snack is ready to share.",
    });
  };

  const viewPublicList = () => {
    window.open(`/${list.user.username}/${list.publicId}`, '_blank');
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/lists/${list.publicId}/items/${itemId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setItems(prev => prev.filter(item => item.id !== itemId));
        toast({ title: "Item deleted" });
      } else {
        throw new Error('Failed to delete item');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: "Could not delete the item.",
      })
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };
  
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      const newOrder = arrayMove(items, oldIndex, newIndex);
      setItems(newOrder);

      try {
        await fetch(`/api/lists/${list.publicId}/items/reorder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderedIds: newOrder.map((item) => item.id),
          }),
        });
      } catch (error) {
        setItems(items); // Revert on failure
        toast({
          variant: "destructive",
          title: "Reorder failed",
          description: "Could not save the new order.",
        })
      }
    }
  };

  const activeItem = items.find(item => item.id === activeId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Centered Content */}
      <main className="max-w-3xl mx-auto px-4 py-24 sm:py-32">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex items-center gap-4">
              <EmojiPickerComponent
                currentEmoji={emoji}
                onEmojiSelect={(newEmoji) => {
                  setEmoji(newEmoji);
                  handleFieldUpdate('emoji', newEmoji);
                }}
              />
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => handleFieldUpdate('title', title)}
                placeholder="The Best Architecture Spots"
                className="text-4xl md:text-5xl font-bold text-gray-800 bg-transparent focus:outline-none focus:ring-0 border-none p-0 w-full text-center"
              />
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => handleFieldUpdate('description', description)}
              placeholder="The top spots from a 20-year veteran"
              className="text-lg text-gray-600 bg-transparent focus:outline-none focus:ring-0 border-none p-0 w-full text-center resize-none"
              rows={1}
            />
          </div>

          {/* List Items */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {items.map(item => (
                  <SortableListItem 
                    key={item.id} 
                    item={item}
                    onDelete={() => handleDeleteItem(item.id)}
                  />
                ))}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeItem ? (
                <SortableListItem 
                  item={activeItem}
                  isDragOverlay
                  onDelete={() => {}}
                />
              ) : null}
            </DragOverlay>
          </DndContext>

        </div>
      </main>

      {/* Floating Dock */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center p-4">
        <div className="w-full max-w-3xl bg-white/80 backdrop-blur-md rounded-xl border border-gray-200 shadow-lg p-4">
          <div className="flex items-center justify-between gap-4">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <Button size="sm" variant={viewMode === 'LIST' ? 'secondary' : 'ghost'} className="p-2 h-auto" onClick={() => setViewMode('LIST')}>
                <Rows className="w-5 h-5" />
              </Button>
              <Button size="sm" variant={viewMode === 'GALLERY' ? 'secondary' : 'ghost'} className="p-2 h-auto" onClick={() => setViewMode('GALLERY')}>
                <LayoutGrid className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Add Link Input */}
            <form onSubmit={handleAddLink} className="flex-grow flex items-center">
              <Input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Type or paste a link (or multiple)"
                className="flex-grow !border-r-0 !rounded-r-none"
              />
              <Button type="submit" disabled={isAdding} className="!rounded-l-none">
                {isAdding ? 'Adding...' : 'Add Link'}
              </Button>
            </form>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={viewPublicList}>
                View <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="default" size="sm" onClick={copySnackLink}>
                Copy Link <Copy className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 