import Constants from 'expo-constants';

// API configuration
export const API_URL = __DEV__
  ? 'http://localhost:3000'
  : 'https://snack.app';

// Supabase configuration - should be set via app.json extra or environment
export const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.supabaseAnonKey ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// RevenueCat configuration
export const REVENUECAT_API_KEY = Constants.expoConfig?.extra?.revenueCatApiKey ?? process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? '';

// Deep linking configuration
export const SCHEME = 'snack';
export const WEB_URL = 'https://snack.app';

// App constants
export const APP_NAME = 'Snack';
export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
