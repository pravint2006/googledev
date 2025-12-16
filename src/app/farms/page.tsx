'use client';

import { useFarmStore } from '@/hooks/use-farm-store';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PlusCircle, Tractor } from 'lucide-react';
import FarmCard from '@/components/farm-card';
import { Skeleton } from '@/components/ui/skeleton';

export default function FarmsPage() {
  const { farms, isLoading } = useFarmStore();

  if (isLoading) {
    return <FarmsLoadingSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Your Farms</h1>
          <p className="text-muted-foreground">
            A list of all your registered farms.
          </p>
        </div>
        <Button asChild>
          <Link href="/farms/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Farm
          </Link>
        </Button>
      </div>

      {farms.length === 0 ? (
         <Card className="flex flex-col items-center justify-center p-12 text-center">
          <Tractor className="h-16 w-16 text-muted-foreground mb-4" />
          <CardTitle className="mb-2 font-headline">No Farms Yet</CardTitle>
          <CardDescription className="mb-6 max-w-sm">
            It looks like you haven't added any farms. Get started by adding your first one.
          </CardDescription>
          <Button asChild>
            <Link href="/farms/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Your First Farm
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {farms.map((farm) => (
            <FarmCard key={farm.id} farm={farm} />
          ))}
        </div>
      )}
    </div>
  );
}

function FarmsLoadingSkeleton() {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
            <div>
                <Skeleton className="h-9 w-48 mb-2" />
                <Skeleton className="h-5 w-72" />
            </div>
            <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
        </div>
      </div>
    );
  }