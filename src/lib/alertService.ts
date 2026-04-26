// ============================================================
// CrisisLink — Firestore Alert Service
// Real-time alert persistence, cross-account visibility
// ============================================================

import { db } from './firebase';
import {
  collection, doc, setDoc, getDoc, getDocs, updateDoc,
  onSnapshot, query, where, orderBy, limit, serverTimestamp, Unsubscribe
} from 'firebase/firestore';
import { AlertDoc, UserDoc } from './types';
import { debugLog, debugError } from './debug';

const ALERTS_COL = 'alerts';
const USERS_COL = 'users';

// ─── Create Alert in Firestore ───
export async function createAlert(alert: AlertDoc): Promise<string> {
  try {
    const ref = doc(db, ALERTS_COL, alert.id);
    await setDoc(ref, { ...alert, createdAt: Date.now() });
    debugLog('Firestore', 'Alert created:', alert.id);
    return alert.id;
  } catch (err) {
    debugError('Firestore', 'Failed to create alert:', err);
    throw err;
  }
}

// ─── Get active alert for a user (civilian) ───
export async function getMyActiveAlert(userId: string): Promise<AlertDoc | null> {
  try {
    const q = query(
      collection(db, ALERTS_COL),
      where('userId', '==', userId),
      where('status', 'in', ['pending', 'accepted', 'en_route']),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data() as AlertDoc;
    }
    return null;
  } catch (err) {
    debugError('Firestore', 'getMyActiveAlert failed:', err);
    return null;
  }
}

// ─── Get all pending alerts (for responders) ───
export async function getPendingAlerts(): Promise<AlertDoc[]> {
  try {
    const q = query(
      collection(db, ALERTS_COL),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as AlertDoc);
  } catch (err) {
    debugError('Firestore', 'getPendingAlerts failed:', err);
    return [];
  }
}

// ─── Responder accepts an alert ───
export async function acceptAlert(alertId: string, responder: UserDoc): Promise<void> {
  try {
    const ref = doc(db, ALERTS_COL, alertId);
    await updateDoc(ref, {
      status: 'accepted',
      responderId: responder.id,
      responderName: responder.username,
      responderPhone: responder.phone || '',
      responderRole: responder.role,
      responderLocation: responder.location ? { lat: responder.location.lat, lng: responder.location.lng } : null,
      acceptedAt: Date.now(),
    });
    debugLog('Firestore', `Alert ${alertId} accepted by ${responder.username}`);
  } catch (err) {
    debugError('Firestore', 'acceptAlert failed:', err);
    throw err;
  }
}

// ─── Update responder location on alert ───
export async function updateResponderLocation(alertId: string, lat: number, lng: number): Promise<void> {
  try {
    const ref = doc(db, ALERTS_COL, alertId);
    await updateDoc(ref, {
      responderLocation: { lat, lng },
      status: 'en_route',
    });
  } catch (err) {
    debugError('Firestore', 'updateResponderLocation failed:', err);
  }
}

// ─── Resolve alert ───
export async function resolveAlertInDB(alertId: string): Promise<void> {
  try {
    const ref = doc(db, ALERTS_COL, alertId);
    await updateDoc(ref, { status: 'resolved', resolvedAt: Date.now() });
    debugLog('Firestore', 'Alert resolved:', alertId);
  } catch (err) {
    debugError('Firestore', 'resolveAlert failed:', err);
    throw err;
  }
}

// ─── Real-time listener for a specific alert ───
export function listenToAlert(alertId: string, callback: (alert: AlertDoc | null) => void): Unsubscribe {
  const ref = doc(db, ALERTS_COL, alertId);
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as AlertDoc);
    } else {
      callback(null);
    }
  }, (err) => {
    debugError('Firestore', 'listenToAlert error:', err);
    callback(null);
  });
}

// ─── Real-time listener for pending alerts (responder dashboard) ───
export function listenToPendingAlerts(callback: (alerts: AlertDoc[]) => void): Unsubscribe {
  const q = query(
    collection(db, ALERTS_COL),
    where('status', 'in', ['pending', 'accepted', 'en_route']),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  return onSnapshot(q, (snap) => {
    const alerts = snap.docs.map(d => d.data() as AlertDoc);
    callback(alerts);
  }, (err) => {
    debugError('Firestore', 'listenToPendingAlerts error:', err);
    callback([]);
  });
}

// ─── Haversine distance ───
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const p = 0.017453292519943295;
  const c = Math.cos;
  const a = 0.5 - c((lat2 - lat1) * p) / 2 + c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p)) / 2;
  return 12742 * Math.asin(Math.sqrt(a));
}

// ─── Get emergency number by type ───
export function getEmergencyNumber(type: string): { label: string; number: string } {
  const t = type.toLowerCase();
  if (t.includes('fire') || t.includes('burn') || t.includes('smoke')) return { label: 'Fire Dept', number: '101' };
  if (t.includes('medical') || t.includes('heart') || t.includes('ambulance') || t.includes('injury')) return { label: 'Ambulance', number: '108' };
  if (t.includes('violence') || t.includes('robbery') || t.includes('assault') || t.includes('police')) return { label: 'Police', number: '100' };
  if (t.includes('flood') || t.includes('disaster')) return { label: 'NDRF', number: '011-24363260' };
  return { label: 'Emergency', number: '112' };
}
