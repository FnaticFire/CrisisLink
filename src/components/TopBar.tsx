'use client';

import React, { useState } from 'react';
import { Bell, Search, X, Check } from 'lucide-react';
import { MapPin, RefreshCw, LogOut } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

interface TopBarProps {
  showSearch?: boolean;
  onSearch?: (q: string) => void;
  searchQuery?: string;
}

const TopBar: React.FC<TopBarProps> = ({ showSearch = true, onSearch, searchQuery = '' }) => {
  const { currentUser, notifications, markNotificationsRead, updateUserLocation, setCurrentUser } = useAppStore();
  const [showNotifs, setShowNotifs] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleBellClick = () => {
    setShowNotifs((prev) => !prev);
    if (!showNotifs) markNotificationsRead();
  };

  const handleRefreshLocation = () => {
    if (!('geolocation' in navigator)) return;
    setIsRefreshing(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
            headers: { 'Accept-Language': 'en' }
          });
          const data = await res.json();
          let placeName = 'Locating...';
          
          if (data && data.address) {
            placeName = data.address.neighbourhood || data.address.suburb || data.address.city_district || data.address.city || data.address.town || 'New Delhi';
            if (data.address.city) placeName += ', ' + data.address.city;
          }
          
          updateUserLocation(lat, lng, placeName);
        } catch (err) {
          updateUserLocation(pos.coords.latitude, pos.coords.longitude, 'Location Updated');
        } finally {
          setIsRefreshing(false);
        }
      },
      () => {
        setIsRefreshing(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    router.push('/login');
  };

  return (
    <div className="pt-6 px-6 bg-white shrink-0 relative z-50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 font-medium tracking-wide flex items-center gap-1">
            <MapPin size={12} className="text-primary" />
            YOUR LOCATION
            <button onClick={handleRefreshLocation} disabled={isRefreshing} className="ml-1 p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50">
              <RefreshCw size={12} className={`text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </span>
          <h2 className="text-sm font-semibold text-gray-800 truncate max-w-[180px]">
            {currentUser?.location?.address || 'Connaught Place, New Delhi'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSignOut}
            className="p-2.5 bg-red-50 rounded-full text-red-500 soft-shadow tap-effect flex items-center gap-1"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
          <button
            onClick={handleBellClick}
            className="p-2.5 bg-gray-50 rounded-full text-gray-600 soft-shadow tap-effect relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-white" />
            )}
          </button>
        </div>
      </div>

      {showSearch && (
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch?.(e.target.value)}
            placeholder="Search responders or services..."
            className="w-full bg-gray-50 border-none rounded-2xl py-3.5 pl-11 pr-10 text-sm focus:ring-2 focus:ring-primary/20 transition-all soft-shadow outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => onSearch?.('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* Notification Dropdown */}
      {showNotifs && (
        <div className="absolute top-16 right-6 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in slide-in-from-top-5 duration-200">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <span className="text-xs font-black text-gray-600 uppercase tracking-widest">Notifications</span>
            <button onClick={() => setShowNotifs(false)}>
              <X size={16} className="text-gray-400" />
            </button>
          </div>
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">No notifications</div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className={`px-4 py-3 border-b border-gray-50 flex gap-3 items-start ${n.read ? 'opacity-60' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${n.read ? 'bg-gray-100 text-gray-400' : 'bg-primary/10 text-primary'}`}>
                  {n.read ? <Check size={14} /> : <Bell size={14} />}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-900">{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{formatDistanceToNow(n.time, { addSuffix: true })}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default TopBar;
