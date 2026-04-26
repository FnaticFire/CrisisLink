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
  if (!alertId) {
    debugError('Chat', 'Missing alertId in sendChatMessage');
    throw new Error('Missing alertId');
  }
  try {
    const colRef = collection(db, `alerts/${alertId}/chat`);
    await addDoc(colRef, msg);
    debugLog('Chat', `Sent to alerts/${alertId}/chat: ${msg.text}`);
  } catch (err) {
    debugError('Chat', `sendChatMessage failed for ${alertId}:`, err);
    throw err;
  }
}

// ─── Listen to messages in real-time ───
export function listenToChat(alertId: string, callback: (msgs: ChatMsg[]) => void): Unsubscribe {
  if (!alertId) {
    debugError('Chat', 'Missing alertId in listenToChat');
    return () => {};
  }
  // Remove orderBy to avoid composite index requirement
  const q = query(
    collection(db, `alerts/${alertId}/chat`)
  );
  return onSnapshot(q, (snap) => {
    const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMsg));
    // Sort client-side
    msgs.sort((a, b) => a.timestamp - b.timestamp);
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
