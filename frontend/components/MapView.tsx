'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix pour les icônes Leaflet avec Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  markers?: Array<{
    position: [number, number];
    title?: string;
    description?: string;
  }>;
  className?: string;
  onLocationSelect?: (lat: number, lng: number) => void;
  route?: [number, number][]; // Polyline lat,lng
  userPosition?: [number, number];
  userAccuracy?: number;
}

function LocationSetter({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  
  return null;
}

export default function MapView({
  center = [14.7167, -17.4677], // Dakar par défaut
  zoom = 13,
  markers = [],
  className = '',
  onLocationSelect,
  route,
  userPosition,
  userAccuracy,
}: MapViewProps) {
  if (typeof window === 'undefined') {
    return <div className={className}>Chargement de la carte...</div>;
  }

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    if (onLocationSelect) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    }
  };

  function MapClickBinder({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
    useMapEvents({
      click: (e) => onSelect(e.latlng.lat, e.latlng.lng),
    });
    return null;
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={`h-full w-full ${className}`}
      style={{ height: '400px', width: '100%' }}
    >
      {onLocationSelect && <MapClickBinder onSelect={onLocationSelect} />}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationSetter center={center} />
      {userPosition && (
        <Marker position={userPosition} icon={new L.Icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
          shadowSize: [41, 41],
        })}>
          <Popup>Votre position</Popup>
        </Marker>
      )}
      {userPosition && userAccuracy && (
        <Circle center={userPosition} radius={userAccuracy} pathOptions={{ color: '#2563eb', opacity: 0.3, fillOpacity: 0.08 }} />
      )}
      {markers.map((marker, index) => (
        <Marker key={index} position={marker.position} icon={new L.Icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
          shadowSize: [41, 41],
        })}>
          {marker.title && (
            <Popup>
              <div>
                <strong>{marker.title}</strong>
                {marker.description && <p>{marker.description}</p>}
              </div>
            </Popup>
          )}
        </Marker>
      ))}
      {route && route.length > 1 && (
        <Polyline 
          positions={route} 
          pathOptions={{
            color: '#2563eb',
            weight: 5,
            opacity: 0.8,
            fillColor: '#2563eb',
            fillOpacity: 0.3,
          }}
        />
      )}
      {/* Fit bounds automatiquement pour englober route et marqueurs */}
      <FitBounds route={route} userPosition={userPosition} markers={markers} />
    </MapContainer>
  );
}

function FitBounds({ route, userPosition, markers }: { route?: [number, number][]; userPosition?: [number, number]; markers: Array<{ position: [number, number] }> }) {
  const map = useMap();
  useEffect(() => {
    const points: [number, number][] = [];
    if (userPosition) points.push(userPosition);
    markers.forEach((m) => points.push(m.position));
    if (route && route.length > 0) points.push(...route);
    if (points.length > 1) {
      const bounds = L.latLngBounds(points.map((p) => L.latLng(p[0], p[1])));
      map.fitBounds(bounds.pad(0.1), { animate: true });
    }
  }, [map, route, userPosition, markers]);
  return null;
}

