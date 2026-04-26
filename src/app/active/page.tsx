'use client';

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { X, Send, Navigation, CheckCircle2, MessageSquare, Radio, Phone, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { listenToAlert, haversineKm, resolveAlertInDB, getEmergencyNumber } from '@/lib/alertService';
import { sendChatMessage, listenToChat, ChatMsg, RESPONDER_QUICK_REPLIES, CIVILIAN_QUICK_REPLIES } from '@/lib/chatService';
import { AlertDoc } from '@/lib/types';
import { debugLog, debugError, DEBUG, setDebugField } from '@/lib/debug';

const MapComponent = dynamic(() => import('@/components/MapComponent'), { ssr: false });

export default function ActiveEmergencyPage() {
  const router = useRouter();
  const { activeAlert, setActiveAlert, resolveAlert, currentUser } = useAppStore();
  const [liveAlert, setLiveAlert] = useState<AlertDoc | null>(null);
  const [aiMessages, setAiMessages] = useState<{sender: string, text: string}[]>([]);
  const [isHumanChatOpen, setIsHumanChatOpen] = useState(false);
  const [humanMessages, setHumanMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [humanChatInput, setHumanChatInput] = useState('');
  const [responderAccepted, setResponderAccepted] = useState(false);
  const [newMsgCount, setNewMsgCount] = useState(0);
  const aiChatEndRef = useRef<HTMLDivElement>(null);
  const humanChatEndRef = useRef<HTMLDivElement>(null);

  const alert = liveAlert || activeAlert;
  const isCivilian = currentUser?.role === 'civilian';
  const isResponder = !isCivilian;

  // Subscribe to Firestore alert updates
  useEffect(() => {
    if (!activeAlert?.id) { router.push('/'); return; }
    const unsub = listenToAlert(activeAlert.id, (updated) => {
      if (!updated) return;
      setLiveAlert(updated);
      setActiveAlert(updated);
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

  // Subscribe to Firestore chat messages
  useEffect(() => {
    if (!activeAlert?.id) return;
    const unsub = listenToChat(activeAlert.id, (msgs) => {
      setHumanMessages(msgs);
      if (!isHumanChatOpen && msgs.length > 0) {
        setNewMsgCount(prev => prev + 1);
      }
    });
    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAlert?.id]);

  // AI welcome messages
  useEffect(() => {
    if (alert) {
      setAiMessages([
        { sender: 'ai', text: `🚨 ${alert.type} protocol initiated.` },
        { sender: 'ai', text: 'Stay calm. Searching for nearest responder...' },
        { sender: 'ai', text: 'Describe your situation for guidance.' }
      ]);
    }
  }, [alert?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { aiChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [aiMessages]);
  useEffect(() => { humanChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [humanMessages]);

  if (!alert) return (
    <div className="h-[100dvh] w-full bg-slate-950 flex items-center justify-center">
      <Loader2 className="text-primary animate-spin" size={32} />
    </div>
  );

  const hasResponder = alert.status !== 'pending' && !!alert.responderId;
  const respLat = alert.responderLocation?.lat || (alert.userLocation.lat + 0.008);
  const respLng = alert.responderLocation?.lng || (alert.userLocation.lng + 0.008);
  const distKm = haversineKm(alert.userLocation.lat, alert.userLocation.lng, respLat, respLng);
  const etaSec = Math.max(0, Math.floor((distKm / 40) * 3600));
  const canResolve = isResponder && distKm < 0.5;
  const emergencyDial = getEmergencyNumber(alert.type);
  const quickReplies = isResponder ? RESPONDER_QUICK_REPLIES : CIVILIAN_QUICK_REPLIES;

  const handleResolve = async () => {
    try {
      await resolveAlertInDB(alert.id);
      resolveAlert();
      router.push('/');
      toast.success('Emergency resolved.');
    } catch { toast.error('Failed to resolve.'); }
  };

  // AI Chat
  const handleSendAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setAiMessages(prev => [...prev, { sender: 'user', text: msg }]);
    setChatInput('');
    setAiMessages(prev => [...prev, { sender: 'ai', text: '...' }]);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error('NEXT_PUBLIC_GEMINI_API_KEY not set');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(
        `You are CrisisLink AI, an emergency safety advisor. The user is in an active "${alert.type}" emergency (severity: ${alert.severity}). They say: "${msg}". Respond with 1-2 sentences of actionable, specific safety advice.`
      );
      const text = result.response.text();
      debugLog('AI-Chat', text);
      setDebugField({ ai: 'ACTIVE' });
      setAiMessages(prev => [...prev.slice(0, -1), { sender: 'ai', text }]);
    } catch (err: any) {
      debugError('AI-Chat', err);
      setDebugField({ ai: 'FAILED' });
      if (DEBUG) toast.error(`AI Error: ${err.message || 'Unknown'}`);
      const t = (alert.type || '').toLowerCase();
      let fb = 'Stay in a safe location. Help is on the way.';
      if (t.includes('fire')) fb = 'Stay low below smoke. Cover mouth with wet cloth and head to exit.';
      else if (t.includes('medical')) fb = 'Keep patient still. Do not give food or water. Monitor breathing.';
      setAiMessages(prev => [...prev.slice(0, -1), { sender: 'ai', text: fb }]);
    }
  };

  // Human chat — write to Firestore
  const handleSendHuman = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!humanChatInput.trim() || !currentUser) return;
    const text = humanChatInput.trim();
    setHumanChatInput('');
    try {
      await sendChatMessage(alert.id, {
        senderId: currentUser.id,
        senderName: currentUser.username,
        senderRole: currentUser.role,
        text,
        timestamp: Date.now(),
      });
    } catch { toast.error('Message failed to send.'); }
  };

  // Quick reply
  const handleQuickReply = async (text: string) => {
    if (!currentUser) return;
    try {
      await sendChatMessage(alert.id, {
        senderId: currentUser.id,
        senderName: currentUser.username,
        senderRole: currentUser.role,
        text,
        timestamp: Date.now(),
      });
    } catch { toast.error('Quick reply failed.'); }
  };

  const formatETA = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-slate-950 overflow-hidden relative">
      {/* Emergency Dial Badge */}
      <a href={`tel:${emergencyDial.number}`} className="fixed top-5 left-5 z-[60] bg-red-600/90 backdrop-blur-lg px-3 py-2 rounded-xl flex items-center gap-2 shadow-lg active:scale-95 transition-transform">
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

        {/* Responder / Waiting card */}
        <div className="absolute bottom-3 left-3 right-3 z-10">
          {hasResponder ? (
            <div className="bg-slate-950/85 backdrop-blur-xl rounded-2xl p-3 border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-indigo-600 rounded-xl flex items-center justify-center text-white text-xs font-bold">
                {(alert.responderName || 'R').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-xs truncate">{alert.responderName}</p>
                <p className="text-white/50 text-[10px]">{alert.responderRole} • {distKm.toFixed(1)} km • {alert.responderPhone}</p>
              </div>
              {alert.responderPhone && (
                <a href={`tel:${alert.responderPhone}`} className="w-9 h-9 bg-green-600/20 text-green-400 rounded-lg flex items-center justify-center shrink-0">
                  <Phone size={14} />
                </a>
              )}
              <button onClick={() => { setIsHumanChatOpen(true); setNewMsgCount(0); }} className="w-9 h-9 bg-blue-600/20 text-blue-400 rounded-lg flex items-center justify-center relative shrink-0">
                <MessageSquare size={14} />
                {newMsgCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">{newMsgCount}</span>}
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
          {aiMessages.map((m, i) => (
            <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`px-3.5 py-2 rounded-2xl max-w-[85%] text-sm ${m.sender === 'user' ? 'bg-primary text-white rounded-br-sm' : 'bg-white/8 text-white/90 rounded-bl-sm'}`}>
                {m.text}
              </div>
            </div>
          ))}
          <div ref={aiChatEndRef} />
        </div>

        <form onSubmit={handleSendAI} className="p-3 bg-black/30 border-t border-white/5 flex gap-2">
          <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ask AI for guidance..." className="flex-1 bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-primary/50" />
          <button type="submit" disabled={!chatInput.trim()} className="w-10 h-10 bg-primary disabled:opacity-40 text-white rounded-xl flex items-center justify-center active:scale-95"><Send size={15} /></button>
        </form>
      </div>

      {/* Floating chat button */}
      {hasResponder && !isHumanChatOpen && (
        <button onClick={() => { setIsHumanChatOpen(true); setNewMsgCount(0); }} className="fixed bottom-4 right-4 w-12 h-12 bg-gradient-to-br from-primary to-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center z-[60] active:scale-95 relative">
          <MessageSquare size={18} />
          {newMsgCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-bounce">{newMsgCount}</span>}
        </button>
      )}

      {/* ─── HUMAN CHAT PANEL (Firestore real-time) ─── */}
      {isHumanChatOpen && (
        <div className="fixed inset-x-0 bottom-0 h-[60vh] bg-[#0F1419] z-[70] flex flex-col border-t border-white/10 animate-in slide-in-from-bottom-full duration-300">
          {/* Header */}
          <div className="p-3 bg-black/40 border-b border-white/5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary/20 text-primary rounded-full flex items-center justify-center"><Radio size={14} /></div>
              <div>
                <p className="text-white font-bold text-sm">
                  {isResponder ? (alert.userName || 'Civilian') : (alert.responderName || 'Responder')}
                </p>
                <p className="text-white/40 text-[10px]">
                  {isResponder ? 'Civilian' : (alert.responderPhone || alert.responderRole || 'Connecting...')}
                </p>
              </div>
            </div>
            <button onClick={() => setIsHumanChatOpen(false)} className="text-white/40 hover:text-white p-1"><X size={18} /></button>
          </div>

          {/* Quick Replies */}
          <div className="flex gap-1.5 px-3 py-2 overflow-x-auto no-scrollbar border-b border-white/5 bg-black/20 shrink-0">
            {quickReplies.map((qr, i) => (
              <button key={i} onClick={() => handleQuickReply(qr)} className="shrink-0 bg-white/8 hover:bg-primary/20 border border-white/10 text-white/70 hover:text-white text-[11px] px-3 py-1.5 rounded-full font-medium transition-all active:scale-95">
                {qr}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {humanMessages.length === 0 && <div className="text-center text-white/20 text-sm mt-8">Send a message to connect</div>}
            {humanMessages.map((m, i) => {
              const isMe = m.senderId === currentUser?.id;
              return (
                <div key={m.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className="flex flex-col max-w-[85%]">
                    {!isMe && <span className="text-[9px] text-white/30 font-semibold mb-0.5 ml-1">{m.senderName}</span>}
                    <div className={`px-3.5 py-2 rounded-2xl text-sm ${isMe ? 'bg-primary text-white rounded-br-sm' : 'bg-white/8 text-white/90 rounded-bl-sm'}`}>
                      {m.text}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={humanChatEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendHuman} className="p-3 bg-black/30 border-t border-white/5 flex gap-2 shrink-0">
            <input value={humanChatInput} onChange={e => setHumanChatInput(e.target.value)} placeholder="Type a message..." className="flex-1 bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none" />
            <button type="submit" disabled={!humanChatInput.trim()} className="w-10 h-10 bg-primary disabled:opacity-40 text-white rounded-xl flex items-center justify-center active:scale-95"><Send size={15} /></button>
          </form>
        </div>
      )}
    </div>
  );
}
