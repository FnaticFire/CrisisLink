'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldAlert, Users, MapPin, BookOpen, ChevronRight, X, Phone, Zap, Heart, Flame, Droplets, Shield, CheckCircle2, Navigation, Loader2, HandHelping, Send } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/TopBar';
import EmergencyTrigger from '@/components/EmergencyTrigger';
import { listenToPendingAlerts, acceptAlert, haversineKm, getEmergencyNumber, createAlert } from '@/lib/alertService';
import { AlertDoc } from '@/lib/types';
import { toast } from 'react-hot-toast';
import { debugLog } from '@/lib/debug';

const SAFETY_TIPS = [
  { icon: '🔥', title: 'Fire Emergency', tips: ['Stay low below smoke.', 'Touch door before opening — if hot, find another way.', 'Never use elevators. Use stairs.', 'Meet at assembly point.'] },
  { icon: '🏥', title: 'Medical Emergency', tips: ['Call 108 for ambulance.', 'Do NOT move injured person.', 'Apply firm pressure on bleeding.', 'Start CPR if needed: 30 compressions, 2 breaths.'] },
  { icon: '🚗', title: 'Road Accident', tips: ['Turn on hazard lights.', 'Do not remove helmet from injured motorcyclist.', 'Call 112 (Police) + 108 (Ambulance).', 'Note vehicle registration number.'] },
  { icon: '🌊', title: 'Flood', tips: ['Move to higher ground.', 'Do not walk through moving water.', 'Avoid downed power lines.', 'Call NDRF: 011-24363260.'] },
];

const EMERGENCY_NUMBERS = [
  { label: 'Emergency', number: '112', icon: Phone, gradient: 'from-red-500 to-rose-600' },
  { label: 'Ambulance', number: '108', icon: Heart, gradient: 'from-blue-500 to-blue-600' },
  { label: 'Police', number: '100', icon: Shield, gradient: 'from-indigo-500 to-indigo-600' },
  { label: 'Fire', number: '101', icon: Flame, gradient: 'from-orange-500 to-amber-600' },
  { label: 'Women', number: '1091', icon: Zap, gradient: 'from-pink-500 to-rose-500' },
  { label: 'Flood', number: '1078', icon: Droplets, gradient: 'from-cyan-500 to-teal-600' },
];

