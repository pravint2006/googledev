
'use client';

import { useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Libraries } from '@react-google-maps/api';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertTriangle } from 'lucide-react';
import { type GateValve, type Motor } from '@/lib/data';
import { GeoPoint } from 'firebase/firestore';

type Device = (GateValve & { type: 'valve' }) | (Motor & { type: 'motor' });

interface FarmMapProps {
  devices: Device[];
  center: GeoPoint;
}

const libraries: Libraries = ['places'];

export default function FarmMap({ devices, center }: FarmMapProps) {
  const apiKey = "AIzaSyAugxfHDgayygJevNNKsEbCB1pCtPnFr28";

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries,
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
    mapTypeId: 'hybrid',
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
        {devices.map((device, index) => (
          <Marker
            key={device.id}
            position={device.position}
            label={(index + 1).toString()}
            title={device.name}
            icon={{
              path: device.type === 'valve' ? window.google.maps.SymbolPath.CIRCLE : window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: device.type === 'valve' ? 8 : 6,
              fillColor: device.type === 'valve' ? '#4ade80' : '#facc15', // green for valve, yellow for motor
              fillOpacity: 1,
              strokeWeight: 1,
              rotation: device.type === 'motor' ? Math.random() * 360 : 0
            }}
          />
        ))}
    </GoogleMap>
  );
}

    