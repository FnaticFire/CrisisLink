'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/lib/store';
import { Navigation, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { findAllEmergencyServices, NearbyPlace } from '@/lib/places';
import { listenToPendingAlerts } from '@/lib/alertService';
import { AlertDoc } from '@/lib/types';

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400 font-medium text-sm">
      Loading Map...
    </div>
  ),
});

export default function MapPage() {
  const { currentUser, updateUserLocation } = useAppStore();
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [liveAlerts, setLiveAlerts] = useState<AlertDoc[]>([]);

  // Watch position for live updates
  useEffect(() => {
    let watchId: number;
    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => updateUserLocation(pos.coords.latitude, pos.coords.longitude, 'Live Location'),
        () => {},
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 8000 }
      );
    }
    return () => { if (watchId !== undefined) navigator.geolocation.clearWatch(watchId); };
  }, [updateUserLocation]);

  // Listen to live alerts for map pins
  useEffect(() => {
    const unsub = listenToPendingAlerts((alerts) => setLiveAlerts(alerts));
    return () => unsub();
  }, []);

  const handleFindHelpCenters = async () => {
    const lat = currentUser?.location?.lat;
    const lng = currentUser?.location?.lng;
    if (!lat || !lng) {
      toast.error('Location not available. Please enable GPS.');
      return;
    }
    setLoadingPlaces(true);
    try {
      const places = await findAllEmergencyServices(lat, lng);
      const hospitals = places.filter(p => p.type === 'hospital').slice(0, 2);
      const police = places.filter(p => p.type === 'police').slice(0, 2);
      const fire = places.filter(p => p.type === 'fire').slice(0, 1);
      setNearbyPlaces([...hospitals, ...police, ...fire]);
      if (hospitals.length + police.length + fire.length === 0) {
        toast.error('No services found nearby.');
      } else {
        toast.success(`Found ${hospitals.length + police.length + fire.length} nearby services.`);
      }
    } catch {
      toast.error('Failed to find help centers.');
    } finally {
      setLoadingPlaces(false);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-slate-100 relative overflow-hidden">
      {/* Full-screen Map */}
      <div className="flex-1 w-full relative">
        <MapComponent
          nearbyPlaces={nearbyPlaces}
          alerts={liveAlerts as any}
        />

        {/* Overlay Controls */}
        <div className="absolute top-5 left-5 right-5 z-10 flex flex-col gap-2.5 pointer-events-none">
          {/* Location badge */}
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl px-4 py-3 card-shadow flex items-center gap-3 pointer-events-auto">
            <div className="w-2 h-2 bg-primary rounded-full soft-pulse" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Your Location</p>
              <p className="text-sm font-semibold text-slate-800 truncate">{currentUser?.location?.address || 'Locating...'}</p>
            </div>
          </div>

          {/* Find Help Centers */}
          <button
            onClick={handleFindHelpCenters}
            disabled={loadingPlaces}
            className="bg-gradient-to-r from-primary to-indigo-600 text-white font-bold py-3 px-5 rounded-xl shadow-lg pointer-events-auto tap-effect mx-auto text-xs flex items-center gap-2 disabled:opacity-50"
          >
            {loadingPlaces ? <Search size={14} className="animate-spin" /> : <Navigation size={14} />}
            {loadingPlaces ? 'Searching...' : 'Find Help Centers'}
          </button>
        </div>

        {/* Nearby Places List */}
        {nearbyPlaces.length > 0 && (
          <div className="absolute bottom-24 left-4 right-4 z-10 bg-white/95 backdrop-blur-lg rounded-2xl p-4 card-shadow max-h-[35vh] overflow-y-auto no-scrollbar">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Nearby Services</p>
            <div className="flex flex-col gap-2">
              {nearbyPlaces.map((s) => (
                <div key={s.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <span className="text-lg">{s.type === 'hospital' ? '🏥' : s.type === 'police' ? '👮' : '🚒'}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate">{s.name}</p>
                      <p className="text-[10px] text-slate-400">{s.distance} • ⭐ {s.rating}</p>
                    </div>
                  </div>
                  <a href={`tel:${s.phone || '112'}`} className="bg-primary text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shrink-0">
                    Call
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
