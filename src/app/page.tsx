'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, onSnapshot, query, where } from 'firebase/firestore';
import { AlertDoc, UserDoc } from '@/lib/types';
import { LogOut } from 'lucide-react';
import EmergencyTrigger from '@/components/EmergencyTrigger';
import { toast } from 'react-hot-toast';

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-900 animate-pulse"></div>,
});

export default function HomePage() {
  const router = useRouter();
  const { currentUser, setCurrentUser, currentLocation, setCurrentLocation, activeAlertId, setActiveAlertId } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [nearbyAlerts, setNearbyAlerts] = useState<AlertDoc[]>([]);
  const [showTrigger, setShowTrigger] = useState(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = await getDoc(doc(db, 'users', user.uid));
        if (docRef.exists()) {
          setCurrentUser(docRef.data() as UserDoc);
          
          // Listen to nearby alerts if valid user
          const q = query(
            collection(db, 'alerts'), 
            where('status', 'in', ['pending', 'accepted'])
          );

          const unsubAlerts = onSnapshot(q, (snapshot) => {
            const alerts: AlertDoc[] = [];
            snapshot.forEach(d => alerts.push({ id: d.id, ...d.data() } as AlertDoc));
            setNearbyAlerts(alerts);
            
            // Auto redirect if civilian triggers an alert and it's active
            const userAlert = alerts.find(a => a.userId === user.uid);
            if (userAlert) {
              setActiveAlertId(userAlert.id as string);
              router.push(`/active/${userAlert.id}`);
            }
          });

          setLoading(false);
          return () => unsubAlerts();
        } else {
          setCurrentUser(null);
          setLoading(false);
          router.push('/login');
        }
      } else {
        setCurrentUser(null);
        setLoading(false);
        router.push('/login');
      }
    });

    return () => unsubAuth();
  }, [router, setCurrentUser, setActiveAlertId]);

  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn(err),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [setCurrentLocation]);

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center bg-gray-50"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div></div>;
  }

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const handleActionClick = (alert: AlertDoc) => {
    if (currentUser?.role === 'civilian' && currentUser.isVolunteer) {
      router.push(`/active/${alert.id}`);
    } else if (currentUser?.role !== 'civilian') {
      router.push(`/active/${alert.id}`);
    }
  };

  return (
    <div className="h-screen w-full relative overflow-hidden bg-black flex flex-col">
      {/* MAP LAYER ALWAYS VISIBLE FULL SCREEN OR TOP HALF FOR RESPONDERS */}
      <div className={`absolute inset-0 z-0 transition-all ${currentUser?.role !== 'civilian' ? 'h-1/2' : 'h-full'}`}>
        <MapComponent nearbyPlaces={[]} alerts={nearbyAlerts} />
      </div>

      {/* TOP HEADER */}
      <div className="absolute top-0 left-0 w-full p-6 z-10 pointer-events-none flex justify-between items-start">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl px-4 py-2 pointer-events-auto shadow-lg border border-gray-100 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-black text-gray-900 uppercase">
            {currentUser?.role === 'civilian' ? 'Civilian Net' : `${currentUser?.role} Center`}
          </span>
        </div>
        <button onClick={handleLogout} className="bg-white/90 p-2.5 rounded-full pointer-events-auto tap-effect shadow-lg">
          <LogOut size={16} className="text-gray-900" />
        </button>
      </div>

      {/* FLOATING ACTION BOTTOM - CIVILIAN */}
      {currentUser?.role === 'civilian' && (
        <div className="absolute bottom-12 left-6 right-6 z-10">
          <button 
            onClick={() => setShowTrigger(true)}
            className="w-full bg-primary text-white py-5 rounded-2xl font-black text-lg shadow-[0_0_40px_rgba(229,57,53,0.5)] active:scale-95 transition-transform uppercase tracking-wider"
          >
            🚨 Trigger Emergency
          </button>
        </div>
      )}

      {/* EMERGENCY TRIGGER MODAL */}
      {showTrigger && <EmergencyTrigger onClose={() => setShowTrigger(false)} />}

      {/* RESPONDER / VOLUNTEER DASHBOARD BOTTOM HALF */}
      {currentUser?.role !== 'civilian' && (
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-white rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-20 flex flex-col overflow-hidden animate-in slide-in-from-bottom-full duration-500">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-xl font-black text-gray-900">Active Incidents</h2>
              <p className="text-xs text-gray-500 font-medium">Monitoring {nearbyAlerts.length} reports</p>
            </div>
            {nearbyAlerts.length > 0 && <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />}
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 no-scrollbar flex flex-col gap-4">
            {nearbyAlerts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400">
                <span className="text-4xl mb-4">🛡️</span>
                <p className="text-xs font-black uppercase tracking-widest">No Active Incidents</p>
              </div>
            ) : (
              nearbyAlerts.map(alert => (
                <div key={alert.id} className="bg-gray-50 border border-gray-100 p-4 rounded-2xl flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${alert.severity === 'CRITICAL' ? 'bg-red-600' : alert.severity === 'HIGH' ? 'bg-red-400' : alert.severity === 'MEDIUM' ? 'bg-yellow-400' : 'bg-blue-400'}`} />
                      <h3 className="font-bold text-gray-900 capitalize text-sm">{alert.type} Incident</h3>
                    </div>
                    <span className="text-[10px] font-black uppercase bg-white px-2 py-1 rounded-full shadow-sm">{alert.severity}</span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{alert.reason}</p>
                  <button 
                    onClick={() => handleActionClick(alert)}
                    className="w-full bg-gray-900 text-white py-3 rounded-xl text-xs font-bold tap-effect mt-1"
                  >
                    View Details & Respond
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
