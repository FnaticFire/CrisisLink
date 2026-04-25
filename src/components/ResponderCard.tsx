'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Star, MessageCircle, ShieldAlert } from 'lucide-react';
import { Responder } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { toast } from 'react-hot-toast';

interface ResponderCardProps {
  responder: Responder;
}

const ResponderCard: React.FC<ResponderCardProps> = ({ responder }) => {
  const router = useRouter();
  const { setActiveAlert, currentUser } = useAppStore();

  const handleAlertNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const alert = {
      id: 'alert-' + Date.now(),
      userId: currentUser?.id || 'user-1',
      responderId: responder.id,
      type: 'emergency',
      status: 'dispatched' as const,
      severity: 'high' as const,
      userLocation: currentUser?.location || { lat: 28.6139, lng: 77.2090, address: 'Current Location' },
      createdAt: new Date().toISOString(),
    };

    toast.promise(
      new Promise<void>((resolve) => setTimeout(resolve, 1200)),
      {
        loading: `Alerting ${responder.username}...`,
        success: `🚨 ${responder.username} has been notified!`,
        error: 'Failed to send alert.',
      }
    ).then(() => {
      setActiveAlert(alert);
      router.push('/map');
    });
  };

  const handleChat = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Set a temporary alert so chat is context-aware
    if (!useAppStore.getState().activeAlert) {
      setActiveAlert({
        id: 'alert-chat-' + Date.now(),
        userId: currentUser?.id || 'user-1',
        responderId: responder.id,
        type: 'General Inquiry',
        status: 'active',
        severity: 'low',
        userLocation: currentUser?.location || { lat: 28.6139, lng: 77.2090, address: 'Current Location' },
        createdAt: new Date().toISOString(),
      });
    }
    router.push('/chat');
  };

  return (
    <div
      onClick={() => router.push(`/responder/${responder.id}`)}
      className="bg-white rounded-2xl p-4 soft-shadow border border-gray-50 flex items-center gap-4 transition-all hover:border-primary/20 tap-effect cursor-pointer"
    >
      <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
        <Image
          src={responder.avatar || 'https://i.pravatar.cc/150'}
          alt={responder.username}
          fill
          className="object-cover"
        />
        <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white rounded-full ${responder.status === 'online' ? 'bg-green-500' : 'bg-orange-500'}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-gray-900 truncate">{responder.username}</h3>
          <span className="flex items-center gap-0.5 text-xs font-bold text-orange-500 shrink-0">
            <Star size={12} fill="currentColor" />
            {responder.rating}
          </span>
        </div>
        <p className="text-xs text-gray-500 font-medium mb-2">{responder.experience} exp • {responder.distance}</p>

        <div className="flex gap-2">
          <button
            onClick={handleAlertNow}
            className="flex-1 bg-primary text-white text-[11px] font-bold py-1.5 rounded-lg transition-transform active:scale-95 flex items-center justify-center gap-1"
          >
            <ShieldAlert size={11} /> Alert Now
          </button>
          <button
            onClick={handleChat}
            className="px-2.5 bg-gray-50 text-gray-400 rounded-lg hover:text-primary hover:bg-primary/5 transition-colors"
          >
            <MessageCircle size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResponderCard;
