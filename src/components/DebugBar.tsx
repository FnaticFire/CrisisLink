'use client';

import React, { useEffect, useState } from 'react';
import {
  DEBUG,
  getDebugState,
  subscribeDebug,
  DebugState,
  MAX_ALERTS_PER_SESSION,
  MAX_AI_CALLS_PER_SESSION,
} from '@/lib/debug';

const statusColor = {
  ACTIVE: 'bg-green-500',
  FAILED: 'bg-red-500',
  PENDING: 'bg-yellow-500',
};

export default function DebugBar() {
  const [state, setState] = useState<DebugState>(getDebugState());
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    const unsub = subscribeDebug(() => setState(getDebugState()));
    return () => { unsub(); };
  }, []);

  if (!DEBUG) return null;

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed top-2 right-2 z-[9999] w-8 h-8 bg-gray-900/90 backdrop-blur rounded-full flex items-center justify-center text-[10px] font-bold text-green-400 border border-gray-700 shadow-lg"
        title="Expand Debug Panel"
      >
        🐛
      </button>
    );
  }

  return (
    <div className="fixed top-2 right-2 z-[9999] bg-gray-900/95 backdrop-blur-xl text-white rounded-2xl px-4 py-2.5 flex items-center gap-3 text-[10px] font-mono border border-gray-700/50 shadow-2xl select-none">
      <span className="font-black text-[9px] text-gray-500 uppercase tracking-widest mr-1">DEBUG</span>

      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${statusColor[state.gps]}`} />
        <span className="text-gray-300">GPS:{state.gps}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${statusColor[state.ai]}`} />
        <span className="text-gray-300">AI:{state.ai}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${statusColor[state.apis]}`} />
        <span className="text-gray-300">API:{state.apis}</span>
      </div>

      <span className="text-gray-500">|</span>
      <span className="text-gray-400">Alerts:{state.alertsThisSession}/{MAX_ALERTS_PER_SESSION}</span>
      <span className="text-gray-400">AI:{state.aiCallsThisSession}/{MAX_AI_CALLS_PER_SESSION}</span>

      <button
        onClick={() => setMinimized(true)}
        className="ml-1 text-gray-500 hover:text-white transition-colors text-xs"
      >
        ✕
      </button>
    </div>
  );
}
