'use client';

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Shield, X, Send, Navigation, CheckCircle2, MessageSquare, Radio } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { GoogleGenerativeAI } from '@google/generative-ai';

const MapComponent = dynamic(() => import('@/components/MapComponent'), { ssr: false });

export default function ActiveEmergencyPage() {
  const router = useRouter();
  const { activeAlert, resolveAlert, currentUser } = useAppStore();
  
  const [messages, setMessages] = useState<{sender: string, text: string}[]>([]);
  const [isHumanChatOpen, setIsHumanChatOpen] = useState(false);
  const [humanMessages, setHumanMessages] = useState<{sender: string, text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [humanChatInput, setHumanChatInput] = useState('');
  const [eta, setEta] = useState(240);

  useEffect(() => {
    if (!activeAlert) {
      router.push('/');
    } else {
      // Setup initial AI tips
      setMessages([
        { sender: 'ai', text: `🚨 ${activeAlert.type} Protocol Initiated.` },
        { sender: 'ai', text: 'Stay calm. Help is being dispatched.' },
        { sender: 'ai', text: 'What is your current situation? I can guide you.' }
      ]);
    }
  }, [activeAlert, router]);

  useEffect(() => {
    if (eta > 0) {
      const t = setInterval(() => setEta(e => e - 1), 1000);
      return () => clearInterval(t);
    }
  }, [eta]);

  if (!activeAlert) return <div className="h-screen w-full bg-black flex items-center justify-center text-white">Loading Security Protocol...</div>;

  const handleResolve = () => {
    resolveAlert();
    router.push('/');
    toast.success('Emergency mode disengaged.');
  };

  const handleSendMessageAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');
    setMessages(prev => [...prev, { sender: 'ai', text: 'Analyzing situation...' }]);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error('API Key missed');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `User is in an active emergency: ${activeAlert.type}. They say: "${userMsg}". Give a very brief, 1 sentence actionable advice.`;
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      setMessages(prev => [...prev.slice(0, -1), { sender: 'ai', text }]);
    } catch {
      setMessages(prev => [...prev.slice(0, -1), { sender: 'ai', text: 'Please stay safe and wait for the responder.' }]);
    }
  };

  const handleSendHuman = (e: React.FormEvent) => {
    e.preventDefault();
    if(!humanChatInput.trim()) return;
    setHumanMessages(prev => [...prev, { sender: 'user', text: humanChatInput }]);
    setHumanChatInput('');
    setTimeout(() => {
      setHumanMessages(prev => [...prev, { sender: 'responder', text: 'Copy that. Im 2 minutes away.' }]);
    }, 2000);
  };

  const formatETA = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="h-screen w-full flex flex-col bg-black overflow-hidden relative">
      {/* TOP HALF: LIVE MAP */}
      <div className="h-1/2 w-full relative z-0">
        <MapComponent 
          alerts={[activeAlert]} 
          trackingResponderId="mock-resp"
          trackingPos={[activeAlert.userLocation.lat + (0.01 * (eta / 240)), activeAlert.userLocation.lng + (0.01 * (eta / 240))]}
        />
        <div className="absolute top-0 w-full h-24 bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute top-6 left-6 z-10 pointer-events-none flex flex-col gap-2">
          <div className="bg-red-600/90 backdrop-blur px-4 py-2 rounded-xl border border-red-500/50 shadow-2xl flex items-center gap-2">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white font-black uppercase text-xs tracking-widest">ACTIVE CRITICAL</span>
          </div>
          <div className="bg-black/80 backdrop-blur px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2">
            <Navigation size={14} className="text-primary" />
            <span className="text-white font-bold text-xs">Unit arriving in {formatETA(eta)}</span>
          </div>
        </div>
      </div>

      {/* BOTTOM HALF: AI CHAT */}
      <div className="h-1/2 w-full bg-[#111] border-t border-white/10 flex flex-col relative z-20">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between shrink-0 bg-black/40">
          <div className="flex flex-col">
            <h3 className="text-white font-black text-sm uppercase tracking-widest">{activeAlert.type}</h3>
            <p className="text-primary text-[10px] font-bold uppercase tracking-widest">AI Safety Guide</p>
          </div>
          <button onClick={handleResolve} className="bg-green-600 text-white font-black text-xs px-4 py-2 rounded-xl uppercase tracking-wider flex items-center gap-2 active:scale-95">
            <CheckCircle2 size={16} /> Resolve
          </button>
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

        <form onSubmit={handleSendMessageAI} className="p-4 bg-black/40 border-t border-white/5 flex gap-2">
          <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ask AI for situational advice..." className="flex-1 bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-blue-500/50" />
          <button type="submit" disabled={!chatInput.trim()} className="w-12 h-12 flex items-center justify-center bg-blue-600 border-none disabled:opacity-50 text-white rounded-xl active:scale-95 transition-all">
            <Send size={18} />
          </button>
        </form>
      </div>

      {/* FLOATING HUMAN CHAT COMPONENT */}
      <button 
        onClick={() => setIsHumanChatOpen(true)}
        className={`fixed bottom-24 right-8 w-14 h-14 bg-red-600 text-white rounded-full shadow-[0_0_30px_rgba(220,38,38,0.4)] flex items-center justify-center z-40 transition-transform ${isHumanChatOpen ? 'scale-0' : 'scale-100 hover:scale-110 active:scale-95'}`}
      >
        <MessageSquare size={20} />
      </button>

      {isHumanChatOpen && (
        <div className="fixed bottom-0 right-0 w-full h-[60vh] bg-[#1a1a1a] shadow-[-10px_-10px_40px_rgba(0,0,0,0.5)] z-50 flex flex-col border-t border-white/10 animate-in slide-in-from-bottom-full duration-300">
          <div className="p-4 bg-black/50 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-600/20 text-red-500 rounded-full flex items-center justify-center"><Radio size={16} /></div>
              <span className="text-white font-bold text-sm tracking-wide">Unit Comms</span>
            </div>
            <button onClick={() => setIsHumanChatOpen(false)} className="text-white/40 hover:text-white p-2"><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
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
            <button type="submit" disabled={!humanChatInput.trim()} className="w-12 h-12 flex items-center justify-center bg-primary disabled:opacity-50 text-white rounded-xl active:scale-95 transition-all"><Send size={18} /></button>
          </form>
        </div>
      )}
    </div>
  );
}
