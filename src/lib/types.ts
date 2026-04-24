export type Role = 'civilian' | 'police' | 'fire' | 'hospital';

export interface UserDoc {
  id: string; // Firebase Auth UID
  email: string;
  username: string;
  role: Role;
  isVolunteer: boolean;
  isAvailable: boolean; // Relevant for responders and volunteers
  location?: { lat: number; lng: number; address?: string }; // Last known location
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
  id?: string; // Firestore Doc ID
  userId: string;
  userLocation: { lat: number; lng: number };
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'pending' | 'accepted' | 'resolved';
  responders: string[]; // array of responder UIDs who accepted
  confidence: number;
  reason: string;
  instructions: string[];
  createdAt: number;
}

export interface ChatMessageDoc {
  id?: string;
  alertId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  type: 'ai' | 'human'; // ai-generated guidance or real human chat
}
