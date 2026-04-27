'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShieldAlert, MapPin, User } from 'lucide-react';
import { useAppStore } from '@/lib/store';

const BottomNav = () => {
  const pathname = usePathname();
  const { currentUser, activeAlert } = useAppStore();

  // Hide bottom nav on these routes
  if (pathname === '/chat' || pathname === '/active' || pathname === '/login' || pathname === '/landing') return null;

  const isCivilian = currentUser?.role === 'civilian';

  const navItems = [
    { label: 'Home', icon: Home, path: '/' },
    // Alerts tab is ONLY visible for civilians
    ...(isCivilian ? [{ label: 'Alerts', icon: ShieldAlert, path: '/alerts', badge: activeAlert ? '!' : undefined }] : []),
    { label: 'Map', icon: MapPin, path: '/map' },
    { label: 'Profile', icon: User, path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] bg-white/90 backdrop-blur-lg border-t border-gray-100 flex justify-around py-3 px-2 z-50 rounded-t-2xl soft-shadow">
      {navItems.map((item) => {
        const isActive = pathname === item.path;
        const Icon = item.icon;

        return (
          <Link
            key={item.path}
            href={item.path}
            className={`relative flex flex-col items-center gap-1 transition-all duration-300 tap-effect ${
              isActive ? 'text-primary scale-110' : 'text-gray-400'
            }`}
          >
            <div className="relative">
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              {'badge' in item && item.badge && (
                <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-primary text-white text-[8px] font-black flex items-center justify-center rounded-full border border-white">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{item.label}</span>
            {isActive && (
              <span className="absolute -bottom-3 w-1 h-1 bg-primary rounded-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav;
