// ============================================================
// CrisisLink — Firestore Alert Service
// Real-time alert persistence, cross-account visibility
// ============================================================

import { db } from './firebase';
import {
  collection, doc, setDoc, getDocs, updateDoc,
  onSnapshot, query, where, limit, Unsubscribe
} from 'firebase/firestore';
import { AlertDoc, UserDoc } from './types';
import { debugLog, debugError } from './debug';

const ALERTS_COL = 'alerts';

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
// Uses simple query without orderBy to avoid needing composite index
export async function getMyActiveAlert(userId: string): Promise<AlertDoc | null> {
  try {
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    const q = query(
      collection(db, ALERTS_COL),
      where('userId', '==', userId),
      where('status', 'in', ['pending', 'accepted', 'en_route']),
      where('createdAt', '>', twentyFourHoursAgo)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      // Sort client-side to get the most recent
      const alerts = snap.docs.map(d => d.data() as AlertDoc);
      alerts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      return alerts[0];
    }
    return null;
  } catch (err) {
    debugError('Firestore', 'getMyActiveAlert failed:', err);
    return null;
  }
}

// ─── Get resolved alerts for history ───
export async function getResolvedAlerts(userId: string): Promise<AlertDoc[]> {
  try {
    // Fetch alerts where user was survivor
    const q1 = query(
      collection(db, ALERTS_COL),
      where('userId', '==', userId),
      where('status', '==', 'resolved'),
      limit(20)
    );
    // Fetch alerts where user was responder
    const q2 = query(
      collection(db, ALERTS_COL),
      where('responderId', '==', userId),
      where('status', '==', 'resolved'),
      limit(20)
    );
    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    const alerts = [
      ...snap1.docs.map(d => d.data() as AlertDoc),
      ...snap2.docs.map(d => d.data() as AlertDoc)
    ];
    alerts.sort((a, b) => (b.resolvedAt || 0) - (a.resolvedAt || 0));
    return alerts;
  } catch (err) {
    debugError('Firestore', 'getResolvedAlerts failed:', err);
    return [];
  }
}

// ─── Get active mission for a responder ───
export async function getResponderActiveAlert(responderId: string): Promise<AlertDoc | null> {
  try {
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    const q = query(
      collection(db, ALERTS_COL),
      where('responderId', '==', responderId),
      where('status', 'in', ['accepted', 'en_route']),
      where('createdAt', '>', twentyFourHoursAgo)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const alerts = snap.docs.map(d => d.data() as AlertDoc);
      alerts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      return alerts[0];
    }
    return null;
  } catch (err) {
    debugError('Firestore', 'getResponderActiveAlert failed:', err);
    return null;
  }
}

// ─── Get active mission for a traffic responder ───
export async function getTrafficActiveAlert(trafficResponderId: string): Promise<AlertDoc | null> {
  try {
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    const q = query(
      collection(db, ALERTS_COL),
      where('trafficResponderId', '==', trafficResponderId),
      where('status', 'in', ['accepted', 'en_route']),
      where('createdAt', '>', twentyFourHoursAgo)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const alerts = snap.docs.map(d => d.data() as AlertDoc);
      alerts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      return alerts[0];
    }
    return null;
  } catch (err) {
    debugError('Firestore', 'getTrafficActiveAlert failed:', err);
    return null;
  }
}

// ─── Real-time listener for ALL non-resolved alerts ───
// NO orderBy — avoids composite index requirement. Sort client-side.
export function listenToPendingAlerts(callback: (alerts: AlertDoc[]) => void): Unsubscribe {
  // Listen to ALL alerts and filter client-side to avoid composite index issues
  const colRef = collection(db, ALERTS_COL);
  return onSnapshot(colRef, (snap) => {
    const all = snap.docs.map(d => d.data() as AlertDoc);
    // Filter to non-resolved only
    const active = all.filter(a => a.status !== 'resolved');
    // Sort by createdAt descending
    active.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    debugLog('Firestore', `listenToPendingAlerts: ${active.length} active alerts found`);
    callback(active);
  }, (err) => {
    debugError('Firestore', 'listenToPendingAlerts error:', err);
    callback([]);
  });
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
      trafficSupport: responder.role === 'fire' || responder.role === 'hospital',
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

export async function setHospitalDestination(alertId: string, hName: string, lat: number, lng: number): Promise<void> {
  try {
    const ref = doc(db, ALERTS_COL, alertId);
    await updateDoc(ref, {
      hospitalName: hName,
      hospitalLocation: { lat, lng }
    });
  } catch (err) {
    debugError('Firestore', 'setHospitalDestination failed:', err);
  }
}

// ─── Update civilian (user) location on alert ───
export async function updateUserLocationInAlert(alertId: string, lat: number, lng: number): Promise<void> {
  try {
    const ref = doc(db, ALERTS_COL, alertId);
    await updateDoc(ref, {
      userLocation: { lat, lng }
    });
  } catch (err) {
    debugError('Firestore', 'updateUserLocationInAlert failed:', err);
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

// ─── Traffic Support & Green Corridor ───
export async function joinAsTrafficSupport(alertId: string, responder: UserDoc): Promise<void> {
  try {
    const ref = doc(db, ALERTS_COL, alertId);
    await updateDoc(ref, {
      trafficSupport: true,
      trafficResponderId: responder.id,
      trafficResponderName: responder.username,
      greenCorridorLevel: 'MEDIUM'
    });
  } catch (err) {
    debugError('Firestore', 'joinAsTrafficSupport failed:', err);
  }
}

export async function leaveTrafficSupport(alertId: string): Promise<void> {
  try {
    const ref = doc(db, ALERTS_COL, alertId);
    await updateDoc(ref, {
      trafficSupport: false,
      trafficResponderId: null,
      trafficResponderName: null,
      greenCorridorLevel: null
    });
  } catch (err) {
    debugError('Firestore', 'leaveTrafficSupport failed:', err);
  }
}

export async function updateGreenCorridor(alertId: string, level: 'LOW' | 'MEDIUM' | 'HIGH' | 'MAX'): Promise<void> {
  try {
    const ref = doc(db, ALERTS_COL, alertId);
    await updateDoc(ref, { greenCorridorLevel: level });
  } catch (err) {
    debugError('Firestore', 'updateGreenCorridor failed:', err);
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
// ─── Utility: Clear all alerts (for testing only) ───
export async function clearAllAlerts(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, ALERTS_COL));
    // For large collections this should be done in batches, but for demo it is fine
    const promises = snap.docs.map(d => {
      // Also clear subcollections if any, but alerts don't have them yet
      // Messages are in their own collection per alert
      return setDoc(doc(db, ALERTS_COL, d.id), { status: 'resolved', resolvedAt: Date.now() });
    });
    await Promise.all(promises);
    debugLog('Firestore', 'All alerts cleared');
  } catch (err) {
    debugError('Firestore', 'clearAllAlerts failed:', err);
  }
}
