import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'shared_rooms';

export interface LocalSharedRoom {
  roomCode: string;
  myMemberId: string;
  myName: string;
  roomName: string;
  joinedAt: string;
}

interface SharedRoomState {
  rooms: LocalSharedRoom[];
  loaded: boolean;
  loadRooms: () => Promise<void>;
  addRoom: (room: LocalSharedRoom) => Promise<void>;
  removeRoom: (roomCode: string) => Promise<void>;
  getRoomByCode: (roomCode: string) => LocalSharedRoom | undefined;
}

export const useSharedRoomStore = create<SharedRoomState>((set, get) => ({
  rooms: [],
  loaded: false,

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
  },

  getRoomByCode: (roomCode: string) => {
    return get().rooms.find(r => r.roomCode === roomCode);
  },
}));
