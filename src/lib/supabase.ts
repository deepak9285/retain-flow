import { createClient } from '@supabase/supabase-js';

// Supabase client — uses only the public anon key (safe for frontend)
// Service-role key must NEVER be used in frontend code.
//
// Required environment variables:
//   VITE_SUPABASE_URL      — your Supabase project URL
//   VITE_SUPABASE_ANON_KEY — your Supabase anon (public) key
//
// Get these from: https://app.supabase.com → Settings → API

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[RetainFlow] Supabase credentials not configured. ' +
      'Copy .env.example to .env and fill in your project values. ' +
      'The app will run in demo mode without auth.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);
