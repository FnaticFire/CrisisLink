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
import { getMyActiveAlert } from '@/lib/alertService';

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
  const { setCurrentUser, setActiveAlert } = useAppStore();

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
          // Restore any active alert
          const activeAlert = await getMyActiveAlert(userData.id);
          if (activeAlert) {
            setActiveAlert(activeAlert);
          }
          router.push('/');
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
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(135deg, #EEF2FF 0%, #F0F4F8 50%, #E0F2FE 100%)' }}>
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 card-shadow">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-indigo-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-primary/20">
            <Shield size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-900">CrisisLink</h1>
          <p className="text-sm font-medium text-slate-400">Emergency Coordination Network</p>
        </div>

        <form onSubmit={handleAuth} className="flex flex-col gap-3.5">
          {!isLogin && (
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1 mb-1 block">Username</label>
              <input
                required type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                placeholder="Your display name"
              />
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1 mb-1 block">Email</label>
            <input
              required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1 mb-1 block">Password</label>
            <input
              required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
              placeholder="••••••••"
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1 mb-1 block">Join As</label>
                <select
                  value={role} onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                >
                  <option value="civilian">Civilian</option>
                  <option value="police">Police Dept</option>
                  <option value="fire">Fire Dept</option>
                  <option value="hospital">Hospital / Ambulance</option>
                </select>
              </div>

              {/* Phone for officers */}
              {isOfficer && (
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1 mb-1 block">Phone Number *</label>
                  <input
                    required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
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
                  <label htmlFor="volunteer" className="text-sm font-medium text-slate-600 select-none">
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
            className="text-xs font-semibold text-slate-400 hover:text-primary transition-colors"
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}
