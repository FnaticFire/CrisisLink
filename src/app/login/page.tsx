'use client';

import React, { useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useAppStore } from '@/lib/store';
import { Role, UserDoc } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<Role>('civilian');
  const [isVolunteer, setIsVolunteer] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { setCurrentUser } = useAppStore();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isLogin) {
        // Login Flow
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
        
        if (userDoc.exists()) {
          setCurrentUser(userDoc.data() as UserDoc);
          router.push('/');
        } else {
          // Self-heal: Create missing profile
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
        // Sign Up Flow
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: username });
        
        const newUser: UserDoc = {
          id: cred.user.uid,
          email,
          username,
          role,
          isVolunteer: role === 'civilian' ? isVolunteer : false,
          isAvailable: true,
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 soft-shadow border border-gray-100">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white mb-4">
            <Shield size={32} />
          </div>
          <h1 className="text-2xl font-black text-gray-900">CrisisLink</h1>
          <p className="text-sm font-bold text-gray-400">Emergency Coordination Net</p>
        </div>

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          {!isLogin && (
            <div>
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1 mb-1 block">Username</label>
              <input 
                required
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="Ex. JohnRescue99" 
              />
            </div>
          )}

          <div>
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1 mb-1 block">Email</label>
            <input 
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="name@example.com" 
            />
          </div>

          <div>
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1 mb-1 block">Password</label>
            <input 
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="••••••••" 
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1 mb-1 block">Join As</label>
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  <option value="civilian">Civilian</option>
                  <option value="police">Police Dept</option>
                  <option value="fire">Fire Dept</option>
                  <option value="hospital">Hospital / Ambulance</option>
                </select>
              </div>

              {role === 'civilian' && (
                <div className="flex items-center gap-2 px-1 mt-2">
                  <input 
                    type="checkbox" 
                    id="volunteer" 
                    checked={isVolunteer}
                    onChange={(e) => setIsVolunteer(e.target.checked)}
                    className="w-4 h-4 text-primary bg-gray-50 border-gray-300 rounded focus:ring-primary focus:ring-2 accent-primary" 
                  />
                  <label htmlFor="volunteer" className="text-sm font-bold text-gray-700 select-none">
                    I am willing to volunteer during emergencies
                  </label>
                </div>
              )}
            </>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-white font-black py-4 rounded-xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 mt-4 uppercase tracking-wider text-sm"
          >
            {loading ? 'Processing...' : (isLogin ? 'Secure Login' : 'Create Account')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs font-bold text-gray-400 hover:text-primary transition-colors uppercase tracking-widest"
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
}
