'use client';

import { useFarmStore } from '@/hooks/use-farm-store';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import GateValveStatus from '@/components/gate-valve-status';
import MapPicker from '@/components/map-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Tractor, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useState } from 'react';
import DeleteFarmDialog from '@/components/delete-farm-dialog';

export default function FarmDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === 'string' ? params.id : '';
  const { getFarmById, toggleValveStatus, deleteFarm, isLoading } = useFarmStore();
  const farm = getFarmById(id);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDelete = () => {
    deleteFarm(id);
    router.push('/farms');
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

  return (
    <>
      <DeleteFarmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        farmName={farm.name}
      />
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">{farm.name}</h1>
            <p className="text-muted-foreground">Monitor and control your gate valves in real-time.</p>
          </div>
          <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Farm
          </Button>
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
                  mapTypeId='satellite'
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
        <Skeleton className="h-10 w-32" />
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
