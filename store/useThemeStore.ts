import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeState {
  isDark: boolean;
  accentColor: string;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
  setAccentColor: (color: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDark: false,
      accentColor: '#10b981', // Emerald default
      toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
      setTheme: (isDark) => set({ isDark }),
      setAccentColor: (color) => set({ accentColor: color }),
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
