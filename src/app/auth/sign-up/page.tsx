'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { auth, userDb } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const redirectTo = searchParams.get('redirectTo') || '/dashboard';

  // Redirect if already signed in
  useEffect(() => {
    if (!authLoading && user) {
      router.push(redirectTo);
    }
  }, [user, authLoading, router, redirectTo]);

  // Check username availability
  const checkUsername = async (usernameToCheck: string) => {
    if (!usernameToCheck || usernameToCheck.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(usernameToCheck)) {
      setUsernameError('Username can only contain letters, numbers, hyphens, and underscores');
      return;
    }

    setCheckingUsername(true);
    setUsernameError('');

    try {
      const { available, error } = await userDb.isUsernameAvailable(usernameToCheck);
      
      if (error) {
        setUsernameError('Error checking username availability');
      } else if (!available) {
        setUsernameError('Username is already taken');
      }
    } catch (err) {
      setUsernameError('Error checking username availability');
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    
    // Debounced username check
    if (value.length >= 3) {
      const timeoutId = setTimeout(() => checkUsername(value), 500);
      return () => clearTimeout(timeoutId);
    } else {
      setUsernameError('');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    if (usernameError) {
      setError('Please fix the username error before continuing');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await auth.signUp(email, password, {
        username,
        first_name: firstName,
        last_name: lastName,
      });
      
      if (error) {
        setError(error.message);
      } else if (data.user) {
        // Check email for confirmation link
        setError('Check your email for a confirmation link before signing in');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignUp = async (provider: 'google') => {
    try {
      setError('');
      const { error } = await auth.signInWithProvider(provider);
      if (error) {
        setError(error.message);
      }
      // OAuth redirect will handle the rest
    } catch (err) {
      setError('Failed to sign up with ' + provider);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
          <CardDescription>
            Join Snack to start curating your lists
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={handleUsernameChange}
                placeholder="johndoe"
                required
                disabled={loading || checkingUsername}
                className={usernameError ? 'border-red-500' : ''}
              />
              {checkingUsername && (
                <div className="text-sm text-gray-500">Checking availability...</div>
              )}
              {usernameError && (
                <div className="text-red-600 text-sm">{usernameError}</div>
              )}
              {username.length >= 3 && !usernameError && !checkingUsername && (
                <div className="text-green-600 text-sm">Username is available!</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                minLength={8}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                minLength={8}
                disabled={loading}
                className={password && confirmPassword && password !== confirmPassword ? 'border-red-500' : ''}
              />
              {password && confirmPassword && password !== confirmPassword && (
                <div className="text-red-600 text-sm">Passwords do not match</div>
              )}
            </div>
            
            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || checkingUsername || !!usernameError || !username}
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSocialSignUp('google')}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.431H8v-3.08h7.545z" />
                </svg>
                Continue with Google
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <span className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/sign-in" className="text-blue-600 hover:text-blue-500 font-medium">
                Sign in
              </Link>
            </span>
          </div>
        </CardContent>
    </Card>
  );
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
            <CardDescription>
              Join Snack to start curating your lists
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          </CardContent>
        </Card>
      }>
        <SignUpForm />
      </Suspense>
    </div>
  );
}