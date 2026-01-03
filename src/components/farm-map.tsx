
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

// Custom SVG path for a valve icon
const valvePath = 'M-10,0 a10,10 0 1,0 20,0 a10,10 0 1,0 -20,0 M-12,-2 h24 v4 h-24 z M-2,-12 v24 h4 v-24 z';

// Custom SVG path for a motor icon (Circle with 'M')
const motorPath = 'M-10,0 a10,10 0 1,0 20,0 a10,10 0 1,0 -20,0 M-6,-5 h2 l2,5 2,-5 h2 v10 h-2 v-4 l-2,4 -2,-4 v4 h-2 z';


export default function FarmMap({ devices, center }: FarmMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

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
        {devices.map((device, index) => {
            const isValve = device.type === 'valve';
            const isActive = isValve ? (device as GateValve).status === 'open' : (device as Motor).status === 'on';

            return (
              <Marker
                key={device.id}
                position={device.position}
                title={device.name}
                icon={{
                  path: isValve ? valvePath : motorPath,
                  fillColor: '#ffffff',
                  fillOpacity: 1,
                  strokeColor: isActive ? (isValve ? '#3b82f6' : '#fb923c') : '#a1a1aa',
                  strokeWeight: 2,
                  scale: 0.8,
                  labelOrigin: new google.maps.Point(0, 25),
                }}
                label={{
                  text: device.name,
                  color: '#ffffff',
                  fontWeight: 'bold',
                  className: 'map-label' 
                }}
              />
            );
        })}
    </GoogleMap>
  );
}

    