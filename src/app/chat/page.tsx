'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Phone, Video, Send, CheckCheck, ShieldAlert, X } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { format } from 'date-fns';

// Auto-responder replies per emergency type
const AUTO_REPLIES: Record<string, string[]> = {
  fire: [
    "I've received your fire emergency alert. Stay calm — I'm en route. ETA: ~4 minutes.",
    "Please stay low and cover your mouth. Do NOT use elevators.",
    "Can you confirm: are you inside the building or have you evacuated?",
    "Help is 1.5km away. Emergency services have also been notified.",
  ],
  medical: [
    "Medical emergency received. Dr. Neha Kapoor dispatched — ETA 3 minutes.",
    "Please keep the patient still and apply pressure to any wounds.",
    "Is the patient conscious and breathing?",
    "Ambulance is also on its way (108 has been notified).",
  ],
  default: [
    "Emergency alert received. I'm heading your way — ETA ~4 min.",
    "Your location has been pinned. Stay where you are if safe.",
    "Can you tell me more about what's happening?",
    "I'm 0.8km away now. Stay on this line.",
  ],
};

const ChatPage = () => {
  const router = useRouter();
  const { messages, addMessage, responders, currentUser, activeAlert, markMessagesRead } = useAppStore();
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [autoReplyIndex, setAutoReplyIndex] = useState(0);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');
  const [callDuration, setCallDuration] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const getResponder = () => {
    const fallback = { id: 'r1', username: 'Dispatcher', avatar: 'https://i.pravatar.cc/150', status: 'online', role: 'responder' };
    if (!responders || responders.length === 0) return fallback;
    if (!activeAlert) return responders[0] || fallback;
    const type = activeAlert.type.toLowerCase();
    
    // Filter matching type first
    let matching = responders;
    if (type.includes('fire')) {
      matching = responders.filter(r => (r.description||'').toLowerCase().includes('fire') || (r.description||'').toLowerCase().includes('tactical'));
    } else if (type.includes('medical') || type.includes('injury')) {
      matching = responders.filter(r => (r.description||'').toLowerCase().includes('medical') || (r.description||'').toLowerCase().includes('trauma'));
    }

    if (matching.length > 0) {
      if (matching[0].distance) matching.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
      return matching[0];
    }
    return responders[0] || fallback;
  };
  const responder = getResponder();

  const getAutoReplies = () => {
    if (!activeAlert) return AUTO_REPLIES.default;
    const type = activeAlert.type.toLowerCase();
    if (type.includes('fire')) return AUTO_REPLIES.fire;
    if (type.includes('medical')) return AUTO_REPLIES.medical;
    return AUTO_REPLIES.default;
  };

  const autoReplies = getAutoReplies();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Separate effect for marking messages as read
  useEffect(() => {
    if (activeAlert) {
      markMessagesRead(activeAlert.id);
    }
  }, [activeAlert, messages.length, markMessagesRead]);

  // Auto-greet on first load if no messages
  useEffect(() => {
    if (messages.length === 0) {
      setTimeout(() => {
        addMessage({
          id: 'welcome-' + Date.now(),
          alertId: activeAlert?.id || 'default',
          senderId: responder.id,
          text: `I am ${responder.name}. I've received your ${activeAlert?.type || 'emergency'} alert. I'm currently en-route to your location. ETA: ~4 minutes. Stay calm.`,
          timestamp: new Date().toISOString(),
          status: 'read',
        });
      }, 800);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMsg = {
      id: Math.random().toString(36).substr(2, 9),
      alertId: activeAlert?.id || 'alert-1',
      senderId: currentUser!.id,
      text: inputText,
      timestamp: new Date().toISOString(),
      status: 'sent' as const,
    };
    addMessage(userMsg);
    setInputText('');

    // Simulate typing + auto-reply
    if (autoReplyIndex < autoReplies.length) {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        addMessage({
          id: 'auto-' + Date.now(),
          alertId: activeAlert?.id || 'default',
          senderId: responder.id,
          text: autoReplies[autoReplyIndex],
          timestamp: new Date().toISOString(),
          status: 'read',
        });
        setAutoReplyIndex((prev) => Math.min(prev + 1, autoReplies.length - 1));
      }, 1500 + Math.random() * 1000);
    }
  };

  const handleCall = (type: 'voice' | 'video') => {
    setCallType(type);
    setCallDuration(0);
    setShowCallModal(true);
    callTimerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
  };

  const handleEndCall = () => {
    setShowCallModal(false);
    clearInterval(callTimerRef.current);
    setCallDuration(0);
  };

  useEffect(() => {
    return () => clearInterval(callTimerRef.current);
  }, []);

  const formatDuration = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const getAiGuidance = () => {
    if (!activeAlert) return ['Stay calm.', 'Your location is shared.', 'Help is coming.'];
    const type = activeAlert.type.toLowerCase();
    if (type.includes('fire')) return ['🔥 Stay low, crawl to exit.', '🚪 Check door temp before opening.', '🚶 Stairs only, no elevators.'];
    if (type.includes('medical')) return ['🛑 Keep patient still.', '🩸 Apply pressure to wounds.', '📞 Stay on this line.'];
    return ['🛑 Stay calm and breathe.', '📍 Location shared with dispatcher.', '📞 Keep this line open.'];
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 max-w-[420px] mx-auto relative overflow-hidden">
      {/* Header */}
      <div className="pt-12 pb-4 px-6 bg-white shrink-0 relative z-50 border-b border-gray-100 soft-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 hover:text-primary transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-gray-100">
                <Image
                  src={responder?.avatar || 'https://i.pravatar.cc/150'}
                  alt={responder?.username || 'Dispatcher'}
                  fill
                  className="object-cover"
                />
                <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-white rounded-full ${responder?.status === 'online' ? 'bg-green-500' : 'bg-orange-500'}`} />
              </div>
              <div className="flex flex-col">
                <h2 className="text-sm font-bold text-gray-900">{responder?.username || 'Dispatcher'}</h2>
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">{responder?.role || 'Responder'}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-gray-400">
          <button onClick={() => handleCall('voice')} className="tap-effect hover:text-primary transition-colors">
            <Phone size={20} />
          </button>
          <button onClick={() => handleCall('video')} className="tap-effect hover:text-primary transition-colors">
            <Video size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 no-scrollbar">
        <div className="text-center py-2">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] bg-gray-100 px-3 py-1 rounded-full">
            Priority Channel Established
          </span>
        </div>

        {/* AI Safety Guidance */}
        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 mb-2">
          <div className="flex items-center gap-2 mb-2 text-primary">
            <ShieldAlert size={14} className="animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">AI Safety Guidance</span>
          </div>
          <ul className="flex flex-col gap-2">
            {getAiGuidance().map((inst, i) => (
              <li key={i} className="text-xs font-bold text-gray-700 leading-tight">• {inst}</li>
            ))}
          </ul>
        </div>

        {/* Messages List */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col max-w-[85%] ${msg.senderId === currentUser!.id ? 'self-end' : 'self-start'}`}
          >
            <div className={`p-4 rounded-2xl text-sm font-medium leading-relaxed ${
              msg.senderId === currentUser!.id
                ? 'bg-primary text-white rounded-tr-none'
                : 'bg-white text-gray-800 rounded-tl-none soft-shadow'
            }`}>
              {msg.text}
            </div>
            <span className={`text-[10px] font-bold text-gray-400 mt-1 flex items-center gap-1 ${msg.senderId === currentUser!.id ? 'self-end' : 'self-start'}`}>
              {format(new Date(msg.timestamp), 'h:mm a')}
              {msg.senderId === currentUser!.id && <CheckCheck size={12} className="text-blue-500" />}
            </span>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex self-start gap-1.5 p-3 bg-white rounded-2xl rounded-tl-none soft-shadow">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white p-4 pb-10 soft-shadow border-t border-gray-100 z-10">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 bg-gray-50 border-none rounded-2xl py-3.5 px-5 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center soft-shadow tap-effect active:scale-90 transition-transform disabled:opacity-40"
          >
            <Send size={20} />
          </button>
        </div>
      </div>

      {/* Call Modal */}
      {showCallModal && (
        <div className="fixed inset-0 z-[200] bg-gray-900 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/20">
              <img src={responder.avatar} alt={responder.name} className="w-full h-full object-cover" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-black text-white">{responder.name}</h2>
              <p className="text-white/60 text-sm mt-1">{callType === 'video' ? '📹 Video Call' : '📞 Voice Call'} • Active</p>
              <p className="text-white font-black text-3xl mt-4 tabular-nums">{formatDuration(callDuration)}</p>
            </div>
            <button
              onClick={handleEndCall}
              className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-xl shadow-red-500/40 tap-effect"
            >
              <X size={28} className="text-white" />
            </button>
            <p className="text-white/40 text-xs">Tap to end call</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
