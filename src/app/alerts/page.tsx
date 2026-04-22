'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import { ShieldAlert, CheckCircle2, AlertTriangle, ChevronRight, Clock } from 'lucide-react';
import TopBar from '@/components/TopBar';
import { format } from 'date-fns';

const AlertsPage = () => {
  const { activeAlert } = useAppStore();

  const history = [
    { id: 'h1', type: 'Medical Emergency', status: 'resolved', date: new Date(Date.now() - 86400000 * 2), severity: 'high' },
    { id: 'h2', type: 'Personal Safety', status: 'resolved', date: new Date(Date.now() - 86400000 * 5), severity: 'medium' },
    { id: 'h3', type: 'Road Accident', status: 'resolved', date: new Date(Date.now() - 86400000 * 12), severity: 'high' },
  ];

  return (
    <div className="flex flex-col flex-1 pb-24 overflow-y-auto no-scrollbar">
      <TopBar showSearch={false} />
      
      <main className="px-6 pt-4">
        <h2 className="text-2xl font-black text-gray-900 mb-6">Alert Notifications</h2>

        {/* Active Section */}
        <section className="mb-8">
           <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Active Operations</h3>
           {activeAlert ? (
             <div className="bg-red-50 border border-primary/20 rounded-2xl p-4 flex items-center gap-4 animate-pulse">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white">
                   <ShieldAlert size={24} />
                </div>
                <div className="flex-1">
                   <h4 className="font-bold text-gray-900">{activeAlert.type}</h4>
                   <p className="text-xs text-primary font-bold">Help is en route • 4 min ETA</p>
                </div>
             </div>
           ) : (
             <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 text-center">
                <div className="text-gray-300 mb-2 font-bold flex justify-center">
                   <CheckCircle2 size={32} />
                </div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No Active Alerts</p>
             </div>
           )}
        </section>

        {/* History Section */}
        <section>
           <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Past Records</h3>
           <div className="flex flex-col gap-3">
              {history.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-50 soft-shadow tap-effect">
                   <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        record.severity === 'high' ? 'bg-red-50 text-primary' : 'bg-orange-50 text-orange-500'
                      }`}>
                         <AlertTriangle size={20} />
                      </div>
                      <div>
                         <h4 className="text-sm font-bold text-gray-800">{record.type}</h4>
                         <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                               <Clock size={10} /> {format(record.date, 'MMM dd, h:mm a')}
                            </span>
                            <span className="text-[10px] font-black text-emerald-500 uppercase">Resolved</span>
                         </div>
                      </div>
                   </div>
                   <ChevronRight size={16} className="text-gray-300" />
                </div>
              ))}
           </div>
        </section>
      </main>
    </div>
  );
};

export default AlertsPage;
