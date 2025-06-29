'use client';

import Link from 'next/link';
import { UserButton, SignUpButton, useUser } from '@clerk/nextjs';
import { Home, Search } from 'lucide-react';

interface NavbarProps {
  variant?: 'global';
}

export function Navbar({ variant = 'global' }: NavbarProps) {
  const { isSignedIn, user } = useUser();

  if (isSignedIn) {
    return (
      <nav className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-6 h-14">
        {/* Left: Brand */}
        <Link href="/dashboard" className="font-bold text-xl text-orange-600">
          Snack
        </Link>
        
        {/* Right: Navigation */}
        <div className="flex items-center gap-6">
          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center gap-6">
            <Link 
              href="/dashboard" 
              className="text-gray-700 hover:text-orange-600 font-medium transition-colors"
            >
              Dashboard
            </Link>
            <Link 
              href="/explore" 
              className="text-gray-700 hover:text-orange-600 font-medium transition-colors"
            >
              Explore
            </Link>
            <Link 
              href="/dashboard/profile" 
              className="text-gray-700 hover:text-orange-600 font-medium transition-colors"
            >
              Profile
            </Link>
            <UserButton 
              afterSignOutUrl="/" 
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8"
                }
              }}
            />
          </div>
          
          {/* Mobile Navigation */}
          <div className="flex sm:hidden items-center gap-4">
            <Link 
              href="/dashboard" 
              className="text-gray-700 hover:text-orange-600 transition-colors"
              title="Dashboard"
            >
              <Home size={20} />
            </Link>
            <Link 
              href="/explore" 
              className="text-gray-700 hover:text-orange-600 transition-colors"
              title="Explore"
            >
              <Search size={20} />
            </Link>
            {user?.imageUrl ? (
              <Link href="/dashboard/profile" title="Profile">
                <img 
                  src={user.imageUrl} 
                  alt={user.firstName || 'Profile'} 
                  className="w-8 h-8 rounded-full object-cover border border-gray-200 hover:border-orange-300 transition-colors"
                />
              </Link>
            ) : (
              <Link 
                href="/dashboard/profile" 
                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300 transition-colors"
                title="Profile"
              >
                <span className="text-sm font-medium">
                  {user?.firstName?.[0] || user?.username?.[0] || 'U'}
                </span>
              </Link>
            )}
          </div>
        </div>
      </nav>
    );
  }

  // Public/Not signed in
  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-6 h-14">
      {/* Left: Brand */}
      <Link href="/" className="font-bold text-xl text-orange-600">
        Snack
      </Link>
      
      {/* Right: Navigation */}
      <div className="flex items-center gap-6">
        {/* Desktop Navigation */}
        <div className="hidden sm:flex items-center gap-6">
          <Link 
            href="/explore" 
            className="text-gray-700 hover:text-orange-600 font-medium transition-colors"
          >
            Explore
          </Link>
          <SignUpButton mode="modal">
            <button className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2 rounded-lg transition-colors">
              Sign Up
            </button>
          </SignUpButton>
        </div>
        
        {/* Mobile Navigation */}
        <div className="flex sm:hidden items-center gap-4">
          <Link 
            href="/explore" 
            className="text-gray-700 hover:text-orange-600 transition-colors"
            title="Explore"
          >
            <Search size={20} />
          </Link>
          <SignUpButton mode="modal">
            <button className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-3 py-2 rounded-lg text-sm transition-colors">
              Sign Up
            </button>
          </SignUpButton>
        </div>
      </div>
    </nav>
  );
}