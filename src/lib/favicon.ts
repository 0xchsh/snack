/**
 * Get favicon URL for a given website URL
 * Uses multiple fallback strategies to find the best favicon
 */
export function getFaviconUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    
    // Try multiple favicon strategies in order of preference:
    
    // 1. Google's favicon service (most reliable)
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    
    // Alternative strategies (commented out but available):
    // 2. DuckDuckGo favicon service
    // return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
    
    // 3. Favicon.io service
    // return `https://favicons.githubusercontent.com/${domain}`;
    
    // 4. Direct favicon.ico (least reliable)
    // return `${urlObj.protocol}//${domain}/favicon.ico`;
    
  } catch (error) {
    console.error('Error generating favicon URL:', error);
    return null;
  }
}

/**
 * Extract favicon from Open Graph scraping result with fallbacks
 */
export function extractFaviconFromOG(url: string, ogResult?: any): string | null {
  // Try to get favicon from OG result first
  if (ogResult?.favicon) {
    return ogResult.favicon;
  }
  
  // Fallback to our reliable favicon service
  return getFaviconUrl(url);
} 