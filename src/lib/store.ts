import { create } from 'zustand';
import { UserDoc } from './types';

interface AppState {
  currentUser: UserDoc | null;
  currentLocation: { lat: number; lng: number, address?: string } | null;
  activeAlertId: string | null;
  activeAlert: any | null; // For local UI backward compatibility
  
  // Dummy parameters heavily tied to layout pages for safe fallback
  notifications: Array<{ id: string; title: string; body: string; time: Date; read: boolean }>;
  savedLocations: Array<{ id: string; name: string; address: string; lat: number; lng: number }>;
  alertHistory: Array<{ id: string; type: string; status: string; date: Date; severity: string; location: string }>;
  messages: Array<any>;
  responders: Array<any>;

  setCurrentUser: (user: UserDoc | null) => void;
  updateUser: (updates: Partial<UserDoc>) => void;
  setCurrentLocation: (loc: { lat: number; lng: number, address?: string } | null) => void;
  setActiveAlertId: (id: string | null) => void;
  setActiveAlert: (alert: any) => void;
  resolveAlert: () => void;
  updateUserLocation: (lat: number, lng: number, address: string) => void;
  markNotificationsRead: () => void;
  addMessage: (message: any) => void;
  markMessagesRead: (id: string) => void;
  updateCurrentUser: (updates: any) => void;
  addSavedLocation: (loc: any) => void;
  removeSavedLocation: (id: string) => void;
  setRole: (role: any) => void;
}

import { persist, createJSONStorage } from 'zustand/middleware';

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentUser: null,
      currentLocation: null,
      activeAlertId: null,
      activeAlert: null,

      notifications: [],
      savedLocations: [],
      alertHistory: [],
      messages: [],
      responders: [],

      setCurrentUser: (user) => set({ currentUser: user }),
      updateUser: (updates) => set((state) => ({ 
        currentUser: state.currentUser ? { ...state.currentUser, ...updates } : null 
      })),
      setCurrentLocation: (loc) => set({ currentLocation: loc }),
      setActiveAlertId: (id) => set({ activeAlertId: id }),
      setActiveAlert: (alert) => set({ activeAlert: alert }),
      resolveAlert: () => set({ activeAlert: null }),
      updateUserLocation: (lat, lng, addr) => set((state) => ({ 
        currentLocation: { lat, lng, address: addr },
        currentUser: state.currentUser ? { ...state.currentUser, location: { lat, lng, address: addr } } : null
      })),
      markNotificationsRead: () => set((state) => ({ notifications: state.notifications.map(n => ({ ...n, read: true })) })),
      addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
      markMessagesRead: () => {}, // Mock stub
      updateCurrentUser: (updates) => set((state) => ({ currentUser: state.currentUser ? { ...state.currentUser, ...updates } : null })),
      addSavedLocation: () => {},
      removeSavedLocation: () => {},
      setRole: () => {},
    }),
    {
      name: 'crisislink-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
