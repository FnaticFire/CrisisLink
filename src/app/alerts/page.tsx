'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { ShieldAlert, CheckCircle2, Clock, MapPin, Loader2, HandHelping, Navigation } from 'lucide-react';
import TopBar from '@/components/TopBar';
import Link from 'next/link';
import { listenToPendingAlerts, acceptAlert, haversineKm } from '@/lib/alertService';
import { AlertDoc } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function AlertsPage() {
  const { activeAlert, currentUser, setActiveAlert } = useAppStore();
  const router = useRouter();
  const [allAlerts, setAllAlerts] = useState<AlertDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  useEffect(() => {
    const unsub = listenToPendingAlerts((alerts) => {
      setAllAlerts(alerts);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const isVolunteer = currentUser?.isVolunteer;

  // My alerts
  const myAlerts = allAlerts.filter(a => a.userId === currentUser?.id);
  // Volunteer requests (for civilian+volunteer users)
  const volunteerAlerts = allAlerts.filter(a => a.type === 'Volunteer Request' && a.userId !== currentUser?.id);
  // Other emergency alerts
  const emergencyAlerts = allAlerts.filter(a => a.type !== 'Volunteer Request' && a.userId !== currentUser?.id);

  const handleAcceptVolunteer = async (alert: AlertDoc) => {
    if (!currentUser || accepting) return;
    setAccepting(alert.id);
    try {
      await acceptAlert(alert.id, currentUser);
      setActiveAlert(alert);
      toast.success('Volunteer request accepted!');
      router.push('/active');
    } catch {
      toast.error('Failed to accept.');
    } finally {
      setAccepting(null);
    }
  };

  return (
    <div className="flex flex-col flex-1 pb-24 overflow-y-auto no-scrollbar">
      <TopBar showSearch={false} />

      <main className="px-5 pt-4">
        <h2 className="text-xl font-bold text-slate-900 mb-5">Alerts</h2>

        {/* My Active Alert */}
        {activeAlert && (
          <Link href="/active">
            <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl p-4 mb-5 card-shadow">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
                  <ShieldAlert size={22} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold text-sm">{activeAlert.type}</p>
                  <p className="text-white/70 text-xs">
                    {activeAlert.status === 'pending' ? '⏳ Waiting for responder...' : `🚗 ${activeAlert.responderName || 'Responder'} en route`}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Volunteer Requests Section (for volunteers) */}
        {isVolunteer && volunteerAlerts.length > 0 && (
          <section className="mb-6">
            <h3 className="text-[11px] font-bold text-violet-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <HandHelping size={13} /> Volunteer Requests
            </h3>
            <div className="flex flex-col gap-2.5">
              {volunteerAlerts.map(a => {
                const dist = currentUser?.location
                  ? haversineKm(currentUser.location.lat, currentUser.location.lng, a.userLocation.lat, a.userLocation.lng).toFixed(1)
                  : '?';
                const isAccepted = a.status !== 'pending';
                return (
                  <div key={a.id} className="bg-white rounded-2xl p-4 card-shadow border-l-4 border-violet-400">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
                        <HandHelping size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">Volunteer Needed</p>
                        <p className="text-[11px] text-slate-400">{a.userName} • {dist} km away</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 mb-3 bg-slate-50 rounded-lg p-2">{a.reason}</p>
                    {!isAccepted ? (
                      <button
                        onClick={() => handleAcceptVolunteer(a)}
                        disabled={accepting === a.id}
                        className="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                      >
                        {accepting === a.id ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
                        {accepting === a.id ? 'Accepting...' : 'Accept & Help'}
                      </button>
                    ) : (
                      <div className="text-center text-xs text-emerald-500 font-semibold py-2">✓ Accepted by {a.responderName}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* My Alerts */}
        <section className="mb-6">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">My Alerts</h3>
          {myAlerts.length === 0 && !activeAlert ? (
            <div className="bg-white rounded-2xl p-6 card-shadow text-center">
              <CheckCircle2 size={24} className="text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-400">No alerts raised</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {myAlerts.map(a => (
                <div key={a.id} className="bg-white rounded-2xl p-4 card-shadow flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${a.type === 'Volunteer Request' ? 'bg-violet-500' : a.status === 'resolved' ? 'bg-emerald-500' : 'bg-orange-500'}`}>
                    {a.type === 'Volunteer Request' ? <HandHelping size={18} /> : a.status === 'resolved' ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{a.type}</p>
                    <p className="text-[11px] text-slate-400">{a.severity} • {formatDistanceToNow(a.createdAt, { addSuffix: true })}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${a.status === 'resolved' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Nearby Emergencies */}
        <section className="mb-6">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <MapPin size={12} /> Nearby Emergencies
          </h3>
          {loading ? (
            <div className="bg-white rounded-2xl p-6 card-shadow text-center">
              <Loader2 size={20} className="text-primary animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400">Loading...</p>
            </div>
          ) : emergencyAlerts.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 card-shadow text-center">
              <CheckCircle2 size={24} className="text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-400">All clear nearby</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {emergencyAlerts.map(a => (
                <div key={a.id} className="bg-white rounded-2xl p-4 card-shadow">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm ${a.severity === 'CRITICAL' ? 'bg-red-500' : a.severity === 'HIGH' ? 'bg-orange-500' : 'bg-yellow-500'}`}>
                      🚨
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{a.type}</p>
                      <p className="text-[11px] text-slate-400">{a.userName} • {a.severity} • {a.status}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
