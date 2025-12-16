'use client';

import { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { MapPin, X, Loader2 } from 'lucide-react';
import { type GateValve } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Input } from './ui/input';
import { Button } from './ui/button';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

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
  
  const mapCenter = center || (valves.length > 0 ? valves[0].position : defaultCenter);
  const zoomLevel = center && valves.length === 0 ? 8 : 17;

  // If no API key, show a placeholder image instead of a broken map.
  if (!API_KEY) {
    const mapPlaceholder = PlaceHolderImages.find(p => p.id === 'farm-map-placeholder');
    return (
      <div className="relative w-full aspect-video rounded-lg overflow-hidden border bg-muted flex items-center justify-center text-center">
        {mapPlaceholder ? (
            <Image
                src={mapPlaceholder.imageUrl}
                alt={mapPlaceholder.description}
                fill
                className="object-cover"
                data-ai-hint={mapPlaceholder.imageHint}
            />
        ) : (
            <p>Google Maps API Key is missing. Showing placeholder.</p>
        )}
        <div className="absolute inset-0 bg-background/30 flex flex-col items-center justify-center p-4">
             <div className="bg-background/80 p-4 rounded-lg shadow-lg">
                <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <h3 className="font-bold text-lg">Map Unavailable</h3>
                <p className="text-sm text-muted-foreground">
                    A valid Google Maps API key is required to display the map.
                </p>
             </div>
        </div>
      </div>
    );
  }

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
            position={valve.position}
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
            position={activeValve.position}
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
