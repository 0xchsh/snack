import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase environment variables:', {
    url: supabaseUrl ? 'present' : 'missing',
    key: supabaseAnonKey ? 'present' : 'missing',
    allEnvVars: Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_'))
  })
  throw new Error(`Missing Supabase environment variables: URL=${!supabaseUrl ? 'missing' : 'ok'}, KEY=${!supabaseAnonKey ? 'missing' : 'ok'}`)
}

// Client-side Supabase client
export const createClient = () =>
  createBrowserClient(supabaseUrl, supabaseAnonKey)