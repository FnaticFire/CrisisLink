'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronLeft, Star, Shield, Clock, MapPin, Award } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { toast } from 'react-hot-toast';

const ResponderProfile = () => {
  const { id } = useParams();
  const router = useRouter();
  const { responders, setActiveAlert } = useAppStore();
  
  const responder = responders.find(r => r.id === id);

  if (!responder) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <p className="text-gray-500 mb-4">Responder not found.</p>
        <button 
          onClick={() => router.back()}
          className="bg-primary text-white px-6 py-2 rounded-xl"
        >
          Go Back
        </button>
      </div>
    );
  }

  const handleAlert = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: 'Sending emergency alert...',
        success: 'Alert successfully broadcasted!',
        error: 'Failed to send alert.',
      }
    ).then(() => {
      // Mock alert creation
      setActiveAlert({
        id: 'alert-' + Math.random().toString(36).substr(2, 9),
        userId: 'user-1',
        responderId: responder.id,
        type: 'emergency',
        status: 'dispatched',
        severity: 'high',
        location: {
          lat: 28.6139,
          lng: 77.2090,
          address: 'Connaught Place, New Delhi'
        },
        createdAt: new Date().toISOString()
      });
      router.push('/map');
    });
  };

  return (
    <div className="flex flex-col flex-1 bg-white relative pb-32">
      {/* Top Header */}
      <div className="relative h-[300px] w-full">
        <Image 
          src={responder.avatar} 
          alt={responder.name} 
          fill 
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <button 
          onClick={() => router.back()}
          className="absolute top-12 left-6 p-2.5 bg-white/20 backdrop-blur-md rounded-full text-white transition-all hover:bg-white/40 tap-effect"
        >
          <ChevronLeft size={24} />
        </button>
      </div>

      {/* Details Section */}
      <div className="relative -mt-12 bg-white rounded-t-[32px] px-6 pt-8 flex-1">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 mb-1">{responder.name}</h1>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-orange-500 font-bold text-sm">
                <Star size={16} fill="currentColor" /> {responder.rating}
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-gray-500 font-medium text-sm">{responder.experience} Experience</span>
            </div>
          </div>
          <div className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            {responder.status}
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <Shield className="text-primary mb-2" size={20} />
            <div className="text-xs text-gray-400 font-bold uppercase">Badge</div>
            <div className="text-sm font-bold text-gray-800">Advanced EMT</div>
          </div>
          <div className="flex-1 bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <Clock className="text-blue-500 mb-2" size={20} />
            <div className="text-xs text-gray-400 font-bold uppercase">Response</div>
            <div className="text-sm font-bold text-gray-800">~ 4.2 mins</div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-widest px-1">About Responder</h3>
          <p className="text-gray-600 leading-relaxed text-sm">
            {responder.description}
          </p>
        </div>

        {/* Credentials */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-widest px-1">Specialties</h3>
          <div className="flex flex-wrap gap-2">
            {['Trauma Care', 'First Aid', 'Crisis Mgmt', 'CPR'].map((tag) => (
              <span key={tag} className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-xl text-xs font-semibold">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-[420px] px-6 z-40">
        <button 
          onClick={handleAlert}
          className="w-full bg-primary text-white py-4 rounded-2xl font-black text-lg soft-shadow tap-effect flex items-center justify-center gap-3 active:scale-95 transition-all shadow-primary/20 shadow-xl"
        >
          Send Emergency Alert
        </button>
      </div>
    </div>
  );
};

export default ResponderProfile;
