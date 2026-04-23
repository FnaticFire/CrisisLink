'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/lib/store';
import { Shield, X, Phone, MessageSquare, CheckCircle2, Navigation } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center text-gray-400 font-medium tracking-widest uppercase text-sm">
      Initializing Radar...
    </div>
  ),
});

const MapPage = () => {
  const { activeAlert, resolveAlert, updateUserLocation, responders, setActiveAlert, currentUser } = useAppStore();
  const router = useRouter();
  const [etaSeconds, setEtaSeconds] = useState(4 * 60 + 20); // 4:20 countdown
  const [responderProgress, setResponderProgress] = useState(0); // 0-100%
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const progRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => updateUserLocation(pos.coords.latitude, pos.coords.longitude, 'Your Current Location'),
        () => {}
      );
    }
  }, [updateUserLocation]);

  // Live ETA countdown
  useEffect(() => {
    if (!activeAlert) return;

    setEtaSeconds(4 * 60 + 20);
    setResponderProgress(0);

    timerRef.current = setInterval(() => {
      setEtaSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    progRef.current = setInterval(() => {
      setResponderProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progRef.current);
          return 100;
        }
        return prev + (100 / (4 * 60 + 20));
      });
    }, 1000);

    return () => {
      clearInterval(timerRef.current);
      clearInterval(progRef.current);
    };
  }, [activeAlert?.id]);

  const formatETA = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const getResponder = () => {
    if (!activeAlert) return responders[0];
    const type = activeAlert.type.toLowerCase();
    if (type.includes('fire')) return responders[2];
    if (type.includes('medical')) return responders[1];
    return responders[0];
  };
  const responder = getResponder();

  const getAiInstructions = () => {
    if (!activeAlert) return ['Stay calm.', 'Help is nearby.', 'Keep your phone accessible.'];
    const type = activeAlert.type.toLowerCase();
    if (type.includes('fire')) return ['🔥 Stay low to avoid smoke.', "🚪 Don't use elevators.", '🏃 Head to the assembly point.'];
    if (type.includes('medical')) return ['🛑 Keep the patient still.', '🩸 Apply pressure to wounds.', '📞 Stay on call with responder.'];
    return ['🛑 Stay calm and breathe.', '📍 Your location is being tracked.', '📞 Help is 2km away.'];
  };

  const handleResolve = () => {
    clearInterval(timerRef.current);
    clearInterval(progRef.current);
    toast.success('Emergency resolved. Stay safe!');
    resolveAlert();
    router.push('/alerts');
  };

  return (
    <div className="flex flex-col flex-1 h-screen bg-white relative overflow-hidden">
      {/* Map Section */}
      <div className={`${activeAlert ? 'h-[45%]' : 'h-full'} w-full transition-all duration-700 ease-in-out relative`}>
        <MapComponent />
        {activeAlert && (
          <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />
        )}
      </div>

      {/* No Alert State */}
      {!activeAlert && (
        <div className="absolute top-12 left-6 right-6 z-10 flex flex-col gap-3">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 soft-shadow flex items-center gap-3 border border-gray-100">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-sm font-bold text-gray-900">Scanning for nearby responders...</span>
          </div>
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 soft-shadow border border-gray-100">
            <p className="text-xs font-black text-gray-500 uppercase mb-2">Nearby Emergency Services</p>
            <div className="flex flex-col gap-2">
              {[
                { name: 'AIIMS Trauma Centre', dist: '1.2 km', icon: '🏥', phone: '011-26588500' },
                { name: 'CP Police Station', dist: '0.5 km', icon: '👮', phone: '011-23417280' },
                { name: 'Fire Station CP', dist: '1.1 km', icon: '🚒', phone: '101' },
              ].map((s) => (
                <div key={s.name} className="flex items-center justify-between">
                  <span className="text-xs text-gray-700">{s.icon} {s.name} · {s.dist}</span>
                  <a href={`tel:${s.phone}`} className="text-[10px] bg-primary text-white px-2 py-1 rounded-lg font-bold tap-effect">
                    Call
                  </a>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-primary text-white py-4 rounded-2xl font-black text-base shadow-xl shadow-primary/20 tap-effect active:scale-95 transition-all"
          >
            🚨 Trigger Emergency Alert
          </button>
        </div>
      )}

      {/* Active Alert Tracking Panel */}
      {activeAlert && (
        <div className="flex-1 bg-white flex flex-col animate-in slide-in-from-bottom-full duration-700 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-primary animate-pulse shrink-0">
                <Shield size={24} />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-tighter">Emergency Tracked</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {etaSeconds > 0 ? `Help arriving in ${formatETA(etaSeconds)}` : '🟢 Responder has arrived!'}
                  </span>
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

          <div className="flex-1 overflow-y-auto no-scrollbar">
            <div className="px-6 py-4">
              {/* Responder Info */}
              <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-100">
                <div className="w-14 h-14 rounded-2xl overflow-hidden relative shrink-0">
                  <Image src={responder.avatar} alt={responder.name} fill className="object-cover" />
                </div>
                <div className="flex-1">
                  <p className="font-black text-gray-900 text-sm">{responder.name}</p>
                  <p className="text-xs text-gray-500">{responder.experience} exp • ⭐ {responder.rating}</p>
                  {/* Progress bar */}
                  <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-1000"
                      style={{ width: `${responderProgress}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-primary font-black mt-1 uppercase">
                    <Navigation size={9} className="inline mr-1" />
                    {etaSeconds > 0 ? `En route — ETA ${formatETA(etaSeconds)}` : 'Arrived at location'}
                  </p>
                </div>
              </div>

              {/* AI Safety Guidance */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-blue-50 text-blue-500 rounded-lg">
                    <Shield size={14} />
                  </div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">AI Safety Guidance</span>
                </div>
                <div className="flex flex-col gap-2">
                  {getAiInstructions().map((text, i) => (
                    <div key={i} className="flex gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 animate-in slide-in-from-left duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                      <p className="text-xs font-bold text-gray-700 leading-relaxed">{text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Type & Severity */}
              <div className="flex gap-2 mb-4">
                <div className="flex-1 bg-red-50 border border-red-100 rounded-2xl p-3 text-center">
                  <p className="text-[9px] font-black text-gray-400 uppercase">Type</p>
                  <p className="text-xs font-black text-red-600 mt-0.5">{activeAlert.type}</p>
                </div>
                <div className="flex-1 bg-orange-50 border border-orange-100 rounded-2xl p-3 text-center">
                  <p className="text-[9px] font-black text-gray-400 uppercase">Severity</p>
                  <p className="text-xs font-black text-orange-600 mt-0.5 uppercase">{activeAlert.severity}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="px-6 pb-28 pt-2 flex flex-col gap-2 shrink-0">
            <Link
              href="/chat"
              className="w-full bg-primary text-white py-4 rounded-2xl font-black text-base flex items-center justify-center gap-3 shadow-xl shadow-primary/20 transition-transform active:scale-95"
            >
              <MessageSquare size={20} /> Open Emergency Chat
            </Link>
            <button
              onClick={handleResolve}
              className="w-full bg-green-50 text-green-700 border border-green-200 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 tap-effect"
            >
              <CheckCircle2 size={18} /> Mark as Resolved
            </button>
          </div>
        </div>
      )}

      {/* Floating Responder Chat Icon */}
      {activeAlert && (
        <Link
          href="/chat"
          className="fixed bottom-32 right-6 w-16 h-16 bg-white rounded-2xl shadow-2xl border-2 border-gray-50 flex items-center justify-center z-50 tap-effect animate-bounce"
        >
          <Image src={responder.avatar} alt="Responder" width={44} height={44} className="rounded-xl object-cover" />
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-lg">
            1
          </div>
        </Link>
      )}
    </div>
  );
};

export default MapPage;
