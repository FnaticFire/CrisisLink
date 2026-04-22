'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/lib/store';
import { Shield, Clock, X } from 'lucide-react';

const MapComponent = dynamic(() => import('@/components/MapComponent'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center text-gray-400 font-medium tracking-widest uppercase">Initializing Radar...</div>
});

const MapPage = () => {
  const { activeAlert, setActiveAlert, updateUserLocation } = useAppStore();

  React.useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateUserLocation(
            position.coords.latitude,
            position.coords.longitude,
            "Your Current Location"
          );
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, [updateUserLocation]);

  return (
    <div className="flex flex-col grow relative w-full h-[calc(100vh-80px)]">
      {/* Search Overlay */}
      {!activeAlert && (
        <div className="absolute top-12 left-6 right-6 z-10">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 soft-shadow flex items-center gap-3 border border-gray-100">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span className="text-sm font-bold text-gray-900">Scanning for nearby responders...</span>
          </div>
        </div>
      )}

      {/* Full Map */}
      <div className="flex-1 w-full">
        <MapComponent />
      </div>

      {/* Overlay Status Card */}
      {activeAlert ? (
        <div className="absolute bottom-24 left-6 right-6 z-10 animate-slide-up">
          <div className="bg-white rounded-[24px] p-5 shadow-2xl border border-gray-100 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-primary">
                  <Shield size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">Emergency Active</h3>
                  <p className="text-xs text-gray-500 font-bold">Help is on the way</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-primary text-lg font-black tracking-tighter">4 <span className="text-[10px] uppercase">min</span></div>
                <div className="text-[10px] font-bold text-gray-400 uppercase">Estimated ETA</div>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="flex-[2] bg-primary text-white py-3 rounded-xl text-sm font-black shadow-lg shadow-primary/20 tap-effect">
                TRACK RESPONDER
              </button>
              <button 
                onClick={() => setActiveAlert(null)}
                className="flex-1 bg-gray-50 text-gray-400 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border border-gray-100 tap-effect"
              >
                <X size={16} /> CANCEL
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="absolute bottom-24 left-6 right-6 z-10">
           <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between soft-shadow">
              <div className="flex gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                <span className="text-xs font-bold text-gray-600 uppercase">7 Units Available</span>
              </div>
              <button className="text-primary text-xs font-black uppercase">Refresh Radar</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default MapPage;
