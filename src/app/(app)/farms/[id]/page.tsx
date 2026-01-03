
'use client';

import { useFarmStore } from '@/hooks/use-farm-store';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import GateValveStatus from '@/components/gate-valve-status';
import MotorStatus from '@/components/motor-status';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Tractor, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useState } from 'react';
import DeleteFarmDialog from '@/components/delete-farm-dialog';
import FarmMap from '@/components/farm-map';
import DeviceTimerDialog from '@/components/device-timer-dialog';
import { type DeviceTimer, type GateValve, type Motor } from '@/lib/data';

type DeviceType = 'valve' | 'motor';

export default function FarmDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === 'string' ? params.id : '';
  const { getFarmById, toggleValveStatus, toggleMotorStatus, deleteFarm, setDeviceTimer, isLoading } = useFarmStore();
  const farm = getFarmById(id);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [timerDialogState, setTimerDialogState] = useState<{
    isOpen: boolean;
    deviceId: string | null;
    deviceType: DeviceType | null;
    deviceName: string | null;
  }>({ isOpen: false, deviceId: null, deviceType: null, deviceName: null });

  const handleDelete = () => {
    deleteFarm(id);
    router.push('/dashboard');
  };

  const handleSetTimer = (durationMinutes: number) => {
    if (farm && timerDialogState.deviceId && timerDialogState.deviceType) {
      setDeviceTimer(farm.id, timerDialogState.deviceId, timerDialogState.deviceType, durationMinutes);
    }
    setTimerDialogState({ isOpen: false, deviceId: null, deviceType: null, deviceName: null });
  };
  
  const openTimerDialog = (deviceId: string, deviceType: DeviceType, deviceName: string) => {
    setTimerDialogState({ isOpen: true, deviceId, deviceType, deviceName });
  };


  if (isLoading) {
    return <FarmDetailLoadingSkeleton />;
  }

  if (!farm) {
     return (
      <div className="flex flex-col items-center justify-center h-full text-center py-10">
        <Tractor className="w-24 h-24 text-muted-foreground/50 mb-4" />
        <h1 className="text-2xl font-bold font-headline">Farm Not Found</h1>
        <p className="text-muted-foreground max-w-md mt-2">
          We couldn't find the farm you're looking for. It might have been moved or deleted.
        </p>
        <Button asChild className="mt-6">
          <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const openValvesCount = farm.gateValves.filter(v => v.status === 'open').length;

  return (
    <>
      <DeleteFarmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        farmName={farm.name}
      />
      <DeviceTimerDialog
        isOpen={timerDialogState.isOpen}
        onClose={() => setTimerDialogState({ isOpen: false, deviceId: null, deviceType: null, deviceName: null })}
        onConfirm={handleSetTimer}
        deviceName={timerDialogState.deviceName || ''}
      />

      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">{farm.name}</h1>
            <p className="text-muted-foreground">Monitor and control your devices in real-time.</p>
          </div>
          <div className='flex items-center gap-2'>
            <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Farm
            </Button>
          </div>
        </div>
        
        {openValvesCount === 0 && farm.gateValves.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Critical Alert: All Valves Closed</AlertTitle>
            <AlertDescription>
              No gate valves are currently open. This may cause a critical pressure buildup. Please open a valve immediately.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className='font-headline'>Farm Layout</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border bg-muted">
                    <FarmMap devices={[...farm.gateValves.map(v => ({...v, type: 'valve' as const})), ...farm.motors.map(m => ({...m, type: 'motor' as const}))]} center={farm.location} />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-1 space-y-6">
             <Card>
              <CardHeader>
                <CardTitle className='font-headline'>Valve Control</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {farm.gateValves.length > 0 ? (
                  farm.gateValves.map(valve => {
                    const isLastOpenValve = openValvesCount === 1 && valve.status === 'open';
                    return (
                      <GateValveStatus
                        key={valve.id}
                        valve={valve}
                        onToggle={() => toggleValveStatus(farm.id, valve.id)}
                        onSetTimer={() => openTimerDialog(valve.id, 'valve', valve.name)}
                        disabled={isLastOpenValve && valve.status === 'open'}
                      />
                    );
                  })
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Valves</AlertTitle>
                    <AlertDescription>
                      This farm has no gate valves configured.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className='font-headline'>Motor Control</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {farm.motors.length > 0 ? (
                  farm.motors.map(motor => (
                    <MotorStatus
                      key={motor.id}
                      motor={motor}
                      onToggle={() => toggleMotorStatus(farm.id, motor.id)}
                      onSetTimer={() => openTimerDialog(motor.id, 'motor', motor.name)}
                    />
                  ))
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Motors</AlertTitle>
                    <AlertDescription>
                      This farm has no motors configured.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </>
  );
}

function FarmDetailLoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-9 w-1/3 mb-2" />
          <Skeleton className="h-5 w-1/2" />
        </div>
        <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="aspect-video w-full rounded-lg" />
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
