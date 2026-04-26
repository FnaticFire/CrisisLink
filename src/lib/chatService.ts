// ============================================================
// CrisisLink — Real-time Firestore Chat Service
// Civilian ↔ Responder messaging within an active alert
// ============================================================

import { db } from './firebase';
import {
  collection, addDoc, onSnapshot, query, Unsubscribe
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
  const q = query(collection(db, `alerts/${alertId}/chat`));
  return onSnapshot(q, (snap) => {
    const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMsg));
    msgs.sort((a, b) => a.timestamp - b.timestamp);
    callback(msgs);
  }, (err) => {
    debugError('Chat', 'listenToChat error:', err);
    callback([]);
  });
}

// ─── ROLE-BASED RESPONDER REPLIES ───
export const GET_RESPONDER_QUICK_REPLIES = (role: string = 'police', type: string = 'emergency') => {
  const base = ["I'm on my way", "ETA 3 mins", "Help is arriving"];
  
  if (role.toLowerCase().includes('police')) {
    return [...base, "Unit 10-4 en-route", "Secure the perimeter", "Stay low, don't move"];
  }
  if (role.toLowerCase().includes('fire')) {
    return [...base, "Ladder truck dispatched", "Are guests evacuated?", "Close doors if possible"];
  }
  if (role.toLowerCase().includes('hospital') || role.toLowerCase().includes('medical')) {
    return [...base, "Ambulance dispatched", "Is the patient conscious?", "Check for breathing"];
  }
  
  return base;
};

// ─── CONTEXT-BASED SURVIVOR REPLIES ───
export const GET_CIVILIAN_QUICK_REPLIES = (type: string = 'Fire') => {
  const base = ["Please hurry", "I'm safe for now", "Trapped inside"];
  
  const lowerType = type.toLowerCase();
  if (lowerType.includes('fire')) {
    return [...base, "Heavy smoke here", "Cannot find exit", "Multiple people trapped"];
  }
  if (lowerType.includes('medical') || lowerType.includes('accident')) {
    return [...base, "Patient is bleeding", "Unconscious male", "Need CPR guide"];
  }
  if (lowerType.includes('violence') || lowerType.includes('police')) {
    return [...base, "Armed intruder", "Hiding in cupboard", "Send backup quick"];
  }

  return base;
};
