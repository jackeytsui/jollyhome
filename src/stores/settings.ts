import { createMMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const settingsStorage = createMMKV({ id: 'settings-store' });

const mmkvStorage = {
  getItem: (key: string) => settingsStorage.getString(key) ?? null,
  setItem: (key: string, value: string) => settingsStorage.set(key, value),
  removeItem: (key: string) => settingsStorage.remove(key),
};

const DEFAULT_TABS = ['home', 'expenses', 'chores', 'calendar', 'more'];

interface SettingsState {
  themeOverride: 'light' | 'dark' | 'system';
  setThemeOverride: (theme: 'light' | 'dark' | 'system') => void;
  selectedTabs: string[];
  setSelectedTabs: (tabs: string[]) => void;
}

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
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        themeOverride: state.themeOverride,
        selectedTabs: state.selectedTabs,
      }),
    }
  )
);
