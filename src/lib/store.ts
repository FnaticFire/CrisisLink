import { create } from 'zustand';
import { User, Role, Responder, Alert, Message } from './types';

interface AppState {
  currentUser: User | null;
  currentRole: Role;
  activeAlert: Alert | null;
  responders: Responder[];
  messages: Message[];
  alertHistory: Array<{ id: string; type: string; status: string; date: Date; severity: string; location: string }>;
  notifications: Array<{ id: string; title: string; body: string; time: Date; read: boolean }>;
  savedLocations: Array<{ id: string; name: string; address: string; lat: number; lng: number }>;

  // Actions
  setRole: (role: Role) => void;
  setCurrentUser: (user: User | null) => void;
  setActiveAlert: (alert: Alert | null) => void;
  addMessage: (message: Message) => void;
  updateResponderStatus: (id: string, status: Responder['status']) => void;
  updateUserLocation: (lat: number, lng: number, address: string) => void;
  updateCurrentUser: (updates: Partial<User>) => void;
  markNotificationsRead: () => void;
  markMessagesRead: (alertId: string) => void;
  resolveAlert: () => void;
  addSavedLocation: (loc: { name: string; address: string; lat: number; lng: number }) => void;
  removeSavedLocation: (id: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: {
    id: 'user-1',
    name: 'John Doe',
    role: 'user',
    avatar: 'https://i.pravatar.cc/150?u=johndoe',
    location: {
      lat: 28.6139,
      lng: 77.2090,
      address: 'Connaught Place, New Delhi',
    },
  },
  currentRole: 'user',
  activeAlert: null,
  alertHistory: [
    { id: 'h1', type: 'Medical Emergency', status: 'resolved', date: new Date(Date.now() - 86400000 * 2), severity: 'high', location: 'Connaught Place, New Delhi' },
    { id: 'h2', type: 'Personal Safety', status: 'resolved', date: new Date(Date.now() - 86400000 * 5), severity: 'medium', location: 'Karol Bagh, New Delhi' },
    { id: 'h3', type: 'Road Accident', status: 'resolved', date: new Date(Date.now() - 86400000 * 12), severity: 'high', location: 'India Gate, New Delhi' },
  ],
  notifications: [
    { id: 'n1', title: 'Responder Nearby', body: 'Inspector Rajesh Kumar is 0.4km away and available.', time: new Date(Date.now() - 600000), read: false },
    { id: 'n2', title: 'Safety Tip', body: 'Keep emergency contacts updated in your profile.', time: new Date(Date.now() - 3600000), read: false },
    { id: 'n3', title: 'Alert Resolved', body: 'Your previous Medical Emergency has been resolved.', time: new Date(Date.now() - 86400000 * 2), read: true },
  ],
  savedLocations: [
    { id: 'sl1', name: 'Home', address: 'Sector 15, Gurgaon, Haryana', lat: 28.4595, lng: 77.0266 },
    { id: 'sl2', name: 'Office', address: 'Connaught Place, New Delhi', lat: 28.6139, lng: 77.2090 },
  ],
  responders: [
    {
      id: 'resp-1',
      name: 'Inspector Rajesh Kumar',
      role: 'responder',
      avatar: 'https://i.pravatar.cc/150?u=rajesh',
      experience: '15 years',
      rating: 4.9,
      distance: '0.4 km',
      description: 'Senior Police Inspector with 15 years in tactical emergency response. Specialized in crowd control, crisis negotiation, and rapid deployment operations.',
      status: 'online',
    },
    {
      id: 'resp-2',
      name: 'Dr. Neha Kapoor',
      role: 'responder',
      avatar: 'https://i.pravatar.cc/150?u=neha',
      experience: '10 years',
      rating: 5.0,
      distance: '1.2 km',
      description: 'Head of Trauma and Emergency Medicine at AIIMS New Delhi. Expert in critical care, multi-trauma patients, and pre-hospital emergency management.',
      status: 'online',
    },
    {
      id: 'resp-3',
      name: 'Vikram Rao',
      role: 'responder',
      avatar: 'https://i.pravatar.cc/150?u=vikram',
      experience: '8 years',
      rating: 4.7,
      distance: '2.5 km',
      description: 'Fast Response Firefighter specialized in urban high-rise rescue, hazardous material containment, and structural fire suppression operations.',
      status: 'busy',
    },
    {
      id: 'resp-4',
      name: 'Ankit Patel',
      role: 'responder',
      avatar: 'https://i.pravatar.cc/150?u=ankit',
      experience: '3 years',
      rating: 4.8,
      distance: '0.9 km',
      description: 'Certified Community First Responder and trained paramedic. Provides rapid first-aid, patient stabilization, and safe transport coordination.',
      status: 'online',
    },
  ],
  messages: [],

  setRole: (role) => set({ currentRole: role }),
  setActiveAlert: (alert) => set({ activeAlert: alert }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  updateResponderStatus: (id, status) =>
    set((state) => ({
      responders: state.responders.map((r) => (r.id === id ? { ...r, status } : r)),
    })),
  setCurrentUser: (user) => set({ currentUser: user }),
  updateCurrentUser: (updates) =>
    set((state) => ({
      currentUser: state.currentUser ? { ...state.currentUser, ...updates } : null,
    })),
  updateUserLocation: (lat, lng, address) =>
    set((state) => ({
      currentUser: state.currentUser
        ? { ...state.currentUser, location: { lat, lng, address } }
        : null,
    })),
  markNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),
  markMessagesRead: (alertId) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.alertId === alertId && m.senderId !== state.currentUser?.id
          ? { ...m, status: 'read' }
          : m
      ),
    })),
  resolveAlert: () =>
    set((state) => {
      const alert = state.activeAlert;
      if (!alert) return {};
      return {
        activeAlert: null,
        alertHistory: [
          {
            id: alert.id,
            type: alert.type,
            status: 'resolved',
            date: new Date(),
            severity: alert.severity,
            location: alert.location.address,
          },
          ...state.alertHistory,
        ],
        messages: [],
      };
    }),
  addSavedLocation: (loc) =>
    set((state) => ({
      savedLocations: [
        ...state.savedLocations,
        { ...loc, id: 'sl-' + Date.now() },
      ],
    })),
  removeSavedLocation: (id) =>
    set((state) => ({
      savedLocations: state.savedLocations.filter((l) => l.id !== id),
    })),
}));
