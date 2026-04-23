import { create } from 'zustand';
import { UserDoc } from './types';

interface AppState {
  currentUser: UserDoc | null;
  currentLocation: { lat: number; lng: number } | null;
  activeAlertId: string | null; // Track if user is in an active emergency
  
  setCurrentUser: (user: UserDoc | null) => void;
  setCurrentLocation: (loc: { lat: number; lng: number } | null) => void;
  setActiveAlertId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: null,
  currentLocation: null,
  activeAlertId: null,

  setCurrentUser: (user) => set({ currentUser: user }),
  setCurrentLocation: (loc) => set({ currentLocation: loc }),
  setActiveAlertId: (id) => set({ activeAlertId: id }),
}));
