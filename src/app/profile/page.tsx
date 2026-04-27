'use client';

import React, { useState } from 'react';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import {
  History,
  MapPin,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Edit3,
  Bell,
  Lock,
  X,
  Check,
  Plus,
  Trash2,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const ProfilePage = () => {
  const {
    currentUser,
    updateCurrentUser,
    alertHistory,
    savedLocations,
    addSavedLocation,
    removeSavedLocation,
    notifications,
  } = useAppStore();
  const router = useRouter();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showLocationsModal, setShowLocationsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [resolvedAlerts, setResolvedAlerts] = useState<any[]>([]);

  // Fetch history from DB
  React.useEffect(() => {
    if (currentUser?.id) {
       import('@/lib/alertService').then(m => m.getResolvedAlerts(currentUser.id)).then(setResolvedAlerts);
    }
  }, [currentUser?.id]);

  // Edit form state
  const [editName, setEditName] = useState(currentUser?.username || '');
  const [editPhone, setEditPhone] = useState('+91 98765 43210');
  const [newLocName, setNewLocName] = useState('');
  const [newLocAddr, setNewLocAddr] = useState('');

  // Privacy toggles
  const [privacySettings, setPrivacySettings] = useState({
    shareLocation: true,
    shareAlerts: true,
    analyticsEnabled: false,
    twoFactor: false,
  });

  // Notification settings
  const [notifSettings, setNotifSettings] = useState({
    emergencyAlerts: true,
    responderUpdates: true,
    safetyTips: false,
    systemUpdates: true,
  });

  const handleSaveProfile = () => {
    updateCurrentUser({ username: editName });
    toast.success('Profile updated!');
    setShowEditModal(false);
  };

  const handleAddLocation = () => {
    if (!newLocName.trim() || !newLocAddr.trim()) return;
    addSavedLocation({ name: newLocName, address: newLocAddr, lat: 28.6139, lng: 77.2090 });
    setNewLocName('');
    setNewLocAddr('');
    toast.success('Location saved!');
  };

  const menuItems = [
    {
      title: 'Emergency History',
      icon: History,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
      badge: alertHistory.length.toString(),
      action: () => setShowHistoryModal(true),
    },
    {
      title: 'Saved Locations',
      icon: MapPin,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
      badge: savedLocations.length.toString(),
      action: () => setShowLocationsModal(true),
    },
    {
      title: 'Privacy Settings',
      icon: Lock,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
      action: () => setShowPrivacyModal(true),
    },
    {
      title: 'Notification Prefs',
      icon: Bell,
      color: 'text-purple-500',
      bg: 'bg-purple-50',
      badge: notifications.filter((n) => !n.read).length > 0 ? notifications.filter((n) => !n.read).length.toString() : undefined,
      action: () => setShowNotifModal(true),
    },
  ];

  return (
    <div className="flex flex-col flex-1 pb-24 overflow-y-auto no-scrollbar">
      {/* Profile Header */}
      <div className="bg-[var(--card)] px-6 pt-16 pb-8 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/5 to-transparent" />

        <div className="relative inline-block mb-4">
          <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-[var(--card)] soft-shadow mx-auto relative bg-gradient-to-br from-primary to-red-400 flex items-center justify-center">
            <span className="text-white text-3xl font-black">
              {(currentUser?.username || 'U').slice(0, 2).toUpperCase()}
            </span>
          </div>
          <button
            onClick={() => { setEditName(currentUser?.username || ''); setShowEditModal(true); }}
            className="absolute -bottom-1 -right-1 bg-primary text-white p-2 rounded-xl shadow-lg border-2 border-[var(--card)] tap-effect"
          >
            <Edit3 size={14} />
          </button>
        </div>

        <h2 className="text-xl font-black text-[var(--foreground)]">{currentUser?.username}</h2>
        <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mt-1">{currentUser?.role === 'civilian' ? (currentUser?.isVolunteer ? 'Civilian • Volunteer' : 'Civilian') : currentUser?.role?.toUpperCase()}</p>
        <p className="text-xs text-[var(--muted)] mt-1">📍 {currentUser?.location?.address || 'Locating...'}</p>
      </div>

      {/* Stats */}
      <div className="px-6 grid grid-cols-3 gap-3 mb-8 mt-4">
        <div className="bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--border)] text-center">
          <div className="text-xl font-black text-[var(--foreground)]">{alertHistory.length}</div>
          <span className="text-[9px] font-black text-[var(--muted)] uppercase">Alerts Sent</span>
        </div>
        <div className="bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--border)] text-center">
          <div className="text-xl font-black text-[var(--foreground)]">{savedLocations.length}</div>
          <span className="text-[9px] font-black text-[var(--muted)] uppercase">Saved Places</span>
        </div>
        <div className="bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--border)] text-center">
          <div className="text-xl font-black text-green-500">Safe</div>
          <span className="text-[9px] font-black text-[var(--muted)] uppercase">Status</span>
        </div>
      </div>

      {/* Menu List */}
      <div className="px-6 flex flex-col gap-3">
        {menuItems.map((item, idx) => (
          <button
            key={idx}
            onClick={item.action}
            className="group flex items-center justify-between p-4 bg-[var(--card)] rounded-2xl border border-[var(--border)] soft-shadow hover:border-primary/20 transition-all cursor-pointer tap-effect w-full text-left"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${item.bg} ${item.color} dark:bg-opacity-10`}>
                <item.icon size={20} />
              </div>
              <span className="text-sm font-bold text-[var(--foreground)]">{item.title}</span>
            </div>
            <div className="flex items-center gap-2">
              {item.badge && (
                <span className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
              <ChevronRight size={18} className="text-[var(--muted)] opacity-30 group-hover:text-primary transition-colors" />
            </div>
          </button>
        ))}
      </div>

      {/* Sign Out */}
      <div className="mt-8 px-6">
        <button
          onClick={async () => { 
            try { 
              localStorage.removeItem('crisislink_login_at');
              await signOut(auth); 
            } catch {} 
            const store = useAppStore.getState();
            store.setCurrentUser(null); 
            store.setActiveAlert(null);
            router.push('/login'); 
          }}
          className="w-full flex items-center justify-center gap-3 py-4 bg-red-50 text-primary border border-red-100 rounded-2xl font-bold transition-all hover:bg-primary hover:text-white tap-effect"
        >
          Sign Out
        </button>
      </div>

      <div className="mt-4 px-6 text-center mb-8">
        <p className="text-[10px] text-[var(--muted)] opacity-50 font-bold uppercase tracking-[0.3em]">CrisisLink v1.0.5</p>
      </div>

      {/* ── Edit Profile Modal ── */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end p-4">
          <div className="w-full bg-[var(--card)] border-t border-[var(--border)] rounded-t-3xl p-6 animate-in slide-in-from-bottom-10 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-[var(--foreground)]">Edit Profile</h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 bg-[var(--input-bg)] rounded-full">
                <X size={18} className="text-[var(--muted)]" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-[var(--muted)] uppercase mb-1.5 block">Full Name</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border)] text-[var(--foreground)] rounded-2xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--muted)] uppercase mb-1.5 block">Phone Number</label>
                <input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border)] text-[var(--foreground)] rounded-2xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
            </div>
            <button onClick={handleSaveProfile} className="w-full mt-4 bg-primary text-white py-4 rounded-2xl font-black tap-effect">
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* ── Emergency History Modal ── */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end p-4">
          <div className="w-full bg-[var(--card)] border-t border-[var(--border)] rounded-t-3xl p-6 max-h-[75vh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-10 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-[var(--foreground)]">Emergency History</h3>
              <button onClick={() => setShowHistoryModal(false)} className="p-2 bg-[var(--input-bg)] rounded-full">
                <X size={18} className="text-[var(--muted)]" />
              </button>
            </div>
            {resolvedAlerts.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">No past emergencies</div>
            ) : (
              <div className="flex flex-col gap-3">
                {resolvedAlerts.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${a.severity === 'CRITICAL' ? 'bg-red-100 text-red-500' : 'bg-orange-100 text-orange-500'}`}>
                      🚨
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{a.type}</p>
                      <p className="text-xs text-gray-400">{format(new Date(a.resolvedAt || a.createdAt), 'PPp')} • <span className="text-emerald-500 font-bold">Resolved</span></p>
                      {a.userLocation?.address && <p className="text-[10px] text-gray-400 mt-0.5">📍 {a.userLocation.address}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Saved Locations Modal ── */}
      {showLocationsModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end p-4">
          <div className="w-full bg-[var(--card)] border-t border-[var(--border)] rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-10 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-[var(--foreground)]">Saved Locations</h3>
              <button onClick={() => setShowLocationsModal(false)} className="p-2 bg-[var(--input-bg)] rounded-full">
                <X size={18} className="text-[var(--muted)]" />
              </button>
            </div>
            <div className="flex flex-col gap-3 mb-4">
              {savedLocations.map((loc) => (
                <div key={loc.id} className="flex items-center justify-between p-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--foreground)]">{loc.name}</p>
                      <p className="text-xs text-[var(--muted)] opacity-80">{loc.address}</p>
                    </div>
                  </div>
                  <button onClick={() => removeSavedLocation(loc.id)} className="p-2 text-[var(--muted)] opacity-40 hover:text-red-400 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            {/* Add new location */}
            <div className="bg-[var(--input-bg)] border border-[var(--border)] rounded-2xl p-4 flex flex-col gap-2">
              <p className="text-xs font-black text-[var(--muted)] opacity-60 uppercase mb-1">Add Location</p>
              <input value={newLocName} onChange={(e) => setNewLocName(e.target.value)} placeholder="Name (e.g. Home)" className="bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] rounded-xl py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
              <input value={newLocAddr} onChange={(e) => setNewLocAddr(e.target.value)} placeholder="Address" className="bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] rounded-xl py-2.5 px-3 text-sm outline-none border border-gray-200 focus:ring-2 focus:ring-primary/20" />
              <button onClick={handleAddLocation} className="bg-primary text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 tap-effect">
                <Plus size={16} /> Save Location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Privacy Modal ── */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end p-4">
          <div className="w-full bg-[var(--card)] border-t border-[var(--border)] rounded-t-3xl p-6 animate-in slide-in-from-bottom-10 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-[var(--foreground)]">Privacy Settings</h3>
              <button onClick={() => setShowPrivacyModal(false)} className="p-2 bg-[var(--input-bg)] rounded-full">
                <X size={18} className="text-[var(--muted)]" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {(Object.entries(privacySettings) as [keyof typeof privacySettings, boolean][]).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[var(--foreground)] opacity-80 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <button
                    onClick={() => setPrivacySettings((s) => ({ ...s, [key]: !val }))}
                    className={`w-12 h-6 rounded-full transition-colors ${val ? 'bg-primary' : 'bg-[var(--border)]'} relative`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${val ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => { setShowPrivacyModal(false); toast.success('Privacy settings saved!'); }} className="w-full mt-6 bg-primary text-white py-4 rounded-2xl font-black tap-effect">
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* ── Notification Modal ── */}
      {showNotifModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end p-4">
          <div className="w-full bg-[var(--card)] border-t border-[var(--border)] rounded-t-3xl p-6 animate-in slide-in-from-bottom-10 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-[var(--foreground)]">Notification Prefs</h3>
              <button onClick={() => setShowNotifModal(false)} className="p-2 bg-[var(--input-bg)] rounded-full">
                <X size={18} className="text-[var(--muted)]" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {(Object.entries(notifSettings) as [keyof typeof notifSettings, boolean][]).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[var(--foreground)] opacity-80 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <button
                    onClick={() => setNotifSettings((s) => ({ ...s, [key]: !val }))}
                    className={`w-12 h-6 rounded-full transition-colors ${val ? 'bg-primary' : 'bg-[var(--border)]'} relative`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${val ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => { setShowNotifModal(false); toast.success('Notification preferences saved!'); }} className="w-full mt-6 bg-primary text-white py-4 rounded-2xl font-black tap-effect">
              Save Preferences
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
