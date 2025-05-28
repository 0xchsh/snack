'use client';

import { useState } from 'react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface EmojiPickerComponentProps {
  currentEmoji?: string;
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function EmojiPickerComponent({ 
  currentEmoji = '📝', 
  onEmojiSelect, 
  disabled = false,
  size = 'md'
}: EmojiPickerComponentProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
    setIsOpen(false);
  };

  const sizeClasses = {
    sm: 'text-2xl p-2',
    md: 'text-4xl p-3',
    lg: 'text-6xl p-4'
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          disabled={disabled}
          className={`${sizeClasses[size]} h-auto hover:scale-110 transition-transform border-2 border-dashed border-transparent hover:border-gray-300 rounded-lg cursor-pointer`}
        >
          {currentEmoji}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="center">
        <EmojiPicker
          onEmojiClick={handleEmojiClick}
          width={350}
          height={400}
          searchDisabled={false}
          skinTonesDisabled={true}
          previewConfig={{
            showPreview: false
          }}
        />
      </PopoverContent>
    </Popover>
  );
} 