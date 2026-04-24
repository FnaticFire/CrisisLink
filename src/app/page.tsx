'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, Users, Landmark, BookOpen, ChevronRight, X } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import TopBar from '@/components/TopBar';
import ResponderCard from '@/components/ResponderCard';
import EmergencyTrigger from '@/components/EmergencyTrigger';

// Safety tips modal content
const SAFETY_TIPS = [
  { icon: '🔥', title: 'Fire Emergency', tips: ['Stay low below smoke. Crawl to exit.', 'Touch door before opening — if hot, find another way.', 'Never use elevators during fire. Use stairs only.', 'Meet at the pre-designated assembly point.'] },
  { icon: '🏥', title: 'Medical Emergency', tips: ['Call 108 immediately for ambulance.', 'Do NOT move a seriously injured person.', 'Apply firm pressure on bleeding wounds.', 'For cardiac arrest, start CPR: 30 compressions + 2 breaths.'] },
  { icon: '🚗', title: 'Road Accident', tips: ['Turn on hazard lights. Set up warning triangles.', 'Do not remove helmet from injured motorcyclist.', 'Call 112 (Police) + 108 (Ambulance).', 'Note the vehicle registration number.'] },
  { icon: '🌊', title: 'Flood / Natural Disaster', tips: ['Move to higher ground immediately.', 'Do not walk through moving water — 6 inches can knock you down.', 'Avoid downed power lines.', 'Call NDRF: 011-24363260.'] },
  { icon: '🆘', title: 'Personal Safety', tips: ['Trust your instincts — if something feels wrong, act.', 'Share your live location with a trusted contact.', 'Scream "FIRE!" loudly — people respond faster.', 'Use CrisisLink to alert nearby responders instantly.'] },
];

const EMERGENCY_NUMBERS = [
  { label: 'National Emergency', number: '112', color: 'bg-red-500' },
  { label: 'Ambulance', number: '108', color: 'bg-blue-500' },
  { label: 'Police', number: '100', color: 'bg-indigo-500' },
  { label: 'Fire Brigade', number: '101', color: 'bg-orange-500' },
  { label: "Women's Helpline", number: '1091', color: 'bg-pink-500' },
  { label: 'Child Helpline', number: '1098', color: 'bg-purple-500' },
];

