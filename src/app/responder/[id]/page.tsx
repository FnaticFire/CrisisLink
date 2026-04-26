'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronLeft, Star, Shield, Clock, MapPin, Award, MessageCircle, Phone } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { toast } from 'react-hot-toast';
import { createAlert } from '@/lib/alertService';

// Per-responder specialties
const SPECIALTIES: Record<string, string[]> = {
  'resp-1': ['Tactical Response', 'Crisis Negotiation', 'First Aid', 'Crowd Control'],
  'resp-2': ['Trauma Surgery', 'Critical Care', 'CPR & ACLS', 'Pre-Hospital Care'],
  'resp-3': ['Urban Search & Rescue', 'Hazmat', 'Fire Suppression', 'Rope Rescue'],
  'resp-4': ['First Aid', 'Patient Transport', 'Community Response', 'Paramedic'],
};

const RESPONSE_TIMES: Record<string, string> = {
  'resp-1': '~3.5 min',
  'resp-2': '~4.2 min',
  'resp-3': '~7.0 min',
  'resp-4': '~5.0 min',
};

const BADGES: Record<string, string> = {
  'resp-1': 'Senior Inspector',
  'resp-2': 'Trauma Specialist',
  'resp-3': 'Advanced EMT',
  'resp-4': 'Certified First Responder',
};

const REVIEWS: Record<string, Array<{ user: string; rating: number; text: string }>> = {
  'resp-1': [
    { user: 'Priya S.', rating: 5, text: 'Arrived within 3 minutes. Extremely professional.' },
    { user: 'Rahul K.', rating: 5, text: 'Handled the situation calmly and efficiently.' },
  ],
  'resp-2': [
    { user: 'Ananya M.', rating: 5, text: 'Dr. Kapoor saved my father\'s life. Incredible doctor.' },
    { user: 'Rishi P.', rating: 5, text: 'Best trauma response I\'ve ever seen. Highly recommend.' },
  ],
  'resp-3': [
    { user: 'Sanjay T.', rating: 5, text: 'Vikram evacuated our whole floor. Fearless.' },
    { user: 'Deepa N.', rating: 4, text: 'Very skilled firefighter. Kept us calm throughout.' },
  ],
  'resp-4': [
    { user: 'Meena G.', rating: 5, text: 'Ankit was there in under 5 minutes. Very helpful.' },
    { user: 'Kiran V.', rating: 5, text: 'Great community volunteer. Would call again.' },
  ],
};

