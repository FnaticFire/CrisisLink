// ============================================================
// CrisisLink — Real-time Firestore Chat Service
// Civilian ↔ Responder messaging within an active alert
// ============================================================

import { db } from './firebase';
import {
  collection, addDoc, onSnapshot, query, orderBy, Unsubscribe
} from 'firebase/firestore';
import { debugLog, debugError } from './debug';

export interface ChatMsg {
  id?: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  timestamp: number;
}

// ─── Send a message ───
export async function sendChatMessage(alertId: string, msg: Omit<ChatMsg, 'id'>): Promise<void> {
  try {
    await addDoc(collection(db, `alerts/${alertId}/chat`), msg);
    debugLog('Chat', `Sent: ${msg.text}`);
  } catch (err) {
    debugError('Chat', 'sendChatMessage failed:', err);
    throw err;
  }
}

// ─── Listen to messages in real-time ───
export function listenToChat(alertId: string, callback: (msgs: ChatMsg[]) => void): Unsubscribe {
  const q = query(
    collection(db, `alerts/${alertId}/chat`),
    orderBy('timestamp', 'asc')
  );
  return onSnapshot(q, (snap) => {
    const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMsg));
    callback(msgs);
  }, (err) => {
    debugError('Chat', 'listenToChat error:', err);
    callback([]);
  });
}

// ─── Quick reply templates for responders ───
export const RESPONDER_QUICK_REPLIES = [
  "I'm on my way",
  "Stay calm, help is arriving",
  "Keep your location visible",
  "Are you injured?",
  "Can you move to a safe spot?",
  "ETA 2 minutes",
];

// ─── Quick reply templates for civilians ───
export const CIVILIAN_QUICK_REPLIES = [
  "Please hurry",
  "I'm safe for now",
  "Person is unconscious",
  "There are children here",
  "I need medical help",
];
