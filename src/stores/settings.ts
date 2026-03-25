import { createMMKV } from 'react-native-mmkv';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware.js';

const DEFAULT_TABS = ['home', 'expenses', 'chores', 'calendar', 'more'];

interface SettingsState {
  themeOverride: 'light' | 'dark' | 'system';
  setThemeOverride: (theme: 'light' | 'dark' | 'system') => void;
  selectedTabs: string[];
  setSelectedTabs: (tabs: string[]) => void;
}

const createSettingsStorage = () => {
  if (typeof window === 'undefined') {
    const memoryStorage = new Map<string, string>();
    return {
      getItem: (key: string) => memoryStorage.get(key) ?? null,
      setItem: (key: string, value: string) => memoryStorage.set(key, value),
      removeItem: (key: string) => memoryStorage.delete(key),
    };
  }

  if (Platform.OS === 'web') {
    return {
      getItem: (key: string) => window.localStorage.getItem(key),
      setItem: (key: string, value: string) => window.localStorage.setItem(key, value),
      removeItem: (key: string) => window.localStorage.removeItem(key),
    };
  }

  const settingsStorage = createMMKV({ id: 'settings-store' });
  return {
    getItem: (key: string) => settingsStorage.getString(key) ?? null,
    setItem: (key: string, value: string) => settingsStorage.set(key, value),
    removeItem: (key: string) => settingsStorage.remove(key),
  };
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      themeOverride: 'system',
      setThemeOverride: (themeOverride) => set({ themeOverride }),
      selectedTabs: DEFAULT_TABS,
      setSelectedTabs: (selectedTabs) => set({ selectedTabs }),
    }),
    {
      name: 'settings',
      storage: createJSONStorage(createSettingsStorage),
      partialize: (state) => ({
        themeOverride: state.themeOverride,
        selectedTabs: state.selectedTabs,
      }),
    }
  )
);
