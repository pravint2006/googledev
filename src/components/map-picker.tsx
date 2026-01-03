
'use client';

import { useState, useMemo, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Libraries } from '@react-google-maps/api';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { MapPin, AlertTriangle, Loader2, Save, Tractor, Fan } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Device {
  type: 'valve' | 'motor';
  name: string;
  position: { lat: number, lng: number };
}

interface MapPickerProps {
  devices: Device[];
  totalValves: number;
  totalMotors: number;
  onFinalSubmit: (devices: Device[]) => void;
  isSubmitting: boolean;
  initialCenter?: { lat: number; lng: number };
}

const libraries: Libraries = ['places'];

// Custom SVG path for a valve icon
const valvePath = 'M-10,0 a10,10 0 1,0 20,0 a10,10 0 1,0 -20,0 M-12,-2 h24 v4 h-24 z M-2,-12 v24 h4 v-24 z';

// Custom SVG path for a motor icon (Circle with 'M')
const motorPath = 'M-10,0 a10,10 0 1,0 20,0 a10,10 0 1,0 -20,0 M-6,-5 h2 l2,5 2,-5 h2 v10 h-2 v-4 l-2,4 -2,-4 v4 h-2 z';


export default function MapPicker({
  devices: initialDevices,
  totalValves,
  totalMotors,
  onFinalSubmit,
  isSubmitting,
  initialCenter = { lat: 11.1271, lng: 78.6569 },
}: MapPickerProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
  const [devices, setDevices] = useState(initialDevices);
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState<number | null>(null);
  const [placementMode, setPlacementMode] = useState<'valve' | 'motor'>('valve');
  const { toast } = useToast();
  
  const [mapCenter] = useState(initialCenter);
  const [zoomLevel] = useState(10);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries,
  });
  
  const placedValves = devices.filter(d => d.type === 'valve').length;
  const placedMotors = devices.filter(d => d.type === 'motor').length;

  const handleMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    let limitReached = false;
    let newDeviceName = '';
    
    if (placementMode === 'valve') {
        if (placedValves >= totalValves) {
            limitReached = true;
            toast({ variant: "destructive", title: "All valves placed", description: `You have already placed all ${totalValves} valves.` });
        } else {
            newDeviceName = `Valve ${placedValves + 1}`;
        }
    } else { // motor
        if (placedMotors >= totalMotors) {
            limitReached = true;
            toast({ variant: "destructive", title: "All motors placed", description: `You have already placed all ${totalMotors} motors.` });
        } else {
            newDeviceName = `Motor ${placedMotors + 1}`;
        }
    }

    if (limitReached) return;

    if (event.latLng) {
      const newDevice: Device = {
        type: placementMode,
        name: newDeviceName,
        position: {
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
        },
      };
      setDevices(currentDevices => [...currentDevices, newDevice]);
    }
  }, [placementMode, placedValves, placedMotors, totalValves, totalMotors, toast]);

  const handleDeviceNameChange = (newName: string) => {
    if (selectedDeviceIndex !== null) {
      const updatedDevices = [...devices];
      updatedDevices[selectedDeviceIndex].name = newName;
      setDevices(updatedDevices);
    }
  };

  const handleRemoveDevice = () => {
    if (selectedDeviceIndex !== null) {
      const updatedDevices = devices.filter((_, index) => index !== selectedDeviceIndex);
      setDevices(updatedDevices);
      setSelectedDeviceIndex(null);
    }
  };

  const handleSubmit = () => {
    if (placedValves < totalValves || placedMotors < totalMotors) {
      toast({
        variant: 'destructive',
        title: 'Device Placement Incomplete',
        description: `Please place all ${totalValves} valves and ${totalMotors} motors on the map.`,
      });
      return;
    }
    onFinalSubmit(devices);
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
        center={mapCenter}
        zoom={zoomLevel}
        options={mapOptions}
        onClick={handleMapClick}
      >
        {devices.map((device, index) => (
          <Marker
            key={index}
            position={device.position}
            icon={{
                path: device.type === 'valve' ? valvePath : motorPath,
                fillColor: '#ffffff',
                fillOpacity: 1,
                strokeColor: device.type === 'valve' ? '#4ade80' : '#facc15',
                strokeWeight: 2,
                scale: 0.8
            }}
            onClick={() => setSelectedDeviceIndex(index)}
          />
        ))}

        {selectedDeviceIndex !== null && devices[selectedDeviceIndex] && (
          <InfoWindow
            position={devices[selectedDeviceIndex].position}
            onCloseClick={() => setSelectedDeviceIndex(null)}
          >
            <div className="space-y-3 p-2">
              <h3 className="font-bold">{devices[selectedDeviceIndex].name}</h3>
              <p className="text-xs text-muted-foreground">You can rename this device below.</p>
              <Input
                value={devices[selectedDeviceIndex].name}
                onChange={(e) => handleDeviceNameChange(e.target.value)}
                placeholder="Device name"
              />
              <Button variant="destructive" size="sm" onClick={handleRemoveDevice} className="w-full">
                Remove
              </Button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
      
       <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-background p-2 rounded-lg border shadow-lg text-sm">
        <Tabs defaultValue="valve" onValueChange={(value) => setPlacementMode(value as 'valve' | 'motor')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="valve" disabled={totalValves === 0}>
                <Tractor className="h-4 w-4 mr-2" />
                Valves ({placedValves}/{totalValves})
            </TabsTrigger>
            <TabsTrigger value="motor" disabled={totalMotors === 0}>
                <Fan className="h-4 w-4 mr-2" />
                Motors ({placedMotors}/{totalMotors})
            </TabsTrigger>
          </TabsList>
           <p className="text-xs text-center mt-2 text-muted-foreground">Click on the map to place a {placementMode}.</p>
        </Tabs>
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

    