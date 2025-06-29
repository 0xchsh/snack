'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, ExternalLink, Edit, Trash2, Copy } from 'lucide-react';
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
  const [isAddLinkDialogOpen, setIsAddLinkDialogOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [url, setUrl] = useState('');
  const [isUpdatingEmoji, setIsUpdatingEmoji] = useState(false);
  const [items, setItems] = useState(list.items);
  const [isReordering, setIsReordering] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'LIST' | 'GALLERY'>(list.viewMode);
  const [isUpdatingViewMode, setIsUpdatingViewMode] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle Ctrl/Cmd + V to paste links directly
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Check for Ctrl+V (Windows/Linux) or Cmd+V (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        console.log('🔍 Command+V detected');
        
        const activeElement = document.activeElement;
        const isInInputField = activeElement && (
          activeElement.tagName === 'INPUT' || 
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.getAttribute('contenteditable') === 'true'
        );

        console.log('📝 Is in input field:', isInInputField);

        // If user is in input field, allow normal paste behavior
        if (isInInputField) {
          console.log('✅ Allowing normal paste in input field');
          return;
        }

        try {
          // Check if clipboard API is available and we have permission
          if (!navigator.clipboard || !navigator.clipboard.readText) {
            console.log('❌ Clipboard API not available');
            return;
          }

          const clipboardText = await navigator.clipboard.readText();
          console.log('📋 Clipboard content:', clipboardText);
          
          if (!clipboardText.trim()) {
            console.log('❌ Clipboard is empty');
            return;
          }

          // Check if clipboard contains valid URLs
          const urls = clipboardText.trim().split(/[\s,\n\r]+/).filter(urlString => {
            const cleanUrl = urlString.trim();
            if (!cleanUrl) return false;
            
            try {
              const urlObj = new URL(cleanUrl);
              return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
            } catch {
              try {
                const urlWithProtocol = cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`;
                const urlObj = new URL(urlWithProtocol);
                return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
              } catch {
                return false;
              }
            }
          });

          console.log('🔗 Valid URLs found:', urls);

          // If we found valid URLs, prevent default and add them to the list
          if (urls.length > 0) {
            console.log('✅ Preventing default and calling handlePasteFromClipboard');
            e.preventDefault();
            await handlePasteFromClipboard();
          } else {
            console.log('❌ No valid URLs found');
          }
          
        } catch (error) {
          if (error instanceof Error && error.name === 'NotAllowedError') {
            console.log('🚫 Clipboard permission denied. Try clicking the "⌘V Paste link" button instead.');
            // Don't show alert for permission denied, just log it
          } else {
            console.error('Error reading clipboard:', error);
          }
        }
      }

      // Check for Ctrl+Enter (Windows/Linux) or Cmd+Enter (Mac) to add links
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (url.trim()) {
          const mockEvent = { preventDefault: () => {} } as React.FormEvent;
          await handleAddLink(mockEvent);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [list.publicId, url, isAdding]);

  // Sync local items state with prop when list.items changes
  useEffect(() => {
    setItems(list.items);
  }, [list.items]);

  const handlePasteFromClipboard = async () => {
    if (isAdding) return;
    
    try {
      // Check if clipboard API is available
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        alert('Clipboard API not available. Please paste the URL manually in the input field.');
        return;
      }

      const clipboardText = await navigator.clipboard.readText();
      if (!clipboardText.trim()) {
        alert('Clipboard is empty. Copy a URL first, then try again.');
        return;
      }

      setIsAdding(true);
      
      // Process the clipboard content
      const urls = clipboardText.trim().split(/[\s,\n\r]+/).filter(urlString => {
        const cleanUrl = urlString.trim();
        if (!cleanUrl) return false;
        
        try {
          const urlObj = new URL(cleanUrl);
          return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch {
          try {
            const urlWithProtocol = cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`;
            const urlObj = new URL(urlWithProtocol);
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
          } catch {
            return false;
          }
        }
      }).map(urlString => {
        const cleanUrl = urlString.trim();
        return cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`;
      });

      if (urls.length === 0) {
        alert('No valid URLs found in clipboard. Make sure you have copied a valid URL (starting with http:// or https://).');
        setIsAdding(false);
        return;
      }

      // Process each URL
      const results = await Promise.allSettled(
        urls.map(async (singleUrl) => {
          const response = await fetch(`/api/lists/${list.publicId}/items`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: singleUrl }),
          });

          if (response.ok) {
            return await response.json();
          } else {
            const errorData = await response.json();
            throw new Error(`${singleUrl}: ${errorData.error}`);
          }
        })
      );

      // Handle results
      const successful = results
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map(result => result.value);
      
      const failed = results
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map(result => result.reason.message);

      // Add successful items to local state
      if (successful.length > 0) {
        setItems(prevItems => [...successful, ...prevItems]);
      }

      // Show feedback
      if (failed.length === 0) {
        if (urls.length > 1) {
          console.log(`Successfully added ${urls.length} links from clipboard!`);
        } else {
          console.log('Successfully added link from clipboard!');
        }
      } else if (successful.length === 0) {
        alert(`Failed to add links from clipboard:\n${failed.join('\n')}`);
      } else {
        alert(`Added ${successful.length} links successfully from clipboard.\n\nFailed to add:\n${failed.join('\n')}`);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'NotAllowedError') {
        alert('Clipboard access denied by browser. This is common on HTTP sites.\n\nTo add links:\n1. Copy your URL\n2. Paste it in the input field above\n3. Click "Add link"\n\nOr use HTTPS for automatic clipboard access.');
      } else {
        console.error('Error reading clipboard or adding links:', error);
        alert('Error reading clipboard. Please paste the URL manually in the input field.');
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);

    try {
      // Split the input by whitespace and newlines to handle multiple URLs
      const urls = url.trim().split(/[\s,\n\r]+/).filter(urlString => {
        // Clean up the URL string
        const cleanUrl = urlString.trim();
        if (!cleanUrl) return false;
        
        try {
          // Try to create a URL object to validate
          const urlObj = new URL(cleanUrl);
          // Only accept http and https protocols
          return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch {
          // If it doesn't have a protocol, try adding https://
          try {
            const urlWithProtocol = cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`;
            const urlObj = new URL(urlWithProtocol);
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
          } catch {
            return false;
          }
        }
      }).map(urlString => {
        // Normalize URLs by adding https:// if missing
        const cleanUrl = urlString.trim();
        return cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`;
      });

      if (urls.length === 0) {
        alert('Please enter at least one valid URL');
        return;
      }

      // Process each URL and track results
      const results = await Promise.allSettled(
        urls.map(async (singleUrl) => {
          const response = await fetch(`/api/lists/${list.publicId}/items`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: singleUrl }),
          });

          if (response.ok) {
            return await response.json();
          } else {
            const errorData = await response.json();
            throw new Error(`${singleUrl}: ${errorData.error}`);
          }
        })
      );

      // Separate successful and failed results
      const successful = results
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map(result => result.value);
      
      const failed = results
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map(result => result.reason.message);

      // Add successful items to local state
      if (successful.length > 0) {
        setItems(prevItems => [...successful, ...prevItems]);
      }

      setUrl('');

      // Show appropriate feedback
      if (failed.length === 0) {
        // All succeeded
        if (urls.length > 1) {
          alert(`Successfully added ${urls.length} links!`);
        }
      } else if (successful.length === 0) {
        // All failed
        alert(`Failed to add links:\n${failed.join('\n')}`);
      } else {
        // Partial success
        alert(`Added ${successful.length} links successfully.\n\nFailed to add:\n${failed.join('\n')}`);
      }
    } catch (error) {
      console.error('Error adding links:', error);
      alert('Unexpected error adding links');
    } finally {
      setIsAdding(false);
    }
  };

  const handleEmojiUpdate = async (newEmoji: string) => {
    setIsUpdatingEmoji(true);
    
    try {
      const response = await fetch(`/api/lists/${list.publicId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emoji: newEmoji }),
      });

      if (response.ok) {
        router.refresh(); // Refresh to show the new emoji
      } else {
        const errorData = await response.json();
        console.error('Failed to update emoji:', errorData.error);
        alert(errorData.error || 'Failed to update emoji');
      }
    } catch (error) {
      console.error('Error updating emoji:', error);
      alert('Error updating emoji');
    } finally {
      setIsUpdatingEmoji(false);
    }
  };

  const handleTitleUpdate = async (newTitle: string) => {
    const response = await fetch(`/api/lists/${list.publicId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: newTitle }),
    });

    if (response.ok) {
      router.refresh();
    } else {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update title');
    }
  };

  const handleDescriptionUpdate = async (newDescription: string) => {
    const response = await fetch(`/api/lists/${list.publicId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description: newDescription || null }),
    });

    if (response.ok) {
      router.refresh();
    } else {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update description');
    }
  };

  const copySnackLink = async () => {
    const snackUrl = `${window.location.origin}/${list.user.username}/${list.publicId}`;
    try {
      await navigator.clipboard.writeText(snackUrl);
      // Show success feedback - you could replace this with a proper toast
      alert('Link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy link:', error);
      alert('Failed to copy link');
    }
  };

  const viewPublicList = () => {
    const snackUrl = `${window.location.origin}/${list.user.username}/${list.publicId}`;
    window.open(snackUrl, '_blank');
  };

  const handleDeleteItem = async (itemId: string) => {
    setIsDeleting(itemId);
    
    try {
      const response = await fetch(`/api/lists/${list.publicId}/items/${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove item from local state
        setItems(prevItems => prevItems.filter(item => item.id !== itemId));
      } else {
        const errorData = await response.json();
        console.error('Failed to delete item:', errorData.error);
        alert(errorData.error || 'Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error deleting item');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    console.log('🎯 Drag ended - active:', active.id, 'over:', over?.id);

    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over?.id);

      console.log('📊 Reorder indices - oldIndex:', oldIndex, 'newIndex:', newIndex);

      const newItems = arrayMove(items, oldIndex, newIndex);
      const itemIds = newItems.map(item => item.id);
      
      console.log('📝 New item order:', itemIds);
      console.log('🌐 Making API request to:', `/api/lists/${list.publicId}/items/reorder`);
      
      setItems(newItems); // Optimistic update

      setIsReordering(true);
      try {
        const response = await fetch(`/api/lists/${list.publicId}/items/reorder`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            itemIds: itemIds,
          }),
        });

        console.log('📡 Response status:', response.status, response.statusText);

        if (!response.ok) {
          // Revert on error
          console.log('❌ Response not ok, reverting...');
          setItems(items);
          const errorData = await response.json();
          console.error('Failed to reorder items:', errorData.error);
          alert(errorData.error || 'Failed to reorder items');
        } else {
          console.log('✅ Reorder successful!');
        }
      } catch (error) {
        // Revert on error
        console.log('💥 Fetch error, reverting...');
        setItems(items);
        console.error('Error reordering items:', error);
        alert('Error reordering items');
      } finally {
        setIsReordering(false);
      }
    } else {
      console.log('🚫 No reorder needed - same position');
    }
  };

  const handleViewModeChange = async (newViewMode: 'LIST' | 'GALLERY') => {
    setIsUpdatingViewMode(true);
    
    try {
      const response = await fetch(`/api/lists/${list.publicId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ viewMode: newViewMode }),
      });

      if (response.ok) {
        setViewMode(newViewMode);
      } else {
        const errorData = await response.json();
        console.error('Failed to update view mode:', errorData.error);
        alert(errorData.error || 'Failed to update view mode');
      }
    } catch (error) {
      console.error('Error updating view mode:', error);
      alert('Error updating view mode');
    } finally {
      setIsUpdatingViewMode(false);
    }
  };


  // Find the active item for drag overlay
  const activeItem = activeId ? items.find(item => item.id === activeId) : null;

  return (
    <>
      <div className="max-w-[960px] mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-6">
          
          <div className="text-left space-y-4 max-w-[672px] mx-auto">
            <div className="flex items-center gap-2">
              <EmojiPickerComponent
                currentEmoji={list.emoji || '📝'}
                onEmojiSelect={handleEmojiUpdate}
                disabled={isUpdatingEmoji}
                size="lg"
              />
            </div>
            <div className="space-y-2">
              <InlineEdit
                value={list.title}
                onSave={handleTitleUpdate}
                placeholder="Enter list title"
                className="text-4xl font-bold text-left"
                emptyText="Untitled List"
              />
              <InlineEdit
                value={list.description || ''}
                onSave={handleDescriptionUpdate}
                placeholder="Add a description for your list"
                multiline
                className="text-xl text-muted-foreground text-left"
                emptyText="Description"
              />
            </div>
          </div>

          {/* Compact Action Bar */}
          <div className="max-w-[672px] mx-auto">
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <div className="flex gap-3 items-center">
                {/* Add Links Input */}
                <div className="flex-1">
                  <Input
                    placeholder="Type or paste a link or multiple links"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="border-0 bg-transparent text-base placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && url.trim()) {
                        handleAddLink(e);
                      }
                    }}
                  />
                </div>
                
                {/* Add Button */}
                <Button 
                  onClick={url.trim() ? handleAddLink : handlePasteFromClipboard} 
                  disabled={isAdding}
                  className="px-6 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium cursor-pointer"
                >
                  {isAdding ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Adding...
                    </>
                  ) : url.trim() ? (
                    '⌘↵ Add link'
                  ) : (
                    '⌘V Paste link'
                  )}
                </Button>
              </div>
              
              {/* Bottom Row - View Toggle and Share Buttons */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <ViewModeToggle
                  viewMode={viewMode}
                  onViewModeChange={handleViewModeChange}
                  disabled={isUpdatingViewMode}
                />
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={viewPublicList}
                    className="border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg cursor-pointer"
                  >
                    View
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                  <Button 
                    size="sm"
                    onClick={copySnackLink}
                    className="bg-orange-500 text-white hover:bg-orange-600 border-orange-500 rounded-lg font-medium cursor-pointer"
                  >
                    Copy Snack Link
                    <Copy className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-8"></div>

      <div className="space-y-4">
        {/* Links */}
        {items.length === 0 ? (
          <div className="text-center py-20 max-w-[960px] mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">🔗</span>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-gray-900">Ready to curate?</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Add your first link above to start building your curated list. You can add multiple links at once!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className={`flex items-center justify-between ${viewMode === 'LIST' ? 'max-w-[672px] mx-auto' : 'max-w-[1296px] mx-auto'}`}>
              <p className="text-sm text-gray-600">
                {items.length} {items.length === 1 ? 'link' : 'links'} • Drag to reorder
              </p>
            </div>
            
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
                {viewMode === 'LIST' ? (
                  <div className="max-w-[672px] mx-auto">
                    <div className="space-y-3">
                      {items.map((item) => (
                        <SortableListItem 
                          key={item.id} 
                          item={item} 
                          onDelete={handleDeleteItem}
                          isDeleting={isDeleting === item.id}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-[1296px] mx-auto">
                    {items.map((item) => (
                      <GalleryListItem 
                        key={item.id}
                        item={item} 
                        onDelete={handleDeleteItem}
                        isDeleting={isDeleting === item.id}
                      />
                    ))}
                  </div>
                )}
              </SortableContext>
              
              <DragOverlay>
                {activeItem ? (
                  viewMode === 'LIST' ? (
                    <div className="opacity-95 scale-105 shadow-xl">
                      <SortableListItem 
                        item={activeItem} 
                        onDelete={() => {}} 
                        isDeleting={false}
                        isDragOverlay={true}
                      />
                    </div>
                  ) : (
                    <div className="opacity-95 scale-105 shadow-xl">
                      <GalleryListItem 
                        item={activeItem} 
                        onDelete={() => {}} 
                        isDeleting={false}
                        isDragOverlay={true}
                      />
                    </div>
                  )
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        )}
        
        {isReordering && (
          <div className="fixed bottom-6 right-6 bg-white border border-gray-200 rounded-lg p-4 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm font-medium text-gray-700">Saving order...</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
} 