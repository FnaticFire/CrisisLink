'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useAppStore } from '@/lib/store';
import { toast } from 'react-hot-toast';

// 2 hours session limit
const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; 

export default function SessionGuard() {
  const router = useRouter();
  const { currentUser, setCurrentUser } = useAppStore();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is authenticated via Firebase
        const now = Date.now();
        const storedLoginAt = localStorage.getItem('crisislink_login_at');
        
        if (!storedLoginAt) {
          // New session started or timestamp missing
          localStorage.setItem('crisislink_login_at', now.toString());
        } else {
          // Check for expiry
          const loginAt = parseInt(storedLoginAt, 10);
          if (now - loginAt > SESSION_DURATION_MS) {
            handleAutoLogout();
          }
        }
      } else {
        // User logged out
        localStorage.removeItem('crisislink_login_at');
        if (currentUser) setCurrentUser(null);
      }
    });

    const handleAutoLogout = async () => {
      localStorage.removeItem('crisislink_login_at');
      await signOut(auth);
      setCurrentUser(null);
      toast('Session expired. Please log in again.', { icon: '⏳' });
      router.push('/login');
    };

    // Periodic check every minute
    const interval = setInterval(() => {
      const storedLoginAt = localStorage.getItem('crisislink_login_at');
      if (storedLoginAt) {
        const now = Date.now();
        const loginAt = parseInt(storedLoginAt, 10);
        if (now - loginAt > SESSION_DURATION_MS) {
          handleAutoLogout();
        }
      }
    }, 60000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [router, setCurrentUser, currentUser]);

  return null;
}
