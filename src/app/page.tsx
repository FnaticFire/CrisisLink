'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, Users, Landmark, BookOpen, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import TopBar from '@/components/TopBar';
import ResponderCard from '@/components/ResponderCard';
import EmergencyTrigger from '@/components/EmergencyTrigger';

export default function Home() {
  const { responders, updateUserLocation } = useAppStore();
  const [showTrigger, setShowTrigger] = React.useState(false);

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

  const quickActions = [
    { label: 'Emergency', icon: ShieldAlert, color: 'bg-red-50 text-red-500', path: '/map' },
    { label: 'Responders', icon: Users, color: 'bg-blue-50 text-blue-500', path: '/alerts' },
    { label: 'Hospitals', icon: Landmark, color: 'bg-emerald-50 text-emerald-500', path: '/map' },
    { label: 'Safety Tips', icon: BookOpen, color: 'bg-amber-50 text-amber-500', path: '/alerts' },
  ];

  return (
    <div className="flex flex-col flex-1 pb-24 overflow-y-auto no-scrollbar">
      <TopBar />

      <main className="flex-1 px-6 pt-4">
        {/* Emergency Banner */}
        <div 
          onClick={() => setShowTrigger(true)}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-[#FF5252] p-6 mb-8 soft-shadow cursor-pointer tap-effect active:scale-95 transition-transform"
        >
          <div className="relative z-10 flex flex-col gap-2">
            <h3 className="text-white text-xl font-bold">Emergency Support Available</h3>
            <p className="text-white/80 text-sm font-medium pr-12">Connect instantly with nearby responders and authorities.</p>
            <button className="mt-2 w-max bg-white text-primary px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-black/5">
              Trigger Alert
            </button>
          </div>
          <ShieldAlert className="absolute -right-4 -bottom-4 text-white/10 w-32 h-32 rotate-12" />
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {quickActions.map((action, idx) => (
            <Link key={idx} href={action.path} className="flex flex-col items-center gap-2 group cursor-pointer tap-effect">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${action.color} soft-shadow transition-transform group-active:scale-95`}>
                <action.icon size={24} />
              </div>
              <span className="text-[10px] font-bold text-gray-600 text-center uppercase tracking-tight">{action.label}</span>
            </Link>
          ))}
        </div>

        {/* Nearby Responders Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Nearby Responders</h3>
            <Link href="/alerts" className="text-primary text-xs font-bold flex items-center gap-0.5">
              See All <ChevronRight size={14} />
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            {responders.slice(0, 4).map((responder) => (
              <ResponderCard key={responder.id} responder={responder} />
            ))}
          </div>
        </div>
      </main>

      {/* Emergency Overlay */}
      {showTrigger && <EmergencyTrigger onClose={() => setShowTrigger(false)} />}
    </div>
  );
}
