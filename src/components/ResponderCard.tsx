import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, MessageCircle, MoreVertical } from 'lucide-react';
import { Responder } from '@/lib/types';

interface ResponderCardProps {
  responder: Responder;
}

const ResponderCard: React.FC<ResponderCardProps> = ({ responder }) => {
  return (
    <Link href={`/responder/${responder.id}`} className="block">
      <div className="bg-white rounded-2xl p-4 soft-shadow border border-gray-50 flex items-center gap-4 transition-all hover:border-primary/20 tap-effect">
        <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
          <Image 
            src={responder.avatar} 
            alt={responder.name} 
            fill 
            className="object-cover"
          />
          <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white rounded-full ${
            responder.status === 'online' ? 'bg-green-500' : 'bg-orange-500'
          }`}></div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-gray-900 truncate">{responder.name}</h3>
            <span className="flex items-center gap-0.5 text-xs font-bold text-orange-500">
              <Star size={12} fill="currentColor" />
              {responder.rating}
            </span>
          </div>
          <p className="text-xs text-gray-500 font-medium mb-2">{responder.experience} exp • {responder.distance}</p>
          
          <div className="flex gap-2">
            <button className="flex-1 bg-primary text-white text-[11px] font-bold py-1.5 rounded-lg transition-transform active:scale-95">
              Alert Now
            </button>
            <button className="px-2.5 bg-gray-50 text-gray-400 rounded-lg hover:text-primary transition-colors">
              <MessageCircle size={16} />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ResponderCard;
