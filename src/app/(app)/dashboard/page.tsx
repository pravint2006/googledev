
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useFarmStore } from '@/hooks/use-farm-store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PlusCircle, Tractor } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import FarmCard from '@/components/farm-card';
import { WeatherWidget } from '@/components/weather-widget';

export default function DashboardPage() {
  const { farms, isLoading } = useFarmStore();

  if (isLoading) {
    return <DashboardLoadingSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your farms and local weather.
          </p>
        </div>
        <Button asChild>
          <Link href="/farms/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Farm
          </Link>
        </Button>
      </div>

      <WeatherWidget />

      <h2 className="text-2xl font-bold tracking-tight font-headline border-t pt-8">Your Farms</h2>

      {farms.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center mt-10">
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {farms.map((farm) => (
            <FarmCard key={farm.id} farm={farm} />
          ))}
        </div>
      )}
    </div>
  );
}

function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-72" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <Skeleton className="h-60 w-full" />
       <div className="border-t pt-8">
         <Skeleton className="h-8 w-32 mb-6" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-40 rounded-lg" />
            <Skeleton className="h-40 rounded-lg" />
            <Skeleton className="h-40 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
