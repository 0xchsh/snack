'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './navbar';

export function ConditionalNavbar() {
  const pathname = usePathname();
  
  // Hide navbar on these routes
  const hideNavbarRoutes = [
    '/dashboard/lists/', // Edit list pages
  ];
  
  // Check if current path should hide navbar
  const shouldHideNavbar = hideNavbarRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Also hide on public list pages (pattern: /[username]/[listId])
  const isPublicListPage = pathname.match(/^\/[^\/]+\/[^\/]+$/);
  
  if (shouldHideNavbar || isPublicListPage) {
    return null;
  }
  
  return <Navbar />;
}