'use client';

import React from 'react';
import Image from 'next/image';
import { 
  History, 
  MapPin, 
  ShieldCheck, 
  LogOut, 
  ChevronRight, 
  Edit3,
  Bell,
  Lock
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

const ProfilePage = () => {
  const { currentUser } = useAppStore();

  const menuItems = [
    { title: 'Emergency History', icon: History, color: 'text-blue-500', bg: 'bg-blue-50' },
    { title: 'Saved Locations', icon: MapPin, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { title: 'Privacy Settings', icon: Lock, color: 'text-amber-500', bg: 'bg-amber-50' },
    { title: 'Notification Prefs', icon: Bell, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  return (
    <div className="flex flex-col flex-1 pb-24 overflow-y-auto no-scrollbar">
      {/* Profile Header */}
      <div className="bg-white px-6 pt-16 pb-8 text-center relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/5 to-transparent"></div>
         
         <div className="relative inline-block mb-4">
            <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white soft-shadow mx-auto">
              <Image src={currentUser?.avatar || ''} alt="Profile" fill className="object-cover" />
            </div>
            <button className="absolute -bottom-1 -right-1 bg-primary text-white p-2 rounded-xl shadow-lg border-2 border-white tap-effect">
              <Edit3 size={14} />
            </button>
         </div>
         
         <h2 className="text-xl font-black text-gray-900">{currentUser?.name}</h2>
         <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mt-1">Premium User</p>
      </div>

      {/* Stats Quick View */}
      <div className="px-6 grid grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
           <span className="text-[10px] font-black text-gray-400 uppercase">Alerts Sent</span>
           <div className="text-lg font-black text-gray-900">12</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
           <span className="text-[10px] font-black text-gray-400 uppercase">Responders</span>
           <div className="text-lg font-black text-gray-900">03 <span className="text-[10px] text-gray-400 font-bold">SAVED</span></div>
        </div>
      </div>

      {/* Menu List */}
      <div className="px-6 flex flex-col gap-3">
        {menuItems.map((item, idx) => (
          <div 
            key={idx} 
            className="group flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-50 soft-shadow hover:border-primary/20 transition-all cursor-pointer tap-effect"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${item.bg} ${item.color}`}>
                <item.icon size={20} />
              </div>
              <span className="text-sm font-bold text-gray-800">{item.title}</span>
            </div>
            <ChevronRight size={18} className="text-gray-300 group-hover:text-primary transition-colors" />
          </div>
        ))}
      </div>

      {/* Logout Button */}
      <div className="mt-12 px-6">
        <button className="w-full flex items-center justify-center gap-3 py-4 bg-red-50 text-primary border border-red-100 rounded-2xl font-bold transition-all hover:bg-primary hover:text-white tap-effect">
          <LogOut size={20} />
          Sign Out
        </button>
      </div>

      <div className="mt-8 px-6 text-center">
        <p className="text-[10px] text-gray-300 font-bold uppercase tracking-[0.3em]">CrisisLink v1.0.4 Premium</p>
      </div>
    </div>
  );
};

export default ProfilePage;
