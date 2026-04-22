'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronLeft, Phone, Video, Send, CheckCheck, MoreVertical } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { format } from 'date-fns';

const ChatPage = () => {
  const router = useRouter();
  const { messages, addMessage, responders, currentUser } = useAppStore();
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const responder = responders[0]; // Mocking chat with first responder

  const mockInitialMessages = [
    {
      id: 'm1',
      senderId: responder.id,
      text: "Hello Sarah, I've received your emergency alert and I'm currently 1.2km away from your position.",
      timestamp: new Date(Date.now() - 120000).toISOString(),
    },
    {
      id: 'm2',
      senderId: responder.id,
      text: "Please stay where you are. Are you in a safe location?",
      timestamp: new Date(Date.now() - 60000).toISOString(),
    }
  ];

  useEffect(() => {
    // Scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, mockInitialMessages]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    addMessage({
      id: Math.random().toString(36).substr(2, 9),
      alertId: 'alert-1',
      senderId: currentUser!.id,
      text: inputText,
      timestamp: new Date().toISOString(),
      status: 'sent'
    });
    setInputText('');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 max-w-[420px] mx-auto relative overflow-hidden">
      {/* Chat Header */}
      <div className="bg-white px-6 pt-12 pb-4 flex items-center justify-between soft-shadow z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 tap-effect">
            <ChevronLeft size={24} />
          </button>
          <div className="relative">
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <Image src={responder.avatar} alt={responder.name} fill className="object-cover" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900 leading-tight">{responder.name}</h3>
            <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Responder • Online</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-gray-400">
          <Phone size={20} className="tap-effect cursor-pointer font-bold" />
          <Video size={20} className="tap-effect cursor-pointer font-bold" />
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 no-scrollbar"
      >
        <div className="text-center py-4">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] bg-gray-100 px-3 py-1 rounded-full">
            Emergency Channel Encrypted
          </span>
        </div>

        {mockInitialMessages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex flex-col max-w-[85%] ${msg.senderId === responder.id ? 'self-start' : 'self-end'}`}
          >
            <div className={`p-4 rounded-2xl text-sm font-medium leading-relaxed ${
              msg.senderId === responder.id 
                ? 'bg-white text-gray-800 rounded-tl-none soft-shadow' 
                : 'bg-primary text-white rounded-tr-none'
            }`}>
              {msg.text}
            </div>
            <span className={`text-[10px] font-bold text-gray-400 mt-1 flex items-center gap-1 ${
              msg.senderId === responder.id ? 'self-start' : 'self-end'
            }`}>
              {format(new Date(msg.timestamp), 'h:mm a')}
              {msg.senderId !== responder.id && <CheckCheck size={12} className="text-blue-500" />}
            </span>
          </div>
        ))}

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
            <span className={`text-[10px] font-bold text-gray-400 mt-1 flex items-center gap-1 ${
              msg.senderId === currentUser!.id ? 'self-end' : 'self-start'
            }`}>
              {format(new Date(msg.timestamp), 'h:mm a')}
              {msg.senderId === currentUser!.id && <CheckCheck size={12} className="text-blue-500" />}
            </span>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="bg-white p-6 pt-4 pb-12 soft-shadow border-t border-gray-100 z-10">
        <div className="flex items-center gap-3">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 bg-gray-50 border-none rounded-2xl py-3.5 px-5 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all"
          />
          <button 
            onClick={handleSend}
            className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center soft-shadow tap-effect active:scale-90 transition-transform"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
