import { create } from "zustand";

interface SyncState {
  isOnline: boolean;
  lastSyncAt: string | null;
  isSyncing: boolean;
  setOnline: (online: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setLastSyncAt: (time: string) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  lastSyncAt: null,
  isSyncing: false,
  setOnline: (online) => set({ isOnline: online }),
  setSyncing: (syncing) => set({ isSyncing: syncing }),
  setLastSyncAt: (time) => set({ lastSyncAt: time }),
}));
