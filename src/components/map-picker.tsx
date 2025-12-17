
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { MapPin, AlertTriangle, Loader2, Save } from 'lucide-react';
import { GeoPoint } from 'firebase/firestore';
import { type GateValve } from '@/lib/data';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';

interface MapPickerProps {
  valves: Omit<GateValve, 'id' | 'status'>[];
  totalValves: number;
  onFinalSubmit: (valves: Omit<GateValve, 'id' | 'status'>[]) => void;
  isSubmitting: boolean;
  initialCenter?: { lat: number; lng: number };
}

export default function MapPicker({
  valves: initialValves,
  totalValves,
  onFinalSubmit,
  isSubmitting,
  initialCenter = { lat: 11.1271, lng: 78.6569 }, // Default to Tamil Nadu, India
}: MapPickerProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [valves, setValves] = useState(initialValves);
  const [selectedValveIndex, setSelectedValveIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || "fallback-key-for-dev",
    libraries: ['places'],
  });

  // Effect to reset valves if the total count changes (e.g., user goes back and changes it)
  useEffect(() => {
    setValves([]);
  }, [totalValves]);

  const handleMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (valves.length >= totalValves) {
      toast({
        variant: "destructive",
        title: "All valves placed",
        description: `You have already placed all ${totalValves} valves.`,
      });
      return;
    }
    if (event.latLng) {
      const newValve = {
        name: `Valve ${valves.length + 1}`,
        position: {
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
        },
      };
      setValves(currentValves => [...currentValves, newValve]);
    }
  }, [valves.length, totalValves, toast]);

  const handleValveNameChange = (newName: string) => {
    if (selectedValveIndex !== null) {
      const updatedValves = [...valves];
      updatedValves[selectedValveIndex].name = newName;
      setValves(updatedValves);
    }
  };

  const handleRemoveValve = () => {
    if (selectedValveIndex !== null) {
      const updatedValves = valves.filter((_, index) => index !== selectedValveIndex);
      // Re-label subsequent valves
      for(let i = selectedValveIndex; i < updatedValves.length; i++) {
          if (updatedValves[i].name.startsWith('Valve ')) {
              updatedValves[i].name = `Valve ${i+1}`;
          }
      }
      setValves(updatedValves);
      setSelectedValveIndex(null);
    }
  };

  const handleSubmit = () => {
    if (valves.length < totalValves) {
      toast({
        variant: 'destructive',
        title: 'Valve Placement Incomplete',
        description: `Please place all ${totalValves} valves on the map.`,
      });
      return;
    }
    onFinalSubmit(valves);
  };

  const mapOptions = useMemo<google.maps.MapOptions>(() => ({
    disableDefaultUI: true,
    clickableIcons: false,
    scrollwheel: true,
    zoomControl: true,
    mapTypeId: 'hybrid',
  }), []);

  if (loadError) {
    return (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Map Error</AlertTitle>
            <AlertDescription>
                Google Maps failed to load. This might be due to a missing or invalid API key. Please check the console for details.
            </AlertDescription>
        </Alert>
    );
  }

  if (!isLoaded) {
    return <Skeleton className="w-full h-full" />;
  }

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border relative">
      <GoogleMap
        mapContainerClassName="w-full h-full"
        center={initialCenter}
        zoom={10}
        options={mapOptions}
        onClick={handleMapClick}
      >
        {valves.map((valve, index) => (
          <Marker
            key={index}
            position={valve.position}
            label={(index + 1).toString()}
            onClick={() => setSelectedValveIndex(index)}
          />
        ))}

        {selectedValveIndex !== null && valves[selectedValveIndex] && (
          <InfoWindow
            position={valves[selectedValveIndex].position}
            onCloseClick={() => setSelectedValveIndex(null)}
          >
            <div className="space-y-3 p-2">
              <h3 className="font-bold">{valves[selectedValveIndex].name}</h3>
              <p className="text-xs text-muted-foreground">You can rename this valve below.</p>
              <Input
                value={valves[selectedValveIndex].name}
                onChange={(e) => handleValveNameChange(e.target.value)}
                placeholder="Valve name"
              />
              <Button variant="destructive" size="sm" onClick={handleRemoveValve} className="w-full">
                Remove
              </Button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
      
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
        <div className="flex items-center gap-2 bg-background p-2 px-4 rounded-lg border shadow-lg text-sm">
            <MapPin className="h-5 w-5 text-primary" />
            <p className="font-semibold">Click on the map to place a valve. Placed: {valves.length} / {totalValves}</p>
        </div>
      </div>
       <div className="absolute bottom-4 right-4 z-10">
           <Button onClick={handleSubmit} disabled={isSubmitting} size="lg">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSubmitting ? 'Saving...' : 'Save Farm'}
            </Button>
      </div>
    </div>
  );
}
