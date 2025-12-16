'use client';

import { useFarmStore } from '@/hooks/use-farm-store';
import { useParams, notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import GateValveStatus from '@/components/gate-valve-status';
import MapPicker from '@/components/map-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Tractor } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function FarmDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const { getFarmById, toggleValveStatus, isLoading } = useFarmStore();
  const farm = getFarmById(id);
  
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">{farm.name}</h1>
        <p className="text-muted-foreground">Monitor and control your gate valves in real-time.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className='font-headline'>Farm Layout</CardTitle>
            </CardHeader>
            <CardContent>
              <MapPicker
                isEditable={false}
                valves={farm.gateValves}
                mapImageUrl={farm.mapImageUrl}
                mapImageHint={farm.mapImageHint}
              />
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
                farm.gateValves.map(valve => (
                  <GateValveStatus
                    key={valve.id}
                    valve={valve}
                    onToggle={() => toggleValveStatus(farm.id, valve.id)}
                  />
                ))
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
        </div>
      </div>
    </div>
  );
}

function FarmDetailLoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-9 w-1/3 mb-2" />
        <Skeleton className="h-5 w-1/2" />
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
        </div>
      </div>
    </div>
  );
}
