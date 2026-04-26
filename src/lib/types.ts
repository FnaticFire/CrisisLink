export type Role = 'civilian' | 'police' | 'fire' | 'hospital';

export interface UserDoc {
  id: string;
  email: string;
  username: string;
  role: Role;
  isVolunteer: boolean;
  isAvailable: boolean;
  phone?: string; // Required for responders during registration
  location?: { lat: number; lng: number; address?: string };
  avatar?: string;
}

export interface Responder extends UserDoc {
  experience: string;
  rating: number;
  distance: string;
  description: string;
  status: 'online' | 'offline' | 'busy';
}

export interface AlertDoc {
  id: string;
  userId: string;
  userName: string;
  userLocation: { lat: number; lng: number; address?: string };
  type: string;
  severity: string;
  status: 'pending' | 'accepted' | 'en_route' | 'arrived' | 'resolved';
  confidence: number;
  reason: string;
  instructions: string[];
  responderId?: string;      // UID of the responder who accepted
  responderName?: string;
  responderPhone?: string;
  responderRole?: string;
  responderLocation?: { lat: number; lng: number };
  createdAt: number;
  acceptedAt?: number;
  resolvedAt?: number;
}

export interface ChatMessageDoc {
  id?: string;
  alertId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  type: 'ai' | 'human';
}
