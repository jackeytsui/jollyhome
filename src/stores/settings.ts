import { create } from 'zustand';

interface SettingsState {
  themeOverride: 'light' | 'dark' | 'system';
  setThemeOverride: (theme: 'light' | 'dark' | 'system') => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  themeOverride: 'system',
  setThemeOverride: (themeOverride) => set({ themeOverride }),
}));
