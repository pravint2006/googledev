
'use client';

import { useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertTriangle } from 'lucide-react';
import { type GateValve } from '@/lib/data';
import { GeoPoint } from 'firebase/firestore';

interface FarmMapProps {
  valves: GateValve[];
  center: GeoPoint;
}

export default function FarmMap({ valves, center }: FarmMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || "",
    libraries: ['places'],
  });
  
  const mapCenter = useMemo(() => ({
    lat: center.latitude,
    lng: center.longitude,
  }), [center]);

  const mapOptions = useMemo<google.maps.MapOptions>(() => ({
    disableDefaultUI: true,
    clickableIcons: true,
    scrollwheel: true,
    zoomControl: true,
    mapTypeId: 'satellite',
  }), []);

  if (loadError) {
    return (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Map Error</AlertTitle>
            <AlertDescription>
                Google Maps failed to load. Please check API key and console.
            </AlertDescription>
        </Alert>
    );
  }

  if (!isLoaded) {
    return <Skeleton className="w-full h-full" />;
  }

  return (
    <GoogleMap
        mapContainerClassName="w-full h-full"
        center={mapCenter}
        zoom={15}
        options={mapOptions}
    >
        {valves.map((valve, index) => (
          <Marker
            key={valve.id}
            position={valve.position}
            label={(index + 1).toString()}
            title={valve.name}
          />
        ))}
    </GoogleMap>
  );
}
