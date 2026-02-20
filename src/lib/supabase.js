// ═══════════════════════════════════════════════════════════════
// SUPABASE CLIENT CONFIGURATION
// ═══════════════════════════════════════════════════════════════
//
// Setup:
// 1. Create a Supabase project at https://supabase.com
// 2. Run the SQL migration in supabase/migrations/001_schema.sql
// 3. Copy your project URL and anon key from Settings > API
// 4. Set environment variables or update the values below
//
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

if (supabaseUrl === 'YOUR_SUPABASE_URL') {
  console.warn(
    '⚠️  Baddie: Running in DEMO mode. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable live backend.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export const isDemo = supabaseUrl === 'YOUR_SUPABASE_URL';

// Helper to get public URL for storage
export function getStorageUrl(bucket, path) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl;
}

export default supabase;
