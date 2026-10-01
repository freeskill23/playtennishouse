import { createClient } from '@supabase/supabase-js';

const FALLBACK_URL = 'https://rmjqdogzumxqrhhiiley.supabase.co';
const FALLBACK_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtanFkb2d6dW14cXJoaGlpbGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNjI4NDAsImV4cCI6MjA5OTczODg0MH0.VWzTy5j7CJs9ZHIKwuXFFJLdu_rsQNJ7tnVCUUcjiAQ';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY;

export const SUPABASE_URL = supabaseUrl;
export const SUPABASE_ANON_KEY = supabaseAnonKey;

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = supabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : (undefined as unknown as ReturnType<typeof createClient>);
