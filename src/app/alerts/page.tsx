'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { ShieldAlert, CheckCircle2, AlertTriangle, ChevronRight, Clock, MapPin, X } from 'lucide-react';
import TopBar from '@/components/TopBar';
import { format, formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const AlertsPage = () => {
  const { currentUser, activeAlert, alertHistory, setActiveAlert, responders, resolveAlert } = useAppStore();
  const router = useRouter();
  const [selectedRecord, setSelectedRecord] = useState<null | typeof alertHistory[0]>(null);

  return (
    <div className="flex flex-col flex-1 pb-24 overflow-y-auto no-scrollbar">
      <TopBar showSearch={false} />

      <main className="px-6 pt-4">
        <h2 className="text-2xl font-black text-gray-900 mb-6">Alert Notifications</h2>

        {/* Active Operations */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Active Operations</h3>
            <span className="text-[10px] font-bold text-green-500 bg-green-50 px-2 py-1 rounded-full border border-green-100 flex items-center gap-1">
              <MapPin size={10} /> 30 km radius
            </span>
          </div>
          {activeAlert ? (
            <div className="bg-red-50 border border-primary/20 rounded-2xl p-4 soft-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white animate-pulse shrink-0">
                  <ShieldAlert size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900">{activeAlert.type}</h4>
                  <p className="text-xs text-primary font-bold">Help is en route • ~4 min ETA</p>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <MapPin size={10} /> {activeAlert.location.address}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/map"
                  className="flex-1 bg-primary text-white py-2.5 rounded-xl text-xs font-black text-center tap-effect"
                >
                  Track on Map
                </Link>
                <Link
                  href="/chat"
                  className="flex-1 bg-white border border-gray-200 text-gray-700 py-2.5 rounded-xl text-xs font-black text-center tap-effect"
                >
                  Open Chat
                </Link>
                {currentUser && (currentUser.role !== 'civilian' || currentUser.isVolunteer) && (
                  <button
                    onClick={() => {
                      resolveAlert();
                    }}
                    className="px-3 bg-green-50 text-green-600 border border-green-200 rounded-xl text-xs font-black tap-effect"
                    title="Mark Resolved"
                  >
                    ✓ Done
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 text-center">
              <div className="text-gray-300 mb-2 font-bold flex justify-center">
                <CheckCircle2 size={32} />
              </div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No Active Alerts</p>
              <p className="text-xs text-gray-300 mt-1">You are currently safe.</p>
              <Link
                href="/"
                className="mt-4 inline-block bg-primary text-white px-6 py-2 rounded-xl text-sm font-bold tap-effect"
              >
                Trigger Emergency
              </Link>
            </div>
          )}
        </section>

        {/* Nearby Responders Quick List */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Available Responders</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {responders.map((r) => (
              <button
                key={r.id}
                onClick={() => router.push(`/responder/${r.id}`)}
                className="shrink-0 flex flex-col items-center gap-1.5 p-3 bg-white rounded-2xl border border-gray-100 soft-shadow w-20 tap-effect"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <div className="relative w-12 h-12 rounded-xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.avatar} alt={r.name} className="w-full h-full object-cover" />
                  <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${r.status === 'online' ? 'bg-green-500' : 'bg-orange-400'}`} />
                </div>
                <span className="text-[9px] font-bold text-gray-700 text-center leading-tight">{r.name.split(' ')[0]}</span>
                <span className={`text-[8px] font-black uppercase ${r.status === 'online' ? 'text-green-500' : 'text-orange-400'}`}>{r.status}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Past Alert History */}
        <section>
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Past Records ({alertHistory.length})</h3>
          {alertHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Clock size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No past alerts yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {alertHistory.map((record) => (
                <button
                  key={record.id}
                  onClick={() => setSelectedRecord(record)}
                  className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-50 soft-shadow tap-effect w-full text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${record.severity === 'high' ? 'bg-red-50 text-primary' : 'bg-orange-50 text-orange-500'}`}>
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-800">{record.type}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                          <Clock size={10} /> {format(record.date, 'MMM dd, h:mm a')}
                        </span>
                        <span className="text-[10px] font-black text-emerald-500 uppercase">✓ Resolved</span>
                      </div>
                      {record.location && (
                        <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                          <MapPin size={9} /> {record.location}
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Record Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end p-4">
          <div className="w-full bg-white rounded-3xl p-6 animate-in slide-in-from-bottom-10 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-gray-900">Incident Report</h3>
              <button onClick={() => setSelectedRecord(null)} className="p-2 bg-gray-100 rounded-full">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex justify-between">
                <span className="text-xs text-gray-400 font-bold uppercase">Type</span>
                <span className="text-xs font-black text-gray-900">{selectedRecord.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400 font-bold uppercase">Status</span>
                <span className="text-xs font-black text-emerald-500 uppercase">✓ Resolved</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400 font-bold uppercase">Date</span>
                <span className="text-xs font-black text-gray-900">{format(selectedRecord.date, 'PPpp')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400 font-bold uppercase">Severity</span>
                <span className={`text-xs font-black uppercase ${selectedRecord.severity === 'high' ? 'text-red-500' : 'text-orange-500'}`}>{selectedRecord.severity}</span>
              </div>
              {selectedRecord.location && (
                <div className="flex justify-between">
                  <span className="text-xs text-gray-400 font-bold uppercase">Location</span>
                  <span className="text-xs font-black text-gray-900 text-right max-w-[60%]">{selectedRecord.location}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-xs text-gray-400 font-bold uppercase">Time ago</span>
                <span className="text-xs font-black text-gray-900">{formatDistanceToNow(selectedRecord.date, { addSuffix: true })}</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedRecord(null)}
              className="w-full mt-4 bg-primary text-white py-3.5 rounded-2xl font-black tap-effect"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsPage;
