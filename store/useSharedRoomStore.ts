import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SharedRoomEntry, SharedRoomMember } from '../types/database';

const STORAGE_KEY = 'shared_rooms';
const CACHE_KEY = 'shared_room_cache';

export interface LocalSharedRoom {
  roomCode: string;
  myMemberId: string;
  myName: string;
  roomName: string;
  joinedAt: string;
}

export interface SharedRoomCache {
  members: Record<string, SharedRoomMember>;
  entries: SharedRoomEntry[];
  roomName: string;
  lastSynced: string;
}

interface SharedRoomState {
  rooms: LocalSharedRoom[];
  loaded: boolean;
  cachedRoomData: Record<string, SharedRoomCache>;
  loadRooms: () => Promise<void>;
  loadCache: () => Promise<void>;
  addRoom: (room: LocalSharedRoom) => Promise<void>;
  removeRoom: (roomCode: string) => Promise<void>;
  getRoomByCode: (roomCode: string) => LocalSharedRoom | undefined;
  setCachedRoom: (roomCode: string, data: SharedRoomCache) => Promise<void>;
  getCachedRoom: (roomCode: string) => SharedRoomCache | undefined;
}

export const useSharedRoomStore = create<SharedRoomState>((set, get) => ({
  rooms: [],
  loaded: false,
  cachedRoomData: {},

  loadRooms: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        set({ rooms: JSON.parse(raw), loaded: true });
      } else {
        set({ loaded: true });
      }
    } catch (e) {
      console.error('Failed to load shared rooms', e);
      set({ loaded: true });
    }
  },

  loadCache: async () => {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (raw) {
        set({ cachedRoomData: JSON.parse(raw) });
      }
    } catch (e) {
      console.error('Failed to load shared room cache', e);
    }
  },

  addRoom: async (room: LocalSharedRoom) => {
    const current = get().rooms;
    // Don't add duplicate
    if (current.find(r => r.roomCode === room.roomCode)) return;
    const updated = [room, ...current];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ rooms: updated });
  },

  removeRoom: async (roomCode: string) => {
    const updated = get().rooms.filter(r => r.roomCode !== roomCode);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ rooms: updated });
    // Also clear the cache for this room
    const currentCache = { ...get().cachedRoomData };
    delete currentCache[roomCode];
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(currentCache));
    set({ cachedRoomData: currentCache });
  },

  getRoomByCode: (roomCode: string) => {
    return get().rooms.find(r => r.roomCode === roomCode);
  },

  setCachedRoom: async (roomCode: string, data: SharedRoomCache) => {
    const updated = { ...get().cachedRoomData, [roomCode]: data };
    set({ cachedRoomData: updated });
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to write shared room cache', e);
    }
  },

  getCachedRoom: (roomCode: string) => {
    return get().cachedRoomData[roomCode];
  },
}));