export default function Home() {
  const { responders, updateUserLocation, activeAlert } = useAppStore();
  const [showTrigger, setShowTrigger] = useState(false);
  const [showSafetyTips, setShowSafetyTips] = useState(false);
  const [showHospitals, setShowHospitals] = useState(false);
  const [selectedTip, setSelectedTip] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  React.useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateUserLocation(
            position.coords.latitude,
            position.coords.longitude,
            'Your Current Location'
          );
        },
        () => {}
      );
    }
  }, [updateUserLocation]);

  const quickActions = [
    { label: 'Emergency', icon: ShieldAlert, color: 'bg-red-50 text-red-500', action: () => setShowTrigger(true) },
    { label: 'Responders', icon: Users, color: 'bg-blue-50 text-blue-500', path: '/alerts' },
    { label: 'Hospitals', icon: Landmark, color: 'bg-emerald-50 text-emerald-500', action: () => setShowHospitals(true) },
    { label: 'Safety Tips', icon: BookOpen, color: 'bg-amber-50 text-amber-500', action: () => setShowSafetyTips(true) },
  ];

  const filteredResponders = searchQuery
    ? responders.filter(
        (r) =>
          (r.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (r.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : responders;

  return (
    <div className="flex flex-col flex-1 pb-24 overflow-y-auto no-scrollbar">
      <TopBar onSearch={setSearchQuery} searchQuery={searchQuery} />

      <main className="flex-1 px-6 pt-4">
        {/* Active Alert Banner */}
        {activeAlert && (
          <Link href="/map">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 to-red-700 p-4 mb-4 soft-shadow cursor-pointer animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <ShieldAlert size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-black text-sm uppercase tracking-tight">🚨 Active Emergency</p>
                  <p className="text-white/80 text-xs">{activeAlert.type} • Help is en route</p>
                </div>
                <ChevronRight size={20} className="text-white ml-auto" />
              </div>
            </div>
          </Link>
        )}

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
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            const inner = (
              <div className="flex flex-col items-center gap-2 group cursor-pointer tap-effect">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${action.color} soft-shadow transition-transform group-active:scale-95`}>
                  <Icon size={24} />
                </div>
                <span className="text-[10px] font-bold text-gray-600 text-center uppercase tracking-tight">{action.label}</span>
              </div>
            );

            if ('action' in action && action.action) {
              return (
                <button key={idx} onClick={action.action} className="w-full">
                  {inner}
                </button>
              );
            }
            return (
              <Link key={idx} href={(action as any).path}>
                {inner}
              </Link>
            );
          })}
        </div>

        {/* Emergency Numbers */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Emergency Numbers</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {EMERGENCY_NUMBERS.map((em) => (
              <a key={em.number} href={`tel:${em.number}`} className="flex flex-col items-center gap-1.5 p-3 bg-white rounded-2xl border border-gray-50 soft-shadow tap-effect active:scale-95 transition-transform">
                <span className={`w-8 h-8 ${em.color} rounded-full flex items-center justify-center text-white text-xs font-black`}>
                  {em.number}
                </span>
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tight text-center leading-tight">{em.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Nearby Responders Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              {searchQuery ? `Results for "${searchQuery}"` : 'Nearby Responders'}
            </h3>
            <Link href="/alerts" className="text-primary text-xs font-bold flex items-center gap-0.5">
              See All <ChevronRight size={14} />
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            {filteredResponders.length > 0 ? (
              filteredResponders.slice(0, 4).map((responder) => (
                <ResponderCard key={responder.id} responder={responder} />
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Users size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium">No responders found for your search</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Emergency Trigger Overlay */}
      {showTrigger && <EmergencyTrigger onClose={() => setShowTrigger(false)} />}

      {/* Safety Tips Modal */}
      {showSafetyTips && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end p-4">
          <div className="w-full bg-white rounded-3xl p-6 max-h-[80vh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-10 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-900">Safety Tips</h2>
              <button onClick={() => setShowSafetyTips(false)} className="p-2 bg-gray-100 rounded-full text-gray-500">
                <X size={20} />
              </button>
            </div>
            {/* Category tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
              {SAFETY_TIPS.map((tip, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedTip(i)}
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedTip === i ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}
                >
                  {tip.icon} {tip.title.split(' ')[0]}
                </button>
              ))}
            </div>
            <div className="bg-gray-50 rounded-2xl p-4">
              <h3 className="font-black text-gray-900 mb-3">{SAFETY_TIPS[selectedTip].icon} {SAFETY_TIPS[selectedTip].title}</h3>
              <ol className="flex flex-col gap-3">
                {SAFETY_TIPS[selectedTip].tips.map((tip, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-sm text-gray-700 font-medium leading-relaxed">{tip}</p>
                  </li>
                ))}
              </ol>
            </div>
            <button
              onClick={() => { setShowSafetyTips(false); setShowTrigger(true); }}
              className="w-full mt-4 bg-primary text-white py-4 rounded-2xl font-black tap-effect"
            >
              🚨 Trigger Emergency Alert
            </button>
          </div>
        </div>
      )}

      {/* Hospitals Modal */}
      {showHospitals && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end p-4">
          <div className="w-full bg-white rounded-3xl p-6 max-h-[80vh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-10 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-900">Nearby Hospitals</h2>
              <button onClick={() => setShowHospitals(false)} className="p-2 bg-gray-100 rounded-full text-gray-500">
                <X size={20} />
              </button>
            </div>
            {[
              { name: 'AIIMS Trauma Centre', dist: '1.2 km', phone: '011-26588500', type: 'Government', rating: 4.8 },
              { name: 'Ram Manohar Lohia Hospital', dist: '2.1 km', phone: '011-23404323', type: 'Government', rating: 4.5 },
              { name: 'Safdarjung Hospital', dist: '3.0 km', phone: '011-26707444', type: 'Government', rating: 4.3 },
              { name: 'Apollo Hospital Delhi', dist: '3.8 km', phone: '011-71791090', type: 'Private', rating: 4.7 },
              { name: 'Max Super Speciality', dist: '4.5 km', phone: '011-26515050', type: 'Private', rating: 4.6 },
            ].map((h, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-lg">🏥</div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{h.name}</p>
                    <p className="text-xs text-gray-400">{h.dist} away • ⭐ {h.rating} • {h.type}</p>
                  </div>
                </div>
                <a href={`tel:${h.phone}`} className="bg-primary text-white px-3 py-1.5 rounded-xl text-xs font-bold tap-effect">
                  Call
                </a>
              </div>
            ))}
            <Link href="/map" onClick={() => setShowHospitals(false)} className="w-full mt-2 bg-gray-100 text-gray-700 py-3 rounded-2xl font-bold text-sm flex items-center justify-center tap-effect">
              View on Map
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
