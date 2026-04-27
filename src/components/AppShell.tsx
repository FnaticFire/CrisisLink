'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import BottomNav from './BottomNav';
import { useAppStore } from '@/lib/store';
import { useEffect } from 'react';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === '/landing';
  const { theme } = useAppStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Landing page renders full-width without app container
  if (isLanding) {
    return <>{children}</>;
  }

  return (
    <div className="app-container overflow-hidden">
      {children}
      <BottomNav />
    </div>
  );
}
