'use client'

import { useState } from 'react'
import Image from 'next/image'
import { getFaviconUrls, getHostname } from '@/lib/url-utils'

interface FaviconProps {
  url: string
  size?: number
  className?: string
  fallbackClassName?: string
}

export function Favicon({ 
  url, 
  size = 20, 
  className = '', 
  fallbackClassName = 'bg-gradient-to-br from-primary/20 to-primary/10' 
}: FaviconProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hasError, setHasError] = useState(false)
  
  const faviconUrls = getFaviconUrls(url)
  const hostname = getHostname(url)

  const handleError = () => {
    if (currentIndex < faviconUrls.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setHasError(false)
    } else {
      setHasError(true)
    }
  }

  // If all favicon attempts failed, show fallback
  if (hasError || currentIndex >= faviconUrls.length) {
    return (
      <div 
        className={`${fallbackClassName} flex items-center justify-center text-xs font-bold text-muted-foreground ${className}`}
        style={{ width: size, height: size }}
      >
        {hostname.charAt(0).toUpperCase()}
      </div>
    )
  }

  return (
    <Image
      src={faviconUrls[currentIndex]}
      alt={`${hostname} favicon`}
      width={size}
      height={size}
      className={`object-cover ${className}`}
      onError={handleError}
      unoptimized
    />
  )
}