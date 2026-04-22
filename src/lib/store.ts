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
      name: 'Officer John Smith',
      role: 'responder',
      avatar: 'https://i.pravatar.cc/150?u=john',
      experience: '8 years',
      rating: 4.9,
      distance: '0.8 km',
      description: 'Senior Emergency Medical Technician with advanced life support certifications.',
      status: 'online'
    },
    {
      id: 'resp-2',
      name: 'Paramedic Elena Ray',
      role: 'responder',
      avatar: 'https://i.pravatar.cc/150?u=elena',
      experience: '5 years',
      rating: 4.8,
      distance: '1.2 km',
      description: 'Crisis response specialist, trained in trauma care and emergency evacuation.',
      status: 'online'
    },
    {
      id: 'resp-3',
      name: 'Rescue Agent Marcus',
      role: 'responder',
      avatar: 'https://i.pravatar.cc/150?u=marcus',
      experience: '12 years',
      rating: 5.0,
      distance: '2.5 km',
      description: 'Ex-Firefighter lead, expert in urban search and rescue operations.',
      status: 'busy'
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
