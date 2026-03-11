import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const EXPO_PUBLIC_SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const EXPO_PUBLIC_SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// createClient throws if url/key are empty. We keep the app booting even when env vars
// are not set yet, and the UI (AuthContext) shows a clear configuration error.
const supabaseUrl = EXPO_PUBLIC_SUPABASE_URL && EXPO_PUBLIC_SUPABASE_URL.length > 0 ? EXPO_PUBLIC_SUPABASE_URL : 'http://localhost';
const supabaseAnonKey =
  EXPO_PUBLIC_SUPABASE_ANON_KEY && EXPO_PUBLIC_SUPABASE_ANON_KEY.length > 0
    ? EXPO_PUBLIC_SUPABASE_ANON_KEY
    : 'public-anon-key';

const storage = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  // Be explicit about the DB schema. This avoids issues if the project's API schema
  // was misconfigured (e.g. typo like "publc" instead of "public").
  db: {
    schema: 'public',
  },
});

export const RECIPES_TABLE = 'recipes';
export const RECIPE_IMAGES_BUCKET = 'recipe-images';

export const isSupConfigured = (): boolean => {
  return Boolean(EXPO_PUBLIC_SUPABASE_URL) && Boolean(EXPO_PUBLIC_SUPABASE_ANON_KEY);
};
