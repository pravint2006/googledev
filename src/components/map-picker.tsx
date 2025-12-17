
'use client';

import { useState, useMemo, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { MapPin, AlertTriangle } from 'lucide-react';
import { GeoPoint } from 'firebase/firestore';

interface MapPickerProps {
  onLocationSelect: (location: GeoPoint) => void;
  initialCenter?: { lat: number; lng: number };
}

export default function MapPicker({
  onLocationSelect,
  initialCenter = { lat: 34.0522, lng: -118.2437 }, // Default to Los Angeles
}: MapPickerProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || "",
    libraries: ['places'],
  });

  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const newPosition = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      };
      setMarkerPosition(newPosition);
      onLocationSelect(new GeoPoint(newPosition.lat, newPosition.lng));
    }
  };

  const mapOptions = useMemo<google.maps.MapOptions>(() => ({
    disableDefaultUI: true,
    clickableIcons: false,
    scrollwheel: true,
    mapId: 'e9e9e9e9e9e9e9e9',
  }), []);


  if (loadError) {
    return (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Map Error</AlertTitle>
            <AlertDescription>
                Google Maps failed to load. This might be due to a missing or invalid API key. Please check the developer console for more details.
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
        {markerPosition && <Marker position={markerPosition} />}
      </GoogleMap>
      {!markerPosition && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 pointer-events-none">
          <div className="flex items-center gap-2 bg-background p-3 rounded-lg border shadow-lg">
            <MapPin className="h-5 w-5 text-primary" />
            <p className="font-semibold">Click on the map to set the farm location</p>
          </div>
        </div>
      )}
    </div>
  );
}
