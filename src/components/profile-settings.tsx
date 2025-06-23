'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useClerk } from '@clerk/nextjs';
import { UserProfile } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, AlertTriangle, Check, X, Camera, User, LogOut, AtSign } from 'lucide-react';
import { toast } from 'sonner';
import { UsernameInput } from '@/components/username-input';

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
  const { signOut } = useClerk();
  const [isLoading, setIsLoading] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  
  // Form state
  const [username, setUsername] = useState(user.username);
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [email, setEmail] = useState('');
  
  // Update email when clerkUser loads
  useEffect(() => {
    if (clerkUser?.primaryEmailAddress?.emailAddress) {
      setEmail(clerkUser.primaryEmailAddress.emailAddress);
    }
  }, [clerkUser]);

  // Check if user signed up with social auth (email is not changeable)
  const isSocialAuth = clerkUser?.externalAccounts && clerkUser.externalAccounts.length > 0;
  
  // Username validation state
  const [usernameCheck, setUsernameCheck] = useState<UsernameCheckResult | null>(null);
  const [usernameCheckLoading, setUsernameCheckLoading] = useState(false);
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  // Email update state
  const [emailFeedback, setEmailFeedback] = useState<string | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);

  // Debounced username check
  useEffect(() => {
    if (!usernameTouched && username === user.username) {
      setUsernameCheck(null);
      return;
    }

    if (!usernameTouched && username.length < 3) {
      setUsernameCheck(null);
      return;
    }

    if (username.length === 0) {
      setUsernameCheck({ available: false, message: 'Username is required' });
      return;
    }

    if (username.length < 3) {
      setUsernameCheck({ available: false, message: 'Username must be at least 3 characters' });
      return;
    }

    if (username.length > 15) {
      setUsernameCheck({ available: false, message: 'Username must be 15 characters or less' });
      return;
    }

    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      setUsernameCheck({ available: false, message: 'Username can only contain letters and numbers (no spaces or special characters)' });
      return;
    }

    // Debounce logic
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
    }, 1000);

    return () => clearTimeout(timeout);
  }, [username, user.username, usernameTouched]);

  const handleUpdateProfile = async () => {
    setUsernameTouched(true);
    setIsLoading(true);
    setBackendError(null);
    try {
      const updates: any = {};
      
      if (username !== user.username) updates.username = username;
      if (firstName !== user.firstName) updates.firstName = firstName;
      if (lastName !== user.lastName) updates.lastName = lastName;

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
        setBackendError(result.error || result.details || 'Failed to update profile');
        throw new Error(result.error || result.details || 'Failed to update profile');
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

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
    }
  };

  const usernameUnchanged = username === user.username;
  const usernameFormatValid = username.length >= 3 && username.length <= 15 && /^[a-zA-Z0-9]+$/.test(username);
  const usernameAvailable = usernameCheck?.available === true;
  const canSave =
    !isLoading &&
    !usernameCheckLoading &&
    (
      usernameUnchanged ||
      (usernameFormatValid && usernameAvailable)
    );

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/user/update-profile-picture', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload profile picture');
      }

      toast.success('Profile picture updated successfully');
      
      // Refresh the page to get updated data
      window.location.reload();

    } catch (error) {
      console.error('Profile picture upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload profile picture');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateEmail = async () => {
    setEmailFeedback(null);
    setEmailLoading(true);
    try {
      const response = await fetch('/api/user/update-email', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const result = await response.json();
      if (!response.ok) {
        setEmailFeedback(result.error || 'Failed to update email');
        toast.error(result.error || 'Failed to update email');
        return;
      }
      setEmailFeedback('Email updated! Please check your inbox to verify your new email if required.');
      toast.success('Email updated! Please check your inbox to verify your new email if required.');
    } catch (error) {
      setEmailFeedback('Failed to update email');
      toast.error('Failed to update email');
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <Tabs defaultValue="profile" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="space-y-6">
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
                      Update Picture
                      <Camera className="w-4 h-4 ml-2" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold">Update Profile Picture</h3>
                        <p className="text-sm text-muted-foreground">
                          Choose a new profile picture
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-center space-y-4">
                        {clerkUser?.imageUrl ? (
                          <img
                            src={clerkUser.imageUrl}
                            alt="Current profile picture"
                            className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-200">
                            <User className="w-12 h-12 text-gray-500" />
                          </div>
                        )}
                        
                        <div className="w-full">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="profile-image-upload"
                            disabled={isLoading}
                          />
                          <label htmlFor="profile-image-upload">
                            <Button 
                              variant="outline" 
                              className="w-full cursor-pointer"
                              disabled={isLoading}
                              asChild
                            >
                              <span>
                                {isLoading ? 'Uploading...' : 'Choose New Picture'}
                              </span>
                            </Button>
                          </label>
                        </div>
                        
                        <p className="text-xs text-muted-foreground text-center">
                          Supported formats: JPG, PNG, GIF (max 5MB)
                        </p>
                      </div>
                    </div>
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
              <UsernameInput
                  id="username"
                label="Username"
                  value={username}
                onChange={e => {
                  setUsername(e.target.value);
                  setUsernameTouched(true);
                  setBackendError(null);
                }}
                onBlur={() => {}}
                helperText={
                  backendError ? backendError :
                  usernameCheckLoading ? (
                    <span className="text-muted-foreground">Checking username…</span>
                  ) : usernameCheck && usernameTouched ? (
                    usernameCheck.available ? (
                      <span className="text-green-600 flex items-center gap-1"><Check className="w-4 h-4" /> Username is available</span>
                    ) : (
                      <span className="text-destructive flex items-center gap-1"><X className="w-4 h-4" /> {usernameCheck.message || 'Username is already taken'}</span>
                    )
                  ) :
                  !/^[a-zA-Z0-9]*$/.test(username)
                    ? 'Username can only contain letters and numbers'
                    : username.length < 3
                      ? 'Username must be at least 3 characters'
                      : username.length > 15
                        ? 'Username must be 15 characters or less'
                        : 'Choose a unique username for your profile'
                }
                onValidationChange={valid => {
                  // Only allow save if valid
                }}
                  maxLength={16}
                className={`pr-8`}
                available={usernameCheck?.available}
              />
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
                disabled={emailLoading}
              />
              <Button
                onClick={handleUpdateEmail}
                disabled={emailLoading || !email || email === clerkUser?.primaryEmailAddress?.emailAddress}
                className="w-full"
                variant="outline"
              >
                {emailLoading ? 'Updating...' : 'Update Email'}
              </Button>
              {emailFeedback && (
                <p className="text-sm mt-1 text-muted-foreground">{emailFeedback}</p>
              )}
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
      </TabsContent>

      <TabsContent value="settings" className="space-y-6">
        {/* Logout */}
        <Card>
          <CardHeader>
            <CardTitle>Sign Out</CardTitle>
            <CardDescription>
              Sign out of your account on this device.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="w-full"
              disabled={isLoading}
            >
              Sign Out
              <LogOut className="w-4 h-4 ml-2" />
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
              {isLoading ? 'Deleting...' : 'Delete Account'}
              <Trash2 className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
} 