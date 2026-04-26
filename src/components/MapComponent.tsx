'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppStore } from '@/lib/store';
import { NearbyPlace } from '@/lib/places';
import { AlertDoc } from '@/lib/types';

// Icons
const icon = typeof window !== 'undefined' ? L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
}) : undefined;

const userIcon = typeof window !== 'undefined' ? L.divIcon({
  className: 'user-marker',
  html: '<div class="w-6 h-6 bg-blue-500 border-4 border-white rounded-full shadow-lg pulse-blue"></div>',
  iconSize: [24, 24],
}) : undefined;

const getEmergencyIcon = (severity: string, type: string) => {
  if (typeof window === 'undefined') return undefined;
  const isVolunteer = type === 'Volunteer Request';
  const color = isVolunteer ? 'bg-violet-600' :
                severity === 'CRITICAL' ? 'bg-red-600' : 
                severity === 'HIGH' ? 'bg-red-400' : 
                severity === 'MEDIUM' ? 'bg-yellow-400' : 'bg-blue-400';
  const emoji = isVolunteer ? '🙋' : '🚨';
  return L.divIcon({
    className: 'emergency-marker',
    html: `<div class="w-8 h-8 ${color} border-4 border-white rounded-full shadow-xl flex items-center justify-center text-white animate-bounce text-sm">${emoji}</div>`,
    iconSize: [32, 32],
  });
};

const recommendationIcon = (type: string) => {
  if (typeof window === 'undefined') return undefined;
  const emoji = type === 'hospital' ? '🏥' : type === 'police' ? '👮' : '🚒';
  const color = type === 'hospital' ? 'bg-red-500' : type === 'police' ? 'bg-blue-600' : 'bg-orange-600';
  return L.divIcon({
    className: 'recommendation-marker',
    html: `<div class="w-6 h-6 ${color} border-2 border-white rounded-full shadow-md flex items-center justify-center text-white text-xs scale-90 opacity-90">${emoji}</div>`,
    iconSize: [24, 24],
  });
};

interface MapComponentProps {
  nearbyPlaces?: NearbyPlace[];
  alerts?: AlertDoc[];
  trackingResponderId?: string;
  trackingPos?: [number, number];
}

const MapComponent: React.FC<MapComponentProps> = ({ nearbyPlaces = [], alerts = [], trackingResponderId, trackingPos }) => {
  const { currentUser } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const center: [number, number] = currentUser?.location 
    ? [currentUser.location.lat, currentUser.location.lng] 
    : [28.6139, 77.2090]; // Default New Delhi

  return (
    <div style={{ height: "100%", width: "100%", position: "relative" }}>
      <MapContainer 
        center={center} 
        zoom={15} 
        style={{ height: "100%", width: "100%" }}
        className="z-0"
        zoomControl={false}
      >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* User Current Location */}
      {currentUser?.location && (
        <Marker position={[currentUser.location.lat, currentUser.location.lng]} icon={userIcon}>
          <Popup>Your Location</Popup>
        </Marker>
      )}

      {/* Active Alerts from Firestore */}
      {alerts.map(alert => {
        // Volunteers see volunteer requests + emergencies. Responders see emergencies.
        const isVolunteerRequest = alert.type === 'Volunteer Request';
        if (isVolunteerRequest && !currentUser?.isVolunteer) return null;
        
        return (
          <Marker 
            key={alert.id} 
            position={[alert.userLocation.lat, alert.userLocation.lng]} 
            icon={getEmergencyIcon(alert.severity, alert.type)}
          >
            <Popup>
              <div className="font-bold flex items-center gap-1">
                <span className="capitalize">{alert.type}</span>
              </div>
              <div className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                {isVolunteerRequest ? 'Community Help Needed' : `${alert.severity} Priority`}
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Recommended places (if needed) */}
      {nearbyPlaces.map(place => (
        <Marker 
          key={place.id} 
          position={[place.lat, place.lng]} 
          icon={recommendationIcon(place.type)}
        >
          <Popup>
            <div className="font-bold text-xs">{place.name}</div>
            <div className="text-[10px] text-gray-500">{place.distance} • ⭐ {place.rating}</div>
          </Popup>
        </Marker>
      ))}

      {/* Responder tracking position */}
      {trackingPos && (
        <Marker position={trackingPos} icon={typeof window !== 'undefined' ? L.divIcon({
          className: 'responder-marker',
          html: '<div style="width:28px;height:28px;background:linear-gradient(135deg,#10B981,#059669);border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(16,185,129,0.5);display:flex;align-items:center;justify-content:center;font-size:12px;">🚗</div>',
          iconSize: [28, 28],
        }) : undefined}>
          <Popup>Responder en route</Popup>
        </Marker>
      )}

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
          background: #111827 !important; /* Dark theme map background */
        }
        /* Make map tiles dark mode filtering */
        .leaflet-layer,
        .leaflet-control-zoom-in,
        .leaflet-control-zoom-out,
        .leaflet-control-attribution {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
        }
      `}</style>
    </MapContainer>
    </div>
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
