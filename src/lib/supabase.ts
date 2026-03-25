import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import { createMMKV } from 'react-native-mmkv';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/constants/config';

const BUILD_SAFE_SUPABASE_URL = SUPABASE_URL || 'https://placeholder.supabase.co';
const BUILD_SAFE_SUPABASE_ANON_KEY =
  SUPABASE_ANON_KEY ||
  'placeholder-anon-key-placeholder-anon-key-placeholder-anon-key';

type StorageAdapter = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

const createStorageAdapter = (): StorageAdapter => {
  if (typeof window === 'undefined') {
    const memoryStorage = new Map<string, string>();
    return {
      getItem: (key) => memoryStorage.get(key) ?? null,
      setItem: (key, value) => {
        memoryStorage.set(key, value);
      },
      removeItem: (key) => {
        memoryStorage.delete(key);
      },
    };
  }

  if (Platform.OS === 'web') {
    return {
      getItem: (key) => window.localStorage.getItem(key),
      setItem: (key, value) => {
        window.localStorage.setItem(key, value);
      },
      removeItem: (key) => {
        window.localStorage.removeItem(key);
      },
    };
  }

  const storage = createMMKV({ id: 'supabase-session' });
  return {
    getItem: (key) => storage.getString(key) ?? null,
    setItem: (key, value) => {
      storage.set(key, value);
    },
    removeItem: (key) => {
      storage.remove(key);
    },
  };
};

export const supabase = createClient(BUILD_SAFE_SUPABASE_URL, BUILD_SAFE_SUPABASE_ANON_KEY, {
  auth: {
    storage: createStorageAdapter(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
