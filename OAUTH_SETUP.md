# OAuth Setup Guide

This guide explains how to configure Google OAuth for the Snack app.

## Current Issue
When using "Continue with Google" on production, users are redirected to `localhost:3000` instead of staying on the production domain.

## Root Cause
The OAuth flow requires proper configuration in both Supabase and Google Cloud Console to handle production vs development redirects.

## Fix Steps

### 1. Supabase Dashboard Configuration
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `fwahxwlbsilzlbgeotyk`
3. Navigate to: **Authentication** → **Settings**
4. Set the following:

**Site URL:**
```
https://snack-ratlabs.vercel.app
```

**Redirect URLs (add both):**
```
https://snack-ratlabs.vercel.app/api/auth/callback
http://localhost:3000/api/auth/callback
```

### 2. Google Cloud Console Configuration
1. Go to [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
2. Find or create your OAuth 2.0 Client ID
3. Add **Authorized redirect URIs**:

```
https://fwahxwlbsilzlbgeotyk.supabase.co/auth/v1/callback
http://localhost:54321/auth/v1/callback
```

⚠️ **Important**: The redirect URIs go to Supabase's auth service, NOT your app directly.

### 3. Environment Variables
Update your production environment variables in Vercel:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `snack` project
3. Go to **Settings** → **Environment Variables**
4. Add your Google OAuth credentials:

```bash
GOOGLE_CLIENT_ID=your_actual_client_id_from_google
GOOGLE_CLIENT_SECRET=your_actual_client_secret_from_google
```

### 4. Test the Flow
1. Deploy the latest changes
2. Visit production site: `https://snack-ratlabs.vercel.app`  
3. Click "Get Started" → "Continue with Google"
4. Should now stay on production domain after OAuth

## How OAuth Flow Works
1. User clicks "Continue with Google" on your site
2. App redirects to Google OAuth with your client ID
3. Google redirects to Supabase: `fwahxwlbsilzlbgeotyk.supabase.co/auth/v1/callback`
4. Supabase processes the OAuth and redirects to your app: `/api/auth/callback`
5. Your app processes the session and redirects to `/dashboard`

## Troubleshooting
- Check browser console for OAuth redirect URL logs
- Verify all URLs use `https://` (not `http://`) for production
- Ensure Google OAuth credentials are active and not expired