'use client';

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { X, Send, Navigation, CheckCircle2, MessageSquare, Radio, Phone, User, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { listenToAlert, haversineKm, resolveAlertInDB, getEmergencyNumber } from '@/lib/alertService';
import { AlertDoc } from '@/lib/types';
import { debugLog, debugError, DEBUG, setDebugField } from '@/lib/debug';

const MapComponent = dynamic(() => import('@/components/MapComponent'), { ssr: false });

export default function ActiveEmergencyPage() {
  const router = useRouter();
  const { activeAlert, setActiveAlert, resolveAlert, currentUser } = useAppStore();
  const [liveAlert, setLiveAlert] = useState<AlertDoc | null>(null);
  const [messages, setMessages] = useState<{sender: string, text: string}[]>([]);
  const [isHumanChatOpen, setIsHumanChatOpen] = useState(false);
  const [humanMessages, setHumanMessages] = useState<{sender: string, text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [humanChatInput, setHumanChatInput] = useState('');
  const [responderAccepted, setResponderAccepted] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const alert = liveAlert || activeAlert;

  // Subscribe to Firestore real-time updates
  useEffect(() => {
    if (!activeAlert?.id) {
      router.push('/');
      return;
    }
    const unsub = listenToAlert(activeAlert.id, (updated) => {
      if (!updated) return;
      setLiveAlert(updated);
      setActiveAlert(updated);
      // Detect when responder accepts
      if (updated.status === 'accepted' && !responderAccepted) {
        setResponderAccepted(true);
        toast.success(`🚗 ${updated.responderName || 'Responder'} is on the way!`, { duration: 5000 });
      }
      if (updated.status === 'resolved') {
        resolveAlert();
        toast.success('Emergency resolved. Stay safe.');
        router.push('/');
      }
    });
    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAlert?.id]);

  // Setup initial AI messages
  useEffect(() => {
    if (alert) {
      setMessages([
        { sender: 'ai', text: `🚨 ${alert.type} protocol initiated.` },
        { sender: 'ai', text: 'Stay calm. Searching for nearest responder...' },
        { sender: 'ai', text: 'Describe your situation and I\'ll guide you.' }
      ]);
    }
  }, [alert?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!alert) return (
    <div className="h-[100dvh] w-full bg-slate-950 flex items-center justify-center">
      <Loader2 className="text-primary animate-spin" size={32} />
    </div>
  );

  // Responder tracking
  const hasResponder = alert.status !== 'pending' && alert.responderId;
  const respLat = alert.responderLocation?.lat || (alert.userLocation.lat + 0.008);
  const respLng = alert.responderLocation?.lng || (alert.userLocation.lng + 0.008);
  const distKm = haversineKm(alert.userLocation.lat, alert.userLocation.lng, respLat, respLng);
  const etaSec = Math.max(0, Math.floor((distKm / 40) * 3600));
  const canResolve = currentUser && currentUser.role !== 'civilian' && distKm < 0.5;

  // Emergency dial info
  const emergencyDial = getEmergencyNumber(alert.type);

  const handleResolve = async () => {
    try {
      await resolveAlertInDB(alert.id);
      resolveAlert();
      router.push('/');
      toast.success('Emergency resolved.');
    } catch (err) {
      toast.error('Failed to resolve. Try again.');
    }
  };

  const handleSendAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setMessages(prev => [...prev, { sender: 'user', text: msg }]);
    setChatInput('');
    setMessages(prev => [...prev, { sender: 'ai', text: '...' }]);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error('NEXT_PUBLIC_GEMINI_API_KEY not set');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(
        `You are CrisisLink AI, an emergency safety advisor. The user is currently in an active "${alert.type}" emergency (severity: ${alert.severity}). They say: "${msg}". Respond with 1-2 sentences of actionable, specific safety advice. Do NOT repeat generic platitudes. Be specific to their message.`
      );
      const text = result.response.text();
      debugLog('AI-Chat', text);
      setDebugField({ ai: 'ACTIVE' });
      setMessages(prev => [...prev.slice(0, -1), { sender: 'ai', text }]);
    } catch (err: any) {
      debugError('AI-Chat', err);
      setDebugField({ ai: 'FAILED' });
      if (DEBUG) toast.error(`AI Chat Error: ${err.message || 'Unknown'}`);
      // Contextual fallback based on emergency type
      const type = (alert.type || '').toLowerCase();
      let fallback = 'Stay in a safe location. Help is being dispatched to you.';
      if (type.includes('fire')) fallback = 'Stay low below smoke level. Cover your mouth with a wet cloth and move toward the nearest exit.';
      else if (type.includes('medical')) fallback = 'Keep the patient still and comfortable. Do not give food or water. Monitor their breathing.';
      else if (type.includes('violence')) fallback = 'Stay hidden and silent. Do not engage. Call 100 when safe.';
      setMessages(prev => [...prev.slice(0, -1), { sender: 'ai', text: fallback }]);
    }
  };

  const handleSendHuman = (e: React.FormEvent) => {
    e.preventDefault();
    if (!humanChatInput.trim()) return;
    setHumanMessages(prev => [...prev, { sender: 'user', text: humanChatInput }]);
    setHumanChatInput('');
  };

  const formatETA = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-slate-950 overflow-hidden relative">
      {/* Emergency Dial Badge */}
      <a href={`tel:${emergencyDial.number}`} className="fixed top-5 left-5 z-[60] bg-red-600/90 backdrop-blur-lg px-3 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-red-900/30 active:scale-95 transition-transform">
        <Phone size={14} className="text-white" />
        <div>
          <p className="text-white text-[10px] font-bold leading-none">{emergencyDial.label}</p>
          <p className="text-white/80 text-xs font-bold">{emergencyDial.number}</p>
        </div>
      </a>

      {/* MAP */}
      <div className="h-[42%] w-full relative z-0">
        <MapComponent alerts={[alert]} trackingResponderId={alert.responderId} trackingPos={hasResponder ? [respLat, respLng] : undefined} />
        <div className="absolute top-0 w-full h-20 bg-gradient-to-b from-slate-950/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute top-5 right-5 z-10 flex flex-col gap-1.5 pointer-events-none">
          <div className="bg-slate-950/80 backdrop-blur px-3 py-1.5 rounded-xl border border-white/10">
            <span className="text-white font-bold text-[10px] uppercase tracking-wider">{alert.status === 'pending' ? '⏳ Waiting' : '🚗 En Route'}</span>
          </div>
          {hasResponder && (
            <div className="bg-slate-950/80 backdrop-blur px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5">
              <Navigation size={10} className="text-primary" />
              <span className="text-white font-semibold text-[11px]">{formatETA(etaSec)} • {distKm.toFixed(1)} km</span>
            </div>
          )}
        </div>

        {/* Responder card or waiting state */}
        <div className="absolute bottom-3 left-3 right-3 z-10">
          {hasResponder ? (
            <div className="bg-slate-950/85 backdrop-blur-xl rounded-2xl p-3 border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-indigo-600 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {(alert.responderName || 'R').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-xs truncate">{alert.responderName}</p>
                <p className="text-white/50 text-[10px]">{alert.responderRole} • {distKm.toFixed(1)} km away</p>
              </div>
              {alert.responderPhone && (
                <a href={`tel:${alert.responderPhone}`} className="w-9 h-9 bg-green-600/20 text-green-400 rounded-lg flex items-center justify-center">
                  <Phone size={14} />
                </a>
              )}
              <button onClick={() => setIsHumanChatOpen(true)} className="w-9 h-9 bg-blue-600/20 text-blue-400 rounded-lg flex items-center justify-center">
                <MessageSquare size={14} />
              </button>
            </div>
          ) : (
            <div className="bg-slate-950/85 backdrop-blur-xl rounded-2xl p-4 border border-white/10 text-center">
              <Loader2 size={20} className="text-primary animate-spin mx-auto mb-1" />
              <p className="text-white/60 text-xs font-semibold">Searching for nearest responder...</p>
            </div>
          )}
        </div>
      </div>

      {/* AI CHAT */}
      <div className="h-[58%] w-full bg-[#0F1419] border-t border-white/5 flex flex-col relative z-20">
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between shrink-0 bg-black/30">
          <div>
            <h3 className="text-white font-bold text-sm">{alert.type}</h3>
            <p className="text-primary text-[10px] font-semibold">AI Safety Guide</p>
          </div>
          {canResolve && (
            <button onClick={handleResolve} className="bg-green-600 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 active:scale-95">
              <CheckCircle2 size={13} /> Resolve
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`px-3.5 py-2 rounded-2xl max-w-[85%] text-sm ${m.sender === 'user' ? 'bg-primary text-white rounded-br-sm' : 'bg-white/8 text-white/90 rounded-bl-sm'}`}>
                {m.text}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSendAI} className="p-3 bg-black/30 border-t border-white/5 flex gap-2">
          <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ask AI for guidance..." className="flex-1 bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-primary/50" />
          <button type="submit" disabled={!chatInput.trim()} className="w-10 h-10 bg-primary disabled:opacity-40 text-white rounded-xl flex items-center justify-center active:scale-95">
            <Send size={15} />
          </button>
        </form>
      </div>

      {/* Floating chat button */}
      {hasResponder && !isHumanChatOpen && (
        <button onClick={() => setIsHumanChatOpen(true)} className="fixed bottom-4 right-4 w-12 h-12 bg-gradient-to-br from-primary to-indigo-600 text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center z-[60] active:scale-95">
          <MessageSquare size={18} />
        </button>
      )}

      {/* Human Chat Panel */}
      {isHumanChatOpen && (
        <div className="fixed inset-x-0 bottom-0 h-[55vh] bg-[#0F1419] z-[70] flex flex-col border-t border-white/10 animate-in slide-in-from-bottom-full duration-300">
          <div className="p-3 bg-black/40 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary/20 text-primary rounded-full flex items-center justify-center"><Radio size={14} /></div>
              <div>
                <span className="text-white font-bold text-sm">{alert.responderName || 'Responder'}</span>
                {alert.responderPhone && <span className="text-white/40 text-[10px] ml-2">{alert.responderPhone}</span>}
              </div>
            </div>
            <button onClick={() => setIsHumanChatOpen(false)} className="text-white/40 hover:text-white p-1"><X size={18} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
            {humanMessages.length === 0 && <div className="text-center text-white/20 text-sm mt-8">Send a message to your responder</div>}
            {humanMessages.map((m, i) => (
              <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-3.5 py-2 rounded-2xl max-w-[85%] text-sm ${m.sender === 'user' ? 'bg-primary text-white rounded-br-sm' : 'bg-white/8 text-white/90 rounded-bl-sm'}`}>{m.text}</div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSendHuman} className="p-3 bg-black/30 border-t border-white/5 flex gap-2">
            <input value={humanChatInput} onChange={e => setHumanChatInput(e.target.value)} placeholder="Message responder..." className="flex-1 bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none" />
            <button type="submit" disabled={!humanChatInput.trim()} className="w-10 h-10 bg-primary disabled:opacity-40 text-white rounded-xl flex items-center justify-center active:scale-95"><Send size={15} /></button>
          </form>
        </div>
      )}
    </div>
  );
}
