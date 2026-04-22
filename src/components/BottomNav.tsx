'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShieldAlert, MapPin, User } from 'lucide-react';

const BottomNav = () => {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', icon: Home, path: '/' },
    { label: 'Alerts', icon: ShieldAlert, path: '/alerts' },
    { label: 'Map', icon: MapPin, path: '/map' },
    { label: 'Profile', icon: User, path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] bg-white/80 backdrop-blur-lg border-t border-gray-100 flex justify-around py-3 px-2 z-50 rounded-t-2xl soft-shadow">
      {navItems.map((item) => {
        const isActive = pathname === item.path;
        const Icon = item.icon;
        
        return (
          <Link 
            key={item.path} 
            href={item.path}
            className={`flex flex-col items-center gap-1 transition-all duration-300 tap-effect ${
              isActive ? 'text-primary scale-110' : 'text-gray-400'
            }`}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav;