export default function Home() {
  const { currentUser, activeAlert, setActiveAlert } = useAppStore();
  const router = useRouter();
  const [showTrigger, setShowTrigger] = useState(false);
  const [showSafetyTips, setShowSafetyTips] = useState(false);
  const [showVolunteerReq, setShowVolunteerReq] = useState(false);
  const [volDescription, setVolDescription] = useState('');
  const [volSending, setVolSending] = useState(false);
  const [selectedTip, setSelectedTip] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingAlerts, setPendingAlerts] = useState<AlertDoc[]>([]);
  const [accepting, setAccepting] = useState<string | null>(null);

  const isCivilian = currentUser?.role === 'civilian';
  const isResponder = !isCivilian;

  useEffect(() => {
    if (!currentUser) { router.replace('/login'); return; }
  }, [currentUser, router]);

  // Responders: listen to pending alerts in real-time
  useEffect(() => {
    if (!isResponder || !currentUser) return;
    const unsub = listenToPendingAlerts((alerts) => {
      debugLog('Responder', `${alerts.length} active alerts`);
      setPendingAlerts(alerts);
    });
    return () => unsub();
  }, [isResponder, currentUser]);

  const handleAcceptAlert = async (alert: AlertDoc) => {
    if (!currentUser || accepting) return;
    setAccepting(alert.id);
    try {
      await acceptAlert(alert.id, currentUser);
      setActiveAlert(alert);
      toast.success('Alert accepted. Navigate to location.');
      router.push('/active');
    } catch (err) {
      toast.error('Failed to accept alert.');
    } finally {
      setAccepting(null);
    }
  };

  const handleVolunteerRequest = async () => {
    if (!volDescription.trim() || !currentUser) return;
    setVolSending(true);
    try {
      const alertDoc: AlertDoc = {
        id: 'vol-' + Date.now(),
        userId: currentUser.id,
        userName: currentUser.username,
        type: 'Volunteer Request',
        severity: 'MEDIUM',
        status: 'pending',
        confidence: 100,
        reason: volDescription.trim(),
        instructions: ['Volunteer needed nearby', 'Check details and respond if available'],
        userLocation: currentUser.location ? { lat: currentUser.location.lat, lng: currentUser.location.lng, address: currentUser.location.address } : { lat: 28.6139, lng: 77.2090 },
        createdAt: Date.now(),
      };
      await createAlert(alertDoc);
      toast.success('Volunteer request posted!');
      setShowVolunteerReq(false);
      setVolDescription('');
    } catch { toast.error('Failed to post request.'); }
    finally { setVolSending(false); }
  };

  const quickActions = isCivilian ? [
    { label: 'Emergency', icon: ShieldAlert, bg: 'bg-red-50', color: 'text-red-500', ring: 'ring-red-100', action: () => setShowTrigger(true) },
    { label: 'Volunteer', icon: HandHelping, bg: 'bg-violet-50', color: 'text-violet-500', ring: 'ring-violet-100', action: () => setShowVolunteerReq(true) },
    { label: 'Map', icon: MapPin, bg: 'bg-blue-50', color: 'text-blue-500', ring: 'ring-blue-100', path: '/map' },
    { label: 'Safety', icon: BookOpen, bg: 'bg-amber-50', color: 'text-amber-500', ring: 'ring-amber-100', action: () => setShowSafetyTips(true) },
  ] : [
    { label: 'Map', icon: MapPin, bg: 'bg-blue-50', color: 'text-blue-500', ring: 'ring-blue-100', path: '/map' },
    { label: 'Safety', icon: BookOpen, bg: 'bg-amber-50', color: 'text-amber-500', ring: 'ring-amber-100', action: () => setShowSafetyTips(true) },
    { label: 'Profile', icon: Shield, bg: 'bg-violet-50', color: 'text-violet-500', ring: 'ring-violet-100', path: '/profile' },
  ];

  return (
    <div className="flex flex-col flex-1 pb-24 overflow-y-auto no-scrollbar">
      <TopBar onSearch={setSearchQuery} searchQuery={searchQuery} />

      <main className="flex-1 px-5 pt-2">
        {/* Active Alert Banner */}
        {activeAlert && (
          <Link href="/active">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-500 via-rose-500 to-orange-500 p-4 mb-5 card-shadow">
              <div className="absolute inset-0 shimmer" />
              <div className="relative flex items-center gap-3">
                <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm"><ShieldAlert size={22} className="text-white" /></div>
                <div className="flex-1">
                  <p className="text-white font-bold text-sm">Active Emergency</p>
                  <p className="text-white/80 text-xs">{activeAlert.type} • Tap to view</p>
                </div>
                <ChevronRight size={20} className="text-white/60" />
              </div>
            </div>
          </Link>
        )}

        {/* Hero Card — only for civilians */}
        {isCivilian && (
          <div onClick={() => setShowTrigger(true)} className="relative overflow-hidden rounded-3xl p-6 mb-6 card-shadow cursor-pointer tap-effect" style={{ background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 50%, #7C3AED 100%)' }}>
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center"><Shield size={16} className="text-white" /></div>
                <span className="text-white/70 text-xs font-semibold uppercase tracking-widest">CrisisLink</span>
              </div>
              <h3 className="text-white text-xl font-bold leading-tight mb-1">Emergency Support<br/>Available 24/7</h3>
              <p className="text-white/60 text-sm mb-4">AI-powered detection. Instant dispatch.</p>
              <button className="bg-white text-primary px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-shadow">Trigger Alert →</button>
            </div>
          </div>
        )}

        {/* Responder Hero */}
        {isResponder && (
          <div className="rounded-3xl p-6 mb-6 card-shadow bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary"><Shield size={20} /></div>
              <div>
                <h3 className="text-white font-bold">Responder Dashboard</h3>
                <p className="text-white/50 text-xs capitalize">{currentUser?.role} Dept • {currentUser?.isAvailable ? 'On Duty' : 'Off Duty'}</p>
              </div>
            </div>
            <p className="text-white/40 text-sm mt-1">Incoming emergency alerts will appear below.</p>
          </div>
        )}

        {/* Quick Actions */}
        <div className={`grid gap-3 mb-6 ${quickActions.length === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            const inner = (
              <div className="flex flex-col items-center gap-2">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${action.bg} ${action.color} ring-1 ${action.ring} card-hover`}><Icon size={22} strokeWidth={1.8} /></div>
                <span className="text-[10px] font-semibold text-slate-500">{action.label}</span>
              </div>
            );
            if ('action' in action && action.action) return <button key={idx} onClick={action.action} className="tap-effect">{inner}</button>;
            return <Link key={idx} href={(action as any).path}>{inner}</Link>;
          })}
        </div>

        {/* ── RESPONDER: Incoming Alerts ── */}
        {isResponder && (
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-800 mb-3">Incoming Alerts ({pendingAlerts.length})</h3>
            {pendingAlerts.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 card-shadow text-center">
                <CheckCircle2 size={28} className="text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-400">No active emergencies</p>
                <p className="text-xs text-slate-300 mt-1">You'll be notified when one appears.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {pendingAlerts.map((a) => {
                  const dial = getEmergencyNumber(a.type);
                  const dist = currentUser?.location
                    ? haversineKm(currentUser.location.lat, currentUser.location.lng, a.userLocation.lat, a.userLocation.lng).toFixed(1)
                    : '?';
                  const isAccepted = a.status !== 'pending';
                  return (
                    <div key={a.id} className="bg-white rounded-2xl p-4 card-shadow border border-slate-50">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg shadow-sm ${a.severity === 'CRITICAL' ? 'bg-red-500' : a.severity === 'HIGH' ? 'bg-orange-500' : 'bg-yellow-500'}`}>
                          🚨
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{a.type}</p>
                          <p className="text-[11px] text-slate-400">{a.userName} • {dist} km away • {a.severity}</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">{a.reason}</p>
                      {!isAccepted ? (
                        <button
                          onClick={() => handleAcceptAlert(a)}
                          disabled={accepting === a.id}
                          className="w-full bg-gradient-to-r from-primary to-indigo-600 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 transition-all"
                        >
                          {accepting === a.id ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
                          {accepting === a.id ? 'Accepting...' : 'Accept & Navigate'}
                        </button>
                      ) : (
                        <div className="text-center text-xs text-emerald-500 font-semibold py-2">✓ Accepted by {a.responderName}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Quick Dial — for civilians */}
        {isCivilian && (
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-800 mb-3">Quick Dial</h3>
            <div className="grid grid-cols-3 gap-2.5">
              {EMERGENCY_NUMBERS.map((em) => {
                const Icon = em.icon;
                return (
                  <a key={em.number} href={`tel:${em.number}`} className="flex flex-col items-center gap-2 p-3.5 bg-white rounded-2xl card-shadow card-hover tap-effect">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${em.gradient} flex items-center justify-center shadow-sm`}><Icon size={18} className="text-white" /></div>
                    <p className="text-[11px] font-bold text-slate-700">{em.number}</p>
                    <p className="text-[9px] font-medium text-slate-400">{em.label}</p>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {showTrigger && <EmergencyTrigger onClose={() => setShowTrigger(false)} />}

      {showSafetyTips && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end p-4">
          <div className="w-full bg-white rounded-3xl p-6 max-h-[80vh] overflow-y-auto no-scrollbar card-shadow">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Safety Tips</h2>
              <button onClick={() => setShowSafetyTips(false)} className="p-2 bg-slate-100 rounded-xl text-slate-400"><X size={18} /></button>
            </div>
            <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
              {SAFETY_TIPS.map((tip, i) => (
                <button key={i} onClick={() => setSelectedTip(i)} className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold ${selectedTip === i ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {tip.icon} {tip.title.split(' ')[0]}
                </button>
              ))}
            </div>
            <div className="bg-slate-50 rounded-2xl p-4">
              <h3 className="font-bold text-slate-800 mb-2">{SAFETY_TIPS[selectedTip].icon} {SAFETY_TIPS[selectedTip].title}</h3>
              {SAFETY_TIPS[selectedTip].tips.map((t, i) => (
                <p key={i} className="text-sm text-slate-600 mb-1.5"><span className="font-bold text-primary">{i+1}.</span> {t}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Volunteer Request Modal */}
      {showVolunteerReq && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end p-4">
          <div className="w-full bg-white rounded-3xl p-6 card-shadow animate-in slide-in-from-bottom-10 duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center">
                  <HandHelping size={20} />
                </div>
                <h2 className="font-bold text-slate-900">Request Volunteer</h2>
              </div>
              <button onClick={() => setShowVolunteerReq(false)} className="p-2 bg-slate-100 rounded-xl text-slate-400"><X size={18} /></button>
            </div>
            <p className="text-xs text-slate-400 mb-3">Describe what help you need. Nearby volunteers will be notified.</p>
            <textarea
              value={volDescription}
              onChange={(e) => setVolDescription(e.target.value)}
              placeholder='e.g. "Need help carrying groceries, elderly person at Gate 4"'
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none h-24 mb-4 transition-all"
            />
            <button
              onClick={handleVolunteerRequest}
              disabled={!volDescription.trim() || volSending}
              className="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all"
            >
              {volSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {volSending ? 'Posting...' : 'Post Request'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
