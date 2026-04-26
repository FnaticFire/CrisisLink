'use client';

import React, { useEffect, useState, use } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, onSnapshot, collection, query, orderBy, addDoc, arrayUnion } from 'firebase/firestore';
import { AlertDoc, ChatMessageDoc } from '@/lib/types';
import { CheckCircle2, MessageSquare, Navigation, Shield, X, Send, Radio } from 'lucide-react';
import { toast } from 'react-hot-toast';

const MapComponent = dynamic(() => import('@/components/MapComponent'), { ssr: false });

export default function ActiveEmergencyPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const { currentUser, currentLocation } = useAppStore();
  
  const [alert, setAlert] = useState<AlertDoc | null>(null);
  const [messages, setMessages] = useState<ChatMessageDoc[]>([]);
  const [isHumanChatOpen, setIsHumanChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [eta, setEta] = useState<number | null>(null);

  // Firestore listeners
  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
      return;
    }

    // Listen to Alert
    const unsubAlert = onSnapshot(doc(db, 'alerts', unwrappedParams.id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as AlertDoc;
        setAlert(data);
        if (data.status === 'resolved') {
          toast.success('Emergency resolved.');
          router.push('/');
        }
      } else {
        toast.error('Emergency not found.');
        router.push('/');
      }
    });

    // Listen to Messages
    const q = query(collection(db, `alerts/${unwrappedParams.id}/messages`), orderBy('timestamp', 'asc'));
    const unsubMsgs = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessageDoc[] = [];
      snapshot.forEach(d => msgs.push({ id: d.id, ...d.data() } as ChatMessageDoc));
      setMessages(msgs);
    });

    return () => {
      unsubAlert();
      unsubMsgs();
    };
  }, [unwrappedParams.id, currentUser, router]);

  // ETA Simulation (if accepted)
  useEffect(() => {
    if (alert?.status === 'accepted' && eta === null) {
      setEta(4 * 60); // 4 mins
    }
    if (eta !== null && eta > 0) {
      const timer = setInterval(() => setEta(e => e ? e - 1 : 0), 1000);
      return () => clearInterval(timer);
    }
  }, [alert?.status, eta]);

  if (!alert) return <div className="h-screen w-full bg-black flex items-center justify-center text-white font-bold">Connecting Secure Link...</div>;

  const isVictim = alert.userId === currentUser?.id;
  const isResponder = currentUser?.role !== 'civilian';
  const hasResponderAccepted = alert.status === 'accepted';
  const canSeeHumanChat = hasResponderAccepted; // Only open chat if someone is coming

  const activeRespondersCount = alert.responderId ? 1 : 0;

  const handleAccept = async () => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'alerts', alert.id!), {
        status: 'accepted',
        responderId: currentUser.id,
        responderName: currentUser.username,
        responderPhone: currentUser.phone || '',
        responderRole: currentUser.role,
      });
      // System message
      await addDoc(collection(db, `alerts/${alert.id}/messages`), {
        alertId: alert.id,
        senderId: 'system',
        senderName: 'System',
        text: `${currentUser.role.toUpperCase()} Unit dispatched.`,
        timestamp: Date.now(),
        type: 'ai'
      });
      toast.success('You have accepted this emergency.');
    } catch {
      toast.error('Failed to accept alert.');
    }
  };

  const handleResolve = async () => {
    try {
      await updateDoc(doc(db, 'alerts', alert.id!), { status: 'resolved' });
    } catch {
      toast.error('Failed to resolve alert.');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !currentUser) return;
    try {
      const msgText = chatInput.trim();
      setChatInput('');
      await addDoc(collection(db, `alerts/${alert.id}/messages`), {
        alertId: alert.id,
        senderId: currentUser.id,
        senderName: currentUser.username,
        text: msgText,
        timestamp: Date.now(),
        type: 'human'
      });
    } catch {
      toast.error('Failed to send message.');
    }
  };

  const formatETA = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="h-screen w-full flex flex-col bg-black overflow-hidden relative">
      {/* TOP HALF: LIVE MAP */}
      <div className="h-1/2 w-full relative z-0">
        <MapComponent 
          alerts={[alert]} 
          // passing trackingResponderId forces MapComponent to draw a responder moving
          trackingResponderId={hasResponderAccepted ? 'active-responder' : undefined}
          // if ETA exists, calculate a simple linear interpolation from an offset toward user
          trackingPos={
            hasResponderAccepted && eta !== null 
            ? [
                alert.userLocation.lat + (0.01 * (eta / 240)), 
                alert.userLocation.lng + (0.01 * (eta / 240))
              ] 
            : undefined
          }
        />
        {/* Strict Overlay: No random UI mapping buttons */}
        <div className="absolute top-0 w-full h-24 bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute top-6 left-6 z-10 pointer-events-none flex flex-col gap-2">
          <div className="bg-red-600/90 backdrop-blur px-4 py-2 rounded-xl border border-red-500/50 shadow-2xl flex items-center gap-2">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white font-black uppercase text-xs tracking-widest">ACTIVE CRITICAL</span>
          </div>
          {eta !== null && eta > 0 && (
            <div className="bg-black/80 backdrop-blur px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2">
              <Navigation size={14} className="text-primary" />
              <span className="text-white font-bold text-xs">Unit arriving in {formatETA(eta)}</span>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM HALF: AI CHAT PANEL & INSTRUCTIONS (STRICT FOCUS) */}
      <div className="h-1/2 w-full bg-[#111] border-t border-white/10 flex flex-col relative z-20">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between shrink-0 bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="text-white font-black text-sm uppercase tracking-widest">{alert.type}</h3>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Severity: <span className={alert.severity === 'CRITICAL' ? 'text-red-500' : 'text-primary'}>{alert.severity}</span></p>
            </div>
          </div>
          {isResponder && !hasResponderAccepted && (
            <button 
              onClick={handleAccept}
              className="bg-primary text-white font-black text-xs px-6 py-3 rounded-xl uppercase tracking-wider shadow-[0_0_20px_rgba(229,57,53,0.5)] active:scale-95 transition-all"
            >
              Accept Emergency
            </button>
          )}
          {isResponder && hasResponderAccepted && (
            <button 
              onClick={handleResolve}
              className="bg-green-600 text-white font-black text-xs px-6 py-3 rounded-xl uppercase tracking-wider flex items-center gap-2 active:scale-95"
            >
              <CheckCircle2 size={16} /> Mark Resolved
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 no-scrollbar">
          {/* Always Visible AI Guidelines */}
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-5 mb-2">
            <p className="text-primary text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2">
              <Shield size={14} /> AI Safety Checklist
            </p>
            <ol className="flex flex-col gap-2.5">
              {alert.instructions.map((ins, i) => (
                <li key={i} className="text-white/90 text-sm font-medium flex gap-3 mix-blend-screen">
                  <span className="text-primary font-black shrink-0">{i + 1}.</span> {ins}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* FLOATING HUMAN CHAT COMPONENT */}
      {canSeeHumanChat && (
        <>
          <button 
            onClick={() => setIsHumanChatOpen(true)}
            className={`fixed bottom-8 right-8 w-16 h-16 bg-blue-600 text-white rounded-full shadow-[0_0_30px_rgba(37,99,235,0.4)] flex items-center justify-center z-40 transition-transform ${isHumanChatOpen ? 'scale-0' : 'scale-100 hover:scale-110 active:scale-95'}`}
          >
            <MessageSquare size={24} />
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-black" />
          </button>

          {/* Chat Modal Window */}
          {isHumanChatOpen && (
            <div className="fixed bottom-0 right-0 w-full md:w-96 h-[60vh] bg-[#1a1a1a] md:rounded-tl-3xl shadow-[-10px_-10px_40px_rgba(0,0,0,0.5)] z-50 flex flex-col border-l border-t border-white/10 animate-in slide-in-from-bottom-full duration-300">
              <div className="p-4 bg-black/50 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600/20 text-blue-500 rounded-full flex items-center justify-center">
                    <Radio size={16} />
                  </div>
                  <span className="text-white font-bold text-sm tracking-wide">Live Comms</span>
                </div>
                <button onClick={() => setIsHumanChatOpen(false)} className="text-white/40 hover:text-white p-2">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {messages.map(msg => {
                  const isMe = msg.senderId === currentUser?.id;
                  const isSys = msg.senderId === 'system';
                  return (
                    <div key={msg.id} className={`flex flex-col ${isSys ? 'items-center my-2' : isMe ? 'items-end' : 'items-start'}`}>
                      {isSys ? (
                        <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">-- {msg.text} --</span>
                      ) : (
                        <>
                          <span className="text-[10px] text-white/40 mb-1 px-1">{msg.senderName}</span>
                          <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm font-medium ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white/10 text-white rounded-bl-none'}`}>
                            {msg.text}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleSendMessage} className="p-4 bg-black/40 border-t border-white/5 flex gap-2">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Relay information..."
                  className="flex-1 bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-blue-500/50"
                />
                <button type="submit" disabled={!chatInput.trim()} className="w-12 h-12 flex items-center justify-center bg-blue-600 disabled:opacity-50 text-white rounded-xl active:scale-95 transition-all">
                  <Send size={18} />
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}
