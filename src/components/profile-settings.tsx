'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { UserProfile } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, AlertTriangle, Check, X, Camera, User } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileSettingsProps {
  user: {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
  };
}

interface UsernameCheckResult {
  available: boolean;
  message: string;
}

export function ProfileSettings({ user }: ProfileSettingsProps) {
  const { user: clerkUser } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  
  // Form state
  const [username, setUsername] = useState(user.username);
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [email, setEmail] = useState(clerkUser?.primaryEmailAddress?.emailAddress || '');
  
  // Username validation state
  const [usernameCheck, setUsernameCheck] = useState<UsernameCheckResult | null>(null);
  const [usernameCheckLoading, setUsernameCheckLoading] = useState(false);
  const [usernameDebounce, setUsernameDebounce] = useState<NodeJS.Timeout | null>(null);

  // Debounced username check
  useEffect(() => {
    if (username === user.username) {
      setUsernameCheck(null);
      return;
    }

    if (username.length === 0) {
      setUsernameCheck({ available: false, message: 'Username is required' });
      return;
    }

    if (username.length > 16) {
      setUsernameCheck({ available: false, message: 'Username must be 16 characters or less' });
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setUsernameCheck({ available: false, message: 'Username can only contain letters, numbers, hyphens, and underscores' });
      return;
    }

    if (!/^[a-zA-Z0-9]/.test(username)) {
      setUsernameCheck({ available: false, message: 'Username must start with a letter or number' });
      return;
    }

    if (!/[a-zA-Z0-9]$/.test(username)) {
      setUsernameCheck({ available: false, message: 'Username must end with a letter or number' });
      return;
    }

    // Clear previous timeout
    if (usernameDebounce) {
      clearTimeout(usernameDebounce);
    }

    // Set new timeout for API call
    const timeout = setTimeout(async () => {
      setUsernameCheckLoading(true);
      try {
        const response = await fetch('/api/user/check-username', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username })
        });
        
        const result = await response.json();
        setUsernameCheck(result);
      } catch (error) {
        setUsernameCheck({ available: false, message: 'Error checking username availability' });
      } finally {
        setUsernameCheckLoading(false);
      }
    }, 500);

    setUsernameDebounce(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [username, user.username, usernameDebounce]);

  const handleUpdateProfile = async () => {
    setIsLoading(true);
    try {
      const updates: any = {};
      
      if (username !== user.username) updates.username = username;
      if (firstName !== user.firstName) updates.firstName = firstName;
      if (lastName !== user.lastName) updates.lastName = lastName;
      if (email !== clerkUser?.primaryEmailAddress?.emailAddress) updates.email = email;

      if (Object.keys(updates).length === 0) {
        toast.info('No changes to save');
        return;
      }

      const response = await fetch('/api/user/update-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile');
      }

      toast.success('Profile updated successfully');
      
      // Refresh the page to get updated data
      window.location.reload();

    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE MY ACCOUNT') {
      toast.error('Please type "DELETE MY ACCOUNT" to confirm');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmationText: deleteConfirmation })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete account');
      }

      toast.success('Account deleted successfully');
      
      // Redirect to home page
      window.location.href = '/';

    } catch (error) {
      console.error('Account deletion error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete account');
    } finally {
      setIsLoading(false);
    }
  };

  const isUsernameValid = usernameCheck?.available === true || username === user.username;
  const canSave = isUsernameValid && !isLoading && !usernameCheckLoading;

  return (
    <div className="space-y-6">
      {/* Profile Picture */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>
            Update your profile picture and appearance settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              {clerkUser?.imageUrl ? (
                <img
                  src={clerkUser.imageUrl}
                  alt="Profile picture"
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-200">
                  <User className="w-8 h-8 text-gray-500" />
                </div>
              )}
            </div>
            <div className="flex flex-col space-y-2">
              <h3 className="font-medium">
                {clerkUser?.firstName || clerkUser?.username || 'User'}
              </h3>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Camera className="w-4 h-4 mr-2" />
                    Update Picture
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <UserProfile 
                    appearance={{
                      elements: {
                        rootBox: "w-full",
                        cardBox: "shadow-none",
                      }
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your profile details and username.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                maxLength={16}
                className={`pr-8 ${usernameCheck && !usernameCheck.available ? 'border-red-500' : ''}`}
              />
              {usernameCheckLoading && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                </div>
              )}
              {!usernameCheckLoading && usernameCheck && username !== user.username && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  {usernameCheck.available ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <X className="w-4 h-4 text-red-600" />
                  )}
                </div>
              )}
            </div>
            {usernameCheck && username !== user.username && (
              <p className={`text-sm ${usernameCheck.available ? 'text-green-600' : 'text-red-600'}`}>
                {usernameCheck.message}
              </p>
            )}
          </div>

          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter first name"
              maxLength={50}
            />
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter last name"
              maxLength={50}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
            />
          </div>

          <Button 
            onClick={handleUpdateProfile}
            disabled={!canSave}
            className="w-full"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deleteConfirmation">
              Type "DELETE MY ACCOUNT" to confirm deletion
            </Label>
            <Input
              id="deleteConfirmation"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="DELETE MY ACCOUNT"
            />
          </div>
          
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={deleteConfirmation !== 'DELETE MY ACCOUNT' || isLoading}
            className="w-full"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isLoading ? 'Deleting...' : 'Delete Account'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 