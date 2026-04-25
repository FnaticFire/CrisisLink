'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Shield, X, Send, Navigation, CheckCircle2, MessageSquare, Radio, Phone, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { debugLog, debugError, DEBUG } from '@/lib/debug';

const MapComponent = dynamic(() => import('@/components/MapComponent'), { ssr: false });

export default function ActiveEmergencyPage() {
  const router = useRouter();
  const { activeAlert, resolveAlert, currentUser } = useAppStore();

  const [messages, setMessages] = useState<{sender: string, text: string}[]>([]);
  const [isHumanChatOpen, setIsHumanChatOpen] = useState(false);
  const [humanMessages, setHumanMessages] = useState<{sender: string, text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [humanChatInput, setHumanChatInput] = useState('');
  const [etaTimer, setEtaTimer] = useState(240);

  // Haversine distance
  const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const p = 0.017453292519943295;
    const c = Math.cos;
    const a = 0.5 - c((lat2 - lat1) * p) / 2 + c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p)) / 2;
    return 12742 * Math.asin(Math.sqrt(a));
  };

  useEffect(() => {
    if (!activeAlert) {
      router.push('/');
    } else {
      setMessages([
        { sender: 'ai', text: `🚨 ${activeAlert.type} Protocol Initiated.` },
        { sender: 'ai', text: 'Stay calm. Help is being dispatched.' },
        { sender: 'ai', text: 'What is your current situation? I can guide you.' }
      ]);
    }
  }, [activeAlert, router]);

  useEffect(() => {
    if (etaTimer > 0) {
      const t = setInterval(() => setEtaTimer(e => e - 1), 1000);
      return () => clearInterval(t);
    }
  }, [etaTimer]);

  if (!activeAlert) return <div className="h-[100dvh] w-full bg-black flex items-center justify-center text-white">Loading Security Protocol...</div>;

  // Dynamic tracking
  const progress = etaTimer / 240;
  const respLat = activeAlert.userLocation.lat + (0.012 * progress);
  const respLng = activeAlert.userLocation.lng + (0.012 * progress);
  const distKm = haversine(activeAlert.userLocation.lat, activeAlert.userLocation.lng, respLat, respLng);
  const etaSec = Math.max(0, Math.floor((distKm / 40) * 3600));

  const canResolve = currentUser && (currentUser.role !== 'civilian' || currentUser.isVolunteer);

  const handleResolve = () => {
    resolveAlert();
    router.push('/');
    toast.success('Emergency resolved. Stay safe.');
  };

  const handleSendMessageAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');
    setMessages(prev => [...prev, { sender: 'ai', text: '...' }]);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error('Gemini API key missing');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = `User is in an active ${activeAlert.type} emergency. They say: "${userMsg}". Give very brief, 1 sentence actionable safety advice.`;
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      debugLog('AI-Chat', text);
      setMessages(prev => [...prev.slice(0, -1), { sender: 'ai', text }]);
    } catch (err) {
      debugError('AI-Chat', err);
      if (DEBUG) toast.error('AI chat failed — see console');
      setMessages(prev => [...prev.slice(0, -1), { sender: 'ai', text: 'Stay safe. Help is on the way.' }]);
    }
  };

  const handleSendHuman = (e: React.FormEvent) => {
    e.preventDefault();
    if (!humanChatInput.trim()) return;
    setHumanMessages(prev => [...prev, { sender: 'user', text: humanChatInput }]);
    setHumanChatInput('');
    setTimeout(() => {
      setHumanMessages(prev => [...prev, { sender: 'responder', text: 'Copy that. I\'m en route, hold tight.' }]);
    }, 2000);
  };

  const formatETA = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // Mock responder info (in production this comes from Firestore)
  const responderInfo = {
    name: 'Unit Alpha-7',
    role: activeAlert.type?.includes('Fire') ? 'Fire Dept' : activeAlert.type?.includes('Medical') ? 'Ambulance' : 'Police',
    distance: distKm.toFixed(1) + ' km',
    eta: formatETA(etaSec),
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-black overflow-hidden relative">
      {/* TOP: LIVE MAP */}
      <div className="h-[45%] w-full relative z-0">
        <MapComponent
          alerts={[activeAlert]}
          trackingResponderId="resp-1"
          trackingPos={[respLat, respLng]}
        />
        <div className="absolute top-0 w-full h-24 bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute top-5 left-5 z-10 pointer-events-none flex flex-col gap-2">
          <div className="bg-red-600/90 backdrop-blur px-3 py-1.5 rounded-xl border border-red-500/50 flex items-center gap-2">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white font-black uppercase text-[10px] tracking-widest">ACTIVE CRITICAL</span>
          </div>
          <div className="bg-black/80 backdrop-blur px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
            <Navigation size={12} className="text-primary" />
            <span className="text-white font-bold text-[11px]">ETA {formatETA(etaSec)} • {distKm.toFixed(1)} km</span>
          </div>
        </div>

        {/* Responder Info Card */}
        <div className="absolute bottom-3 left-3 right-3 z-10 bg-black/80 backdrop-blur-lg rounded-2xl p-3 border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary shrink-0">
            <User size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-black text-xs truncate">{responderInfo.name}</p>
            <p className="text-white/50 text-[10px] font-medium">{responderInfo.role} • {responderInfo.distance} away</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button className="w-8 h-8 bg-green-600/20 text-green-400 rounded-lg flex items-center justify-center"><Phone size={14} /></button>
            <button onClick={() => setIsHumanChatOpen(true)} className="w-8 h-8 bg-blue-600/20 text-blue-400 rounded-lg flex items-center justify-center"><MessageSquare size={14} /></button>
          </div>
        </div>
      </div>

      {/* BOTTOM: AI CHAT */}
      <div className="h-[55%] w-full bg-[#111] border-t border-white/10 flex flex-col relative z-20">
        <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between shrink-0 bg-black/40">
          <div className="flex flex-col">
            <h3 className="text-white font-black text-sm uppercase tracking-widest">{activeAlert.type}</h3>
            <p className="text-primary text-[10px] font-bold uppercase tracking-widest">AI Safety Guide</p>
          </div>
          {canResolve && (
            <button onClick={handleResolve} className="bg-green-600 text-white font-black text-xs px-4 py-2 rounded-xl uppercase tracking-wider flex items-center gap-2 active:scale-95">
              <CheckCircle2 size={14} /> Resolve
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm font-medium ${m.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white/10 text-white rounded-bl-none'}`}>
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSendMessageAI} className="p-3 bg-black/40 border-t border-white/5 flex gap-2">
          <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ask AI for situational advice..." className="flex-1 bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-blue-500/50" />
          <button type="submit" disabled={!chatInput.trim()} className="w-11 h-11 flex items-center justify-center bg-blue-600 disabled:opacity-50 text-white rounded-xl active:scale-95 transition-all">
            <Send size={16} />
          </button>
        </form>
      </div>

      {/* FLOATING HUMAN CHAT BUTTON — pinned inside viewport */}
      {!isHumanChatOpen && (
        <button
          onClick={() => setIsHumanChatOpen(true)}
          className="fixed bottom-5 right-5 w-14 h-14 bg-red-600 text-white rounded-full shadow-[0_0_30px_rgba(220,38,38,0.4)] flex items-center justify-center z-[60] hover:scale-110 active:scale-95 transition-transform"
        >
          <MessageSquare size={20} />
        </button>
      )}

      {/* HUMAN CHAT PANEL */}
      {isHumanChatOpen && (
        <div className="fixed inset-x-0 bottom-0 h-[60vh] bg-[#1a1a1a] shadow-[-10px_-10px_40px_rgba(0,0,0,0.5)] z-[70] flex flex-col border-t border-white/10 animate-in slide-in-from-bottom-full duration-300">
          <div className="p-4 bg-black/50 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-600/20 text-red-500 rounded-full flex items-center justify-center"><Radio size={16} /></div>
              <span className="text-white font-bold text-sm tracking-wide">Responder Comms</span>
            </div>
            <button onClick={() => setIsHumanChatOpen(false)} className="text-white/40 hover:text-white p-2"><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {humanMessages.length === 0 && (
              <div className="text-center text-white/20 text-sm mt-8">Waiting for responder to connect...</div>
            )}
            {humanMessages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm font-medium ${m.sender === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-white/10 text-white rounded-bl-none'}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSendHuman} className="p-4 bg-black/40 border-t border-white/5 flex gap-2">
            <input type="text" value={humanChatInput} onChange={e => setHumanChatInput(e.target.value)} placeholder="Message responder..." className="flex-1 bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-red-500/50" />
            <button type="submit" disabled={!humanChatInput.trim()} className="w-11 h-11 flex items-center justify-center bg-primary disabled:opacity-50 text-white rounded-xl active:scale-95 transition-all"><Send size={16} /></button>
          </form>
        </div>
      )}
    </div>
  );
}
