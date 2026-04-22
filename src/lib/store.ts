import { create } from 'zustand';
import { User, Role, Responder, Alert, Message } from './types';

interface AppState {
  currentUser: User | null;
  currentRole: Role;
  activeAlert: Alert | null;
  responders: Responder[];
  messages: Message[];
  
  // Actions
  setRole: (role: Role) => void;
  setCurrentUser: (user: User | null) => void;
  setActiveAlert: (alert: Alert | null) => void;
  addMessage: (message: Message) => void;
  updateResponderStatus: (id: string, status: Responder['status']) => void;
  updateUserLocation: (lat: number, lng: number, address: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: {
    id: 'user-1',
    name: 'Sarah Mitchell',
    role: 'user',
    avatar: 'https://i.pravatar.cc/150?u=sarah',
    location: {
      lat: 28.6139,
      lng: 77.2090,
      address: 'Connaught Place, New Delhi'
    }
  },
  currentRole: 'user',
  activeAlert: null,
  responders: [
    {
      id: 'resp-1',
      name: 'Inspector Rajesh Kumar',
      role: 'responder',
      avatar: 'https://i.pravatar.cc/150?u=rajesh',
      experience: '15 years',
      rating: 4.9,
      distance: '0.4 km',
      description: 'Senior Police Inspector, specialized in quick tactical response.',
      status: 'online'
    },
    {
      id: 'resp-2',
      name: 'Dr. Neha Kapoor',
      role: 'responder',
      avatar: 'https://i.pravatar.cc/150?u=neha',
      experience: '10 years',
      rating: 5.0,
      distance: '1.2 km',
      description: 'Head of Trauma and Emergency Medicine at City Hospital.',
      status: 'online'
    },
    {
      id: 'resp-3',
      name: 'Vikram Rao',
      role: 'responder',
      avatar: 'https://i.pravatar.cc/150?u=vikram',
      experience: '8 years',
      rating: 4.7,
      distance: '2.5 km',
      description: 'Fast Response Firefighter, specialized in urban hazardous rescue.',
      status: 'busy'
    },
    {
      id: 'resp-4',
      name: 'Ankit Patel',
      role: 'responder',
      avatar: 'https://i.pravatar.cc/150?u=ankit',
      experience: 'Ride Helper',
      rating: 4.8,
      distance: '0.9 km',
      description: 'Verified Community Volunteer providing ride assistance.',
      status: 'online'
    }
  ],
  messages: [],

  setRole: (role) => set({ currentRole: role }),
  setActiveAlert: (alert) => set({ activeAlert: alert }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  updateResponderStatus: (id, status) => set((state) => ({
    responders: state.responders.map(r => r.id === id ? { ...r, status } : r)
  })),
  setCurrentUser: (user) => set({ currentUser: user }),
  updateUserLocation: (lat, lng, address) => set((state) => ({
    currentUser: state.currentUser ? {
      ...state.currentUser,
      location: { lat, lng, address }
    } : null
  }))
}));
