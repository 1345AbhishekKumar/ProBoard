import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && 
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder-url.supabase.co' &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

if (!isSupabaseConfigured) {
  if (typeof window !== 'undefined') {
    console.warn('Supabase credentials are missing. Please add them to your environment variables.');
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
