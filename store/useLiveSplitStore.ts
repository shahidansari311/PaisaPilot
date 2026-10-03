import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LiveSplitMember, LiveSplitExpense } from '../types/database';

const STORAGE_KEY = 'live_split_groups';
const CACHE_KEY = 'live_split_cache';

export interface LocalLiveGroup {
  groupId: string; // Room Code
  myMemberId: string;
  myName: string;
  groupName: string;
  joinedAt: string;
}

export interface LiveGroupCache {
  groupName: string;
  participants: LiveSplitMember[];
  expenses: LiveSplitExpense[];
  lastSynced: string;
}

interface LiveSplitState {
  groups: LocalLiveGroup[];
  loaded: boolean;
  cachedGroupData: Record<string, LiveGroupCache>;
  loadGroups: () => Promise<void>;
  loadCache: () => Promise<void>;
  addGroup: (group: LocalLiveGroup) => Promise<void>;
  removeGroup: (groupId: string) => Promise<void>;
  getGroupById: (groupId: string) => LocalLiveGroup | undefined;
  setCachedGroup: (groupId: string, data: LiveGroupCache) => Promise<void>;
  getCachedGroup: (groupId: string) => LiveGroupCache | undefined;
}

export const useLiveSplitStore = create<LiveSplitState>((set, get) => ({
  groups: [],
  loaded: false,
  cachedGroupData: {},

  loadGroups: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        set({ groups: JSON.parse(raw), loaded: true });
      } else {
        set({ loaded: true });
      }
    } catch (e) {
      console.error('Failed to load live split groups', e);
      set({ loaded: true });
    }
  },

  loadCache: async () => {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (raw) {
        set({ cachedGroupData: JSON.parse(raw) });
      }
    } catch (e) {
      console.error('Failed to load live split cache', e);
    }
  },

  addGroup: async (group: LocalLiveGroup) => {
    const current = get().groups;
    // Don't add duplicate
    if (current.find(r => r.groupId === group.groupId)) return;
    const updated = [group, ...current];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ groups: updated });
  },

  removeGroup: async (groupId: string) => {
    const updated = get().groups.filter(r => r.groupId !== groupId);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ groups: updated });
    // Also clear cache for this group
    const currentCache = { ...get().cachedGroupData };
    delete currentCache[groupId];
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(currentCache));
    set({ cachedGroupData: currentCache });
  },

  getGroupById: (groupId: string) => {
    return get().groups.find(r => r.groupId === groupId);
  },

  setCachedGroup: async (groupId: string, data: LiveGroupCache) => {
    const updated = { ...get().cachedGroupData, [groupId]: data };
    set({ cachedGroupData: updated });
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to write live split cache', e);
    }
  },

  getCachedGroup: (groupId: string) => {
    return get().cachedGroupData[groupId];
  },
}));
