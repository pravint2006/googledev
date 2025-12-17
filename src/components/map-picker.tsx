'use client';

import { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { MapPin, X, Loader2 } from 'lucide-react';
import { type GateValve, isGeoPoint } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { GeoPoint } from 'firebase/firestore';

interface MapPickerProps {
  isEditable: boolean;
  valves: GateValve[];
  setValves?: (valves: GateValve[]) => void;
  valveCount?: number;
  mapImageUrl?: string;
  mapImageHint?: string;
  mapTypeId?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
  center?: { lat: number; lng: number };
}

const containerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 11.1271,
  lng: 78.6569,
};

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
console.log('Using Google Maps API Key:', API_KEY ? 'Loaded' : 'Not Loaded or Empty');


export default function MapPicker({
  isEditable,
  valves,
  setValves,
  valveCount,
  mapTypeId = 'roadmap',
  center,
}: MapPickerProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: API_KEY,
    libraries: ['marker'],
  });

  const [activeValve, setActiveValve] = useState<GateValve | null>(null);

  const getPosition = (
    position: { lat: number; lng: number } | GeoPoint
  ): { lat: number; lng: number } => {
    if (isGeoPoint(position)) {
      return { lat: position.latitude, lng: position.longitude };
    }
    return position;
  };
  
  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (!isEditable || !setValves || (valveCount !== undefined && valves.length >= valveCount) || !e.latLng) {
      return;
    }

    const newValve: GateValve = {
      id: `new-valve-${Date.now()}`,
      name: `Valve ${valves.length + 1}`,
      status: 'closed',
      position: { lat: e.latLng.lat(), lng: e.latLng.lng() },
    };
    setValves([...valves, newValve]);
  };

  const handleValveNameChange = (id: string, newName: string) => {
    if (!setValves) return;
    setValves(valves.map(v => v.id === id ? { ...v, name: newName } : v));
     setActiveValve(v => v && v.id === id ? { ...v, name: newName } : v);
  };
  
  const removeValve = (id: string) => {
    if (!setValves) return;
    setValves(valves.filter(v => v.id !== id));
    setActiveValve(null);
  };

  const getMarkerIcon = useCallback((status: 'open' | 'closed') => {
      if (typeof window === 'undefined' || !window.google) return undefined;
      return {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: status === 'open' ? '#22c55e' : '#ef4444',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      };
  }, []);
  
  const mapCenter = center || (valves.length > 0 ? getPosition(valves[0].position) : defaultCenter);
  const zoomLevel = center && valves.length === 0 ? 8 : 17;

  if (loadError) {
    return <div className='text-center p-4'>Error loading maps. Please ensure the Google Maps API key is configured correctly.</div>;
  }

  if (!isLoaded) {
    return (
      <div className="relative w-full aspect-video rounded-lg overflow-hidden border bg-muted flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-4">Loading Map...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden border bg-muted">
       <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={zoomLevel}
        mapTypeId={mapTypeId}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          mapTypeId: mapTypeId
        }}
        onClick={handleMapClick}
      >
        {valves.map(valve => (
          <Marker
            key={valve.id}
            position={getPosition(valve.position)}
            onClick={() => setActiveValve(valve)}
            icon={getMarkerIcon(valve.status)}
            label={{
                text: 'V',
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold',
            }}
          />
        ))}

        {activeValve && (
          <InfoWindow
            position={getPosition(activeValve.position)}
            onCloseClick={() => setActiveValve(null)}
          >
            <div className="w-60 p-1">
              {isEditable ? (
                 <div className="grid gap-2">
                    <h4 className="font-medium leading-none text-base">{activeValve.name}</h4>
                    <p className="text-xs text-muted-foreground">
                        You can rename this valve below.
                    </p>
                    <Input 
                        id="name" 
                        value={activeValve.name}
                        onChange={(e) => handleValveNameChange(activeValve.id, e.target.value)}
                        className="col-span-2 h-8"
                    />
                    <Button variant="destructive" size="sm" onClick={() => removeValve(activeValve.id)} className="mt-2">
                        <X className="h-4 w-4 mr-1" /> Remove
                    </Button>
                </div>
              ) : (
                <div>
                  <h4 className="font-semibold">{activeValve.name}</h4>
                  <p className={cn("text-sm", activeValve.status === 'open' ? 'text-green-600' : 'text-red-600')}>
                    Status: {activeValve.status.charAt(0).toUpperCase() + activeValve.status.slice(1)}
                  </p>
                </div>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
      {isEditable && (
        <div className="absolute top-2 left-2 bg-background/80 text-foreground px-3 py-1.5 rounded-lg text-sm font-medium shadow-md">
            Click on the map to place a valve. Placed: {valves.length} / {valveCount}
        </div>
      )}
    </div>
  );
}
