'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppStore } from '@/lib/store';
import { NearbyPlace } from '@/lib/places';

// Fix for default marker icons in Leaflet + Next.js
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const userIcon = L.divIcon({
  className: 'user-marker',
  html: '<div class="w-6 h-6 bg-blue-500 border-4 border-white rounded-full shadow-lg pulse-blue"></div>',
  iconSize: [24, 24],
});

const getEmergencyIcon = (severity: string) => {
  const color = severity?.toLowerCase() === 'critical' ? 'bg-red-500' : severity?.toLowerCase() === 'high' ? 'bg-orange-500' : 'bg-amber-500';
  return L.divIcon({
    className: 'emergency-marker',
    html: `<div class="w-10 h-10 ${color} border-4 border-white rounded-2xl shadow-xl flex items-center justify-center text-white animate-bounce text-lg">🚨</div>`,
    iconSize: [40, 40],
  });
};

const responderIcon = (name: string, isTracking?: boolean) => L.divIcon({
  className: 'responder-marker',
  html: `<div class="flex flex-col items-center">
          <div class="w-10 h-10 bg-white border-2 ${isTracking ? 'border-primary scale-110 shadow-primary/40' : 'border-gray-200'} rounded-full shadow-lg flex items-center justify-center overflow-hidden transition-all">
            <img src="https://i.pravatar.cc/100?u=${name}" class="w-full h-full object-cover" />
          </div>
          <div class="${isTracking ? 'bg-primary' : 'bg-gray-500'} text-white text-[8px] px-1.5 py-0.5 rounded-full font-black -mt-2 border border-white uppercase shadow-sm">${name.split(' ')[0]}</div>
         </div>`,
  iconSize: [50, 60],
  iconAnchor: [25, 50],
});

const recommendationIcon = (type: string) => {
  const emoji = type === 'hospital' ? '🏥' : type === 'police' ? '👮' : '🚒';
  const color = type === 'hospital' ? 'bg-red-500' : type === 'police' ? 'bg-blue-600' : 'bg-orange-600';
  return L.divIcon({
    className: 'recommendation-marker',
    html: `<div class="w-8 h-8 ${color} border-2 border-white rounded-xl shadow-md flex items-center justify-center text-white text-sm scale-90 opacity-90">${emoji}</div>`,
    iconSize: [32, 32],
  });
};

interface MapComponentProps {
  nearbyPlaces?: NearbyPlace[];
  trackingResponderId?: string;
  trackingPos?: [number, number];
}

const MapComponent: React.FC<MapComponentProps> = ({ nearbyPlaces = [], trackingResponderId, trackingPos }) => {
  const { currentUser, responders, activeAlert } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-full w-full bg-gray-50 animate-pulse"></div>;

  const center: [number, number] = currentUser?.location 
    ? [currentUser.location.lat, currentUser.location.lng] 
    : [28.6139, 77.2090];

  return (
    <MapContainer 
      center={center} 
      zoom={15} 
      className="h-full w-full z-0"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* User Marker */}
      {currentUser?.location && (
        <Marker position={[currentUser.location.lat, currentUser.location.lng]} icon={userIcon}>
          <Popup>Your Location</Popup>
        </Marker>
      )}

      {/* Nearby Places Recommendations */}
      {nearbyPlaces.map(place => (
        <Marker 
          key={place.id} 
          position={[place.lat, place.lng]} 
          icon={recommendationIcon(place.type)}
        >
          <Popup>
            <div className="p-1">
              <div className="font-bold text-sm">{place.name}</div>
              <div className="text-[10px] text-gray-500">{place.address}</div>
              <div className="text-[10px] font-black text-primary mt-1 uppercase">{place.distance} away</div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Active Alert Marker */}
      {activeAlert && (
        <Marker position={[activeAlert.location.lat, activeAlert.location.lng]} icon={getEmergencyIcon(activeAlert.severity)}>
          <Popup>
            <div className="font-bold">{activeAlert.type}</div>
            <div className="text-xs uppercase font-black text-primary">{activeAlert.severity} Priority</div>
          </Popup>
        </Marker>
      )}

      {/* Responder Markers */}
      {responders.map(responder => {
        const isTracking = trackingResponderId === responder.id;
        const position: [number, number] = isTracking && trackingPos 
          ? trackingPos 
          : [
            responder.id === 'resp-1' ? 28.6160 : responder.id === 'resp-2' ? 28.6110 : responder.id === 'resp-3' ? 28.6180 : 28.6120, 
            responder.id === 'resp-1' ? 77.2110 : responder.id === 'resp-2' ? 77.2070 : responder.id === 'resp-3' ? 77.2150 : 77.2140
          ];

        return (
          <Marker 
            key={responder.id} 
            position={position} 
            icon={responderIcon(responder.name, isTracking)}
          >
            <Popup>
              <div className="font-bold">{responder.name}</div>
              <div className="text-xs">{isTracking ? 'Currently tracking help arrival' : 'Stationed'}</div>
            </Popup>
          </Marker>
        );
      })}

      <RecenterMap lat={center[0]} lng={center[1]} />
      
      <style jsx global>{`
        .pulse-blue {
          animation: pulse-blue 2s infinite;
        }
        @keyframes pulse-blue {
          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
        .leaflet-container {
          background: #f8fafc !important;
        }
      `}</style>
    </MapContainer>
  );
};

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

export default MapComponent;
