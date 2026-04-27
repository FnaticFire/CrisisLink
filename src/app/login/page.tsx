'use client';

import React, { useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useAppStore } from '@/lib/store';
import { Role, UserDoc } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getMyActiveAlert, getResponderActiveAlert } from '@/lib/alertService';
import { Sun, Moon } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('civilian');
  const [isVolunteer, setIsVolunteer] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { setCurrentUser, setActiveAlert, theme, toggleTheme } = useAppStore();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, 'users', cred.user.uid));

        if (userDoc.exists()) {
          const userData = userDoc.data() as UserDoc;
          setCurrentUser(userData);
          localStorage.setItem('crisislink_login_at', Date.now().toString());
          
          // Restore any active alert / mission
          const activeAlert = (userData.role === 'civilian') 
            ? await getMyActiveAlert(userData.id)
            : await getResponderActiveAlert(userData.id);

          if (activeAlert) {
            setActiveAlert(activeAlert);
            router.push('/active');
          } else {
            router.push('/');
          }
        } else {
          const recoveredUser: UserDoc = {
            id: cred.user.uid,
            email: cred.user.email || email,
            username: cred.user.displayName || email.split('@')[0],
            role: 'civilian',
            isVolunteer: false,
            isAvailable: true,
          };
          await setDoc(doc(db, 'users', cred.user.uid), recoveredUser);
          setCurrentUser(recoveredUser);
          localStorage.setItem('crisislink_login_at', Date.now().toString());
          router.push('/');
        }
      } else {
        // Validate phone for officers
        if (role !== 'civilian' && !phone.trim()) {
          toast.error('Phone number is required for responder accounts.');
          setLoading(false);
          return;
        }

        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: username });

        const newUser: UserDoc = {
          id: cred.user.uid,
          email,
          username,
          role,
          isVolunteer: role === 'civilian' ? isVolunteer : false,
          isAvailable: true,
          ...(role !== 'civilian' && { phone: phone.trim() }),
        };

        await setDoc(doc(db, 'users', cred.user.uid), newUser);
        setCurrentUser(newUser);
        localStorage.setItem('crisislink_login_at', Date.now().toString());
        router.push('/');
        toast.success(`Welcome to CrisisLink, ${username}!`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const isOfficer = role !== 'civilian';

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)] transition-colors duration-300 relative">
      <button 
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-3 bg-[var(--card)] rounded-full text-[var(--foreground)] soft-shadow transition-all active:scale-95 border border-[var(--border)]"
      >
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>

      <div className="w-full max-w-sm bg-[var(--card)] rounded-3xl p-8 card-shadow border border-[var(--border)]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-indigo-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-primary/20">
            <Shield size={32} />
          </div>
          <h1 className="text-2xl font-black text-[var(--foreground)]">CrisisLink</h1>
          <p className="text-sm font-medium text-[var(--muted)]">Emergency Coordination Network</p>
        </div>

        <form onSubmit={handleAuth} className="flex flex-col gap-3.5">
          {!isLogin && (
            <div>
              <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider pl-1 mb-1 block">Username</label>
              <input
                required type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm font-medium text-[var(--foreground)] outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                placeholder="Your display name"
              />
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider pl-1 mb-1 block">Email</label>
            <input
              required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm font-medium text-[var(--foreground)] outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider pl-1 mb-1 block">Password</label>
            <input
              required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm font-medium text-[var(--foreground)] outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
              placeholder="••••••••"
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider pl-1 mb-1 block">Join As</label>
                <select
                  value={role} onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm font-medium text-[var(--foreground)] outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                >
                  <option value="civilian">Civilian</option>
                  <option value="police">Police Dept</option>
                  <option value="fire">Fire Dept</option>
                  <option value="hospital">Hospital / Ambulance</option>
                  <option value="traffic">Traffic Police</option>
                </select>
              </div>

              {/* Phone for officers */}
              {isOfficer && (
                <div>
                  <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider pl-1 mb-1 block">Phone Number *</label>
                  <input
                    required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm font-medium text-[var(--foreground)] outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                    placeholder="+91 98765 43210"
                  />
                </div>
              )}

              {role === 'civilian' && (
                <div className="flex items-center gap-2 px-1 mt-1">
                  <input
                    type="checkbox" id="volunteer" checked={isVolunteer}
                    onChange={(e) => setIsVolunteer(e.target.checked)}
                    className="w-4 h-4 accent-primary rounded"
                  />
                  <label htmlFor="volunteer" className="text-sm font-medium text-[var(--muted)] select-none">
                    Available to volunteer during emergencies
                  </label>
                </div>
              )}
            </>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 mt-3 text-sm"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs font-semibold text-[var(--muted)] hover:text-primary transition-colors"
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}
