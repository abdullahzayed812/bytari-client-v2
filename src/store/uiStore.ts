import { create } from 'zustand';

export type RealtimeStatus = 'disconnected' | 'connecting' | 'connected';

interface UiState {
  /** Aggregate unread notification count for the tab-bar badge. */
  notificationBadgeCount: number;
  realtimeStatus: RealtimeStatus;
  /** `true` while the last known network probe reported offline. */
  isOffline: boolean;
  setNotificationBadgeCount: (count: number) => void;
  incrementNotificationBadge: (by?: number) => void;
  clearNotificationBadge: () => void;
  setRealtimeStatus: (status: RealtimeStatus) => void;
  setOffline: (offline: boolean) => void;
}

/**
 * Ephemeral cross-cutting UI state. Not persisted. Not server state — anything
 * fetched from the API belongs in React Query, not here.
 */
export const useUiStore = create<UiState>((set) => ({
  notificationBadgeCount: 0,
  realtimeStatus: 'disconnected',
  isOffline: false,
  setNotificationBadgeCount: (count) => set({ notificationBadgeCount: Math.max(0, count) }),
  incrementNotificationBadge: (by = 1) =>
    set((s) => ({ notificationBadgeCount: Math.max(0, s.notificationBadgeCount + by) })),
  clearNotificationBadge: () => set({ notificationBadgeCount: 0 }),
  setRealtimeStatus: (status) => set({ realtimeStatus: status }),
  setOffline: (offline) => set({ isOffline: offline }),
}));
