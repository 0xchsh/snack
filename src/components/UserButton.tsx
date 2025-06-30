'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronDown,
  UserCircle
} from 'lucide-react';

interface UserButtonProps {
  afterSignOutUrl?: string;
  appearance?: {
    elements?: {
      avatarBox?: string;
    };
  };
}

export function UserButton({ afterSignOutUrl = '/', appearance }: UserButtonProps) {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
    router.push(afterSignOutUrl);
  };

  const avatarSize = appearance?.elements?.avatarBox || 'w-8 h-8';
  const initials = getInitials(user);
  const avatarUrl = user.user_metadata?.avatar_url;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${avatarSize} rounded-full border border-gray-200 hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 flex items-center justify-center overflow-hidden`}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={user.user_metadata?.first_name || 'Profile'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-medium text-sm">
            {initials}
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={user.user_metadata?.first_name || 'Profile'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-medium">
                    {initials}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {user.user_metadata?.first_name && user.user_metadata?.last_name
                    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
                    : user.user_metadata?.username || 'User'
                  }
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {user.email}
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <Link
              href="/dashboard/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <User className="h-4 w-4" />
              Profile
            </Link>
            
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Settings className="h-4 w-4" />
              Dashboard
            </Link>
          </div>

          {/* Sign Out */}
          <div className="border-t border-gray-100 py-1">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to generate initials
function getInitials(user: any): string {
  const firstName = user.user_metadata?.first_name;
  const lastName = user.user_metadata?.last_name;
  const username = user.user_metadata?.username;
  const email = user.email;

  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  
  if (firstName) {
    return firstName[0].toUpperCase();
  }
  
  if (username) {
    return username[0].toUpperCase();
  }
  
  if (email) {
    return email[0].toUpperCase();
  }
  
  return 'U';
}