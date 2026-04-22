export type Role = 'user' | 'responder' | 'admin';

export interface User {
  id: string;
  name: string;
  role: Role;
  avatar: string;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
}

export interface Responder extends User {
  experience: string;
  rating: number;
  distance: string;
  description: string;
  status: 'online' | 'offline' | 'busy';
}

export interface Alert {
  id: string;
  userId: string;
  responderId?: string;
  type: 'emergency' | 'medical' | 'fire' | 'violence';
  status: 'pending' | 'dispatched' | 'active' | 'resolved';
  severity: 'low' | 'medium' | 'high';
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  createdAt: string;
}

export interface Message {
  id: string;
  alertId: string;
  senderId: string;
  text: string;
  timestamp: string;
  status: 'sent' | 'read';
}
