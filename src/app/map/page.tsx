'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/lib/store';
import { Shield, Clock, X, Phone } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const MapComponent = dynamic(() => import('@/components/MapComponent'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center text-gray-400 font-medium tracking-widest uppercase">Initializing Radar...</div>
});

const MapPage = () => {
  const { activeAlert, setActiveAlert, updateUserLocation, responders } = useAppStore();

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

  const getResponder = () => {
    if (!activeAlert) return responders[0];
    if (activeAlert.type.toLowerCase().includes('fire')) return responders[2];
    if (activeAlert.type.toLowerCase().includes('medical')) return responders[1];
    return responders[0];
  };

  const responder = getResponder();

  const aiInstructions = activeAlert?.type.toLowerCase().includes('fire') 
    ? ["Stay low to avoid smoke.", "Don't use elevators.", "Head to the assembly point."]
    : ["Stay calm.", "Applying pressure to wounds.", "Help is 2km away."];

  return (
    <div className="flex flex-col flex-1 h-screen bg-white relative overflow-hidden">
      {/* Top Map Section (Half Screen if Alert Active) */}
      <div className={`${activeAlert ? 'h-[45%]' : 'h-full'} w-full transition-all duration-700 ease-in-out relative`}>
        <MapComponent />
        
        {/* Transparent Gradient Overlay for Smoothness */}
        {activeAlert && (
          <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white to-transparent z-10"></div>
        )}
      </div>

      {/* Active Tracking Content (Bottom Half) */}
      {activeAlert ? (
        <div className="flex-1 bg-white flex flex-col animate-in slide-in-from-bottom-full duration-700">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-primary animate-pulse">
                  <Shield size={24} />
                </div>
                <div>
                   <h3 className="text-sm font-black text-gray-900 uppercase tracking-tighter">Emergency Tracked</h3>
                   <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Help arriving in 4:20 min</span>
                   </div>
                </div>
             </div>
             <button 
                onClick={() => setActiveAlert(null)}
                className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:text-primary transition-colors"
             >
                <X size={20} />
             </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 no-scrollbar">
            {/* AI Guidance Section */}
            <div className="mb-6">
               <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-blue-50 text-blue-500 rounded-lg">
                    <Shield size={14} />
                  </div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">AI Safety Guidance</span>
               </div>
               <div className="flex flex-col gap-3">
                  {aiInstructions.map((text, i) => (
                    <div key={i} className="flex gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 animate-in slide-in-from-left duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                       <div className="text-lg">🚑</div>
                       <p className="text-xs font-bold text-gray-700 leading-relaxed">{text}</p>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="px-6 pb-24 pt-2">
             <Link 
               href="/chat"
               className="w-full bg-primary text-white py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-primary/20 transition-transform active:scale-95"
             >
                <Phone size={20} /> CALL EMERGENCY LINE
             </Link>
          </div>
        </div>
      ) : (
        <div className="absolute top-12 left-6 right-6 z-10">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 soft-shadow flex items-center gap-3 border border-gray-100">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span className="text-sm font-bold text-gray-900">Scanning for nearby responders...</span>
          </div>
        </div>
      )}

      {/* Floating Responder Chat Icon (Bottom Right Above Nav) */}
      {activeAlert && (
        <Link 
          href="/chat"
          className="fixed bottom-28 right-6 w-16 h-16 bg-white rounded-2xl shadow-2xl border-2 border-gray-50 flex items-center justify-center z-50 tap-effect animate-bounce"
        >
           <Image 
             src={responder.avatar} 
             alt="Responder" 
             width={44} 
             height={44} 
             className="rounded-xl object-cover"
           />
           <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-lg">
              2
           </div>
        </Link>
      )}
    </div>
  );
};

export default MapPage;
