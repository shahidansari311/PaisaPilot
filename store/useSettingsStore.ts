import { create } from 'zustand';
import { SQLiteDatabase } from 'expo-sqlite';

interface SettingsState {
  monthStartDay: number;
  loaded: boolean;
  loadSettings: (db: SQLiteDatabase) => Promise<void>;
  setMonthStartDay: (db: SQLiteDatabase, day: number) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  monthStartDay: 1,
  loaded: false,
  
  loadSettings: async (db) => {
    try {
      const row = await db.getFirstAsync<{ value: string }>("SELECT value FROM app_settings WHERE key = 'month_start_day'");
      if (row?.value) {
        set({ monthStartDay: parseInt(row.value, 10), loaded: true });
      } else {
        set({ monthStartDay: 1, loaded: true });
      }
    } catch (e) {
      console.error('Failed to load settings', e);
      set({ loaded: true });
    }
  },

  setMonthStartDay: async (db, day) => {
    try {
      await db.runAsync("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('month_start_day', ?)", [day.toString()]);
      set({ monthStartDay: day });
    } catch (e) {
      console.error('Failed to save month start day', e);
    }
  }
}));
