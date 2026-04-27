'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Search, X, Check, MapPin, RefreshCw, LogOut, Sun, Moon } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { setDebugField, debugLog, debugError, DEBUG } from '@/lib/debug';
import { toast } from 'react-hot-toast';

interface TopBarProps {
  showSearch?: boolean;
  onSearch?: (q: string) => void;
  searchQuery?: string;
}

const TopBar: React.FC<TopBarProps> = ({ showSearch = true, onSearch, searchQuery = '' }) => {
  const { currentUser, notifications, markNotificationsRead, updateUserLocation, setCurrentUser, theme, toggleTheme } = useAppStore();
  const [showNotifs, setShowNotifs] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleBellClick = () => {
    setShowNotifs((prev) => !prev);
    if (!showNotifs) markNotificationsRead();
  };

  const refreshLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setDebugField({ gps: 'FAILED' });
      if (DEBUG) toast.error('Geolocation API not available in this browser.');
      return;
    }
    setIsRefreshing(true);
    setDebugField({ gps: 'PENDING' });

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        debugLog('GPS', `Coords: ${lat}, ${lng}`);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          let placeName = 'Your Location';

          if (data?.address) {
            const a = data.address;
            placeName = a.neighbourhood || a.suburb || a.city_district || a.city || a.town || 'Your Area';
            if (a.city && placeName !== a.city) placeName += ', ' + a.city;
          }

          updateUserLocation(lat, lng, placeName);
          setDebugField({ gps: 'ACTIVE' });
          debugLog('GPS', `Resolved: ${placeName}`);
        } catch (err) {
          debugError('GPS', 'Reverse geocode failed:', err);
          updateUserLocation(lat, lng, 'Location Updated');
          setDebugField({ gps: 'ACTIVE' });
        } finally {
          setIsRefreshing(false);
        }
      },
      (err) => {
        debugError('GPS', 'Permission denied or timeout:', err.message);
        setDebugField({ gps: 'FAILED' });
        setIsRefreshing(false);
        if (DEBUG) toast.error(`GPS Failed: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [updateUserLocation]);

  // Auto-request GPS on mount if user has no location
  useEffect(() => {
    if (!currentUser?.location) {
      refreshLocation();
    } else {
      setDebugField({ gps: 'ACTIVE' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignOut = () => {
    setCurrentUser(null);
    router.push('/login');
  };

  return (
    <div className="pt-6 px-6 bg-[var(--nav-bg)] shrink-0 relative z-50 transition-colors duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 dark:text-slate-500 font-medium tracking-wide flex items-center gap-1">
            <MapPin size={12} className="text-primary" />
            YOUR LOCATION
            <button
              onClick={refreshLocation}
              disabled={isRefreshing}
              className="ml-1 p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            >
              <RefreshCw size={12} className={`text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </span>
          <h2 className="text-sm font-semibold text-gray-800 dark:text-slate-200 truncate max-w-[180px]">
            {currentUser?.location?.address || 'Locating...'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2.5 bg-gray-50 dark:bg-slate-800 rounded-full text-gray-600 dark:text-slate-300 soft-shadow tap-effect"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <button
            onClick={handleSignOut}
            className="p-2.5 bg-red-50 rounded-full text-red-500 soft-shadow tap-effect"
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
            className="w-full bg-[var(--input-bg)] border-[var(--border)] border rounded-2xl py-3.5 pl-11 pr-10 text-sm dark:text-slate-200 focus:ring-2 focus:ring-primary/20 transition-all soft-shadow outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => onSearch?.('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* Notifications Dropdown */}
      {showNotifs && (
        <div className="absolute top-[100%] right-6 w-80 bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-2xl z-50 max-h-[60vh] overflow-y-auto no-scrollbar animate-in slide-in-from-top-5 duration-200">
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
            <h3 className="font-black text-[var(--foreground)] text-sm">Notifications</h3>
            <button onClick={() => setShowNotifs(false)} className="text-gray-400 p-1">
              <X size={16} />
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
                  <p className="text-xs font-bold text-[var(--foreground)]">{n.title}</p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">{n.body}</p>
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
