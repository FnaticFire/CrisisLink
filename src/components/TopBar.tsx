'use client';

import React from 'react';
import { Bell, Search } from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface TopBarProps {
  showSearch?: boolean;
}

const TopBar: React.FC<TopBarProps> = ({ showSearch = true }) => {
  const { currentUser } = useAppStore();

  return (
    <div className="pt-6 px-6 bg-white shrink-0">
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 font-medium tracking-wide flex items-center gap-1">
            <MapPin size={12} className="text-primary" />
            YOUR LOCATION
          </span>
          <h2 className="text-sm font-semibold text-gray-800">
            {currentUser?.location?.address || 'Connaught Place, New Delhi'}
          </h2>
        </div>
        <button className="p-2.5 bg-gray-50 rounded-full text-gray-600 soft-shadow tap-effect relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-white"></span>
        </button>
      </div>

      {showSearch && (
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search help or services"
            className="w-full bg-gray-50 border-none rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all soft-shadow"
          />
        </div>
      )}
    </div>
  );
};

// Need MapPin but forgot to import
import { MapPin } from 'lucide-react';

export default TopBar;
