'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Link } from 'lucide-react';

interface FaviconProps {
  src: string | null;
  alt?: string;
  size?: number;
  className?: string;
}

export function Favicon({ src, alt = '', size = 16, className = '' }: FaviconProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <Link 
        className={`w-4 h-4 text-muted-foreground ${className}`} 
        size={size} 
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`w-4 h-4 rounded-sm ${className}`}
      onError={() => setHasError(true)}
      unoptimized // For external favicons that might not be optimizable
    />
  );
} 