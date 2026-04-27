'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import BottomNav from './BottomNav';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === '/landing';

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
