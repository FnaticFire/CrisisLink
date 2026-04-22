'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppStore } from '@/lib/store';

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

const responderIcon = L.divIcon({
  className: 'responder-marker',
  html: '<div class="w-8 h-8 bg-primary border-4 border-white rounded-full shadow-lg flex items-center justify-center text-white text-[10px] font-bold">🦺</div>',
  iconSize: [32, 32],
});

const MapComponent = () => {
  const { currentUser, responders, activeAlert } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-full w-full bg-gray-100 animate-pulse"></div>;

  const center: [number, number] = currentUser?.location 
    ? [currentUser.location.lat, currentUser.location.lng] 
    : [28.6139, 77.2090];

  return (
    <MapContainer 
      center={center} 
      zoom={14} 
      className="h-full w-full z-0"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* User Marker */}
      {currentUser?.location && (
        <Marker position={[currentUser.location.lat, currentUser.location.lng]} icon={userIcon}>
          <Popup>You are here</Popup>
        </Marker>
      )}

      {/* Responder Markers */}
      {responders.map(responder => (
        <Marker 
          key={responder.id} 
          position={[
            responder.id === 'resp-1' ? 28.6160 : responder.id === 'resp-2' ? 28.6110 : 28.6180, 
            responder.id === 'resp-1' ? 77.2110 : responder.id === 'resp-2' ? 77.2070 : 77.2150
          ]} 
          icon={responderIcon}
        >
          <Popup>{responder.name}</Popup>
        </Marker>
      ))}

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