const ResponderProfile = () => {
  const { id } = useParams();
  const router = useRouter();
  const { responders, setActiveAlert, currentUser } = useAppStore();

  const responder = responders.find((r) => r.id === id);

  if (!responder) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <p className="text-gray-500 mb-4">Responder not found.</p>
        <button onClick={() => router.back()} className="bg-primary text-white px-6 py-2 rounded-xl">
          Go Back
        </button>
      </div>
    );
  }

  const specialties = SPECIALTIES[responder.id] || ['Trauma Care', 'First Aid', 'Crisis Mgmt', 'CPR'];
  const responseTime = RESPONSE_TIMES[responder.id] || '~4.5 min';
  const badge = BADGES[responder.id] || 'Emergency Responder';
  const reviews = REVIEWS[responder.id] || [];

  const handleAlert = () => {
    toast.promise(
      new Promise<void>((resolve) => setTimeout(resolve, 1200)),
      {
        loading: `Dispatching ${responder.name}...`,
        success: `🚨 Emergency alert sent to ${responder.name}!`,
        error: 'Failed to send alert.',
      }
    ).then(async () => {
      const alertDoc: any = {
        id: 'alert-' + Date.now(),
        userId: currentUser?.id || 'user-1',
        userName: currentUser?.username || 'Civilian',
        responderId: responder.id,
        responderName: responder.name,
        responderRole: badge,
        responderPhone: responder.phone || '+91 98765 43210',
        type: 'emergency',
        status: 'dispatched',
        severity: 'high',
        confidence: 100,
        reason: 'Manual responder dispatch',
        instructions: ['Responder contacted directly', 'Stay at location'],
        userLocation: currentUser?.location || { lat: 28.6139, lng: 77.2090, address: 'Current Location' },
        createdAt: Date.now(),
      };
      try {
        await createAlert(alertDoc);
        setActiveAlert(alertDoc);
        router.push('/active');
      } catch {
        toast.error('Failed to create alert document');
      }
    });
  };

  const handleChat = async () => {
    const alertId = 'chat-' + (currentUser?.id || 'anon') + '-' + responder.id;
    const inquiryAlert: any = {
      id: alertId,
      userId: currentUser?.id || 'user-1',
      userName: currentUser?.username || 'User',
      responderId: responder.id,
      responderName: responder.name,
      responderRole: badge,
      responderPhone: responder.phone || '+91 98765 43210',
      type: 'General Inquiry',
      status: 'accepted',
      severity: 'low',
      confidence: 100,
      reason: 'General inquiry started from profile',
      instructions: ['Chatting with responder'],
      userLocation: currentUser?.location || { lat: 28.6139, lng: 77.2090, address: 'New Delhi' },
      createdAt: Date.now(),
    };
    
    try {
      await createAlert(inquiryAlert);
      setActiveAlert(inquiryAlert);
      router.push('/active');
    } catch {
      toast.error('Could not start chat session');
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-white relative pb-32">
      {/* Hero Header */}
      <div className="relative h-[280px] w-full">
        <Image src={responder.avatar} alt={responder.name} fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <button
          onClick={() => router.back()}
          className="absolute top-12 left-6 p-2.5 bg-white/20 backdrop-blur-md rounded-full text-white transition-all hover:bg-white/40 tap-effect"
        >
          <ChevronLeft size={24} />
        </button>
        {/* Status badge on hero */}
        <div className={`absolute top-12 right-6 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${responder.status === 'online' ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}`}>
          {responder.status}
        </div>
      </div>

      {/* Details Card */}
      <div className="relative -mt-12 bg-white rounded-t-[32px] px-6 pt-8 flex-1">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 mb-1">{responder.name}</h1>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-orange-500 font-bold text-sm">
                <Star size={16} fill="currentColor" /> {responder.rating}
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-gray-500 font-medium text-sm">{responder.experience} exp</span>
              <span className="text-gray-300">•</span>
              <span className="text-gray-500 font-medium text-sm flex items-center gap-1">
                <MapPin size={12} /> {responder.distance}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <Shield className="text-primary mb-2" size={18} />
            <div className="text-[9px] text-gray-400 font-bold uppercase">Badge</div>
            <div className="text-xs font-bold text-gray-800 mt-0.5">{badge}</div>
          </div>
          <div className="flex-1 bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <Clock className="text-blue-500 mb-2" size={18} />
            <div className="text-[9px] text-gray-400 font-bold uppercase">Response</div>
            <div className="text-xs font-bold text-gray-800 mt-0.5">{responseTime}</div>
          </div>
          <div className="flex-1 bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <Award className="text-amber-500 mb-2" size={18} />
            <div className="text-[9px] text-gray-400 font-bold uppercase">Missions</div>
            <div className="text-xs font-bold text-gray-800 mt-0.5">200+</div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">About</h3>
          <p className="text-gray-600 leading-relaxed text-sm">{responder.description}</p>
        </div>

        {/* Specialties */}
        <div className="mb-6">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Specialties</h3>
          <div className="flex flex-wrap gap-2">
            {specialties.map((tag) => (
              <span key={tag} className="bg-primary/5 text-primary border border-primary/10 px-3 py-1.5 rounded-xl text-xs font-semibold">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={handleChat}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-700 rounded-2xl text-sm font-bold tap-effect hover:bg-gray-200 transition-colors"
          >
            <MessageCircle size={18} /> Message
          </button>
          <a
            href="tel:112"
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-600 rounded-2xl text-sm font-bold tap-effect hover:bg-blue-100 transition-colors"
          >
            <Phone size={18} /> Call
          </a>
        </div>

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="mb-6">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Recent Reviews</h3>
            <div className="flex flex-col gap-3">
              {reviews.map((rev, i) => (
                <div key={i} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-900">{rev.user}</span>
                    <span className="text-xs text-orange-500 font-black flex items-center gap-0.5">
                      {'⭐'.repeat(rev.rating)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 italic">&quot;{rev.text}&quot;</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating CTA */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-[420px] px-6 z-40">
        <button
          onClick={handleAlert}
          className="w-full bg-primary text-white py-5 rounded-2xl font-black text-lg soft-shadow tap-effect flex items-center justify-center gap-3 active:scale-95 transition-all shadow-primary/30 shadow-xl"
        >
          🚨 Send Emergency Alert
        </button>
      </div>
    </div>
  );
};

export default ResponderProfile;
