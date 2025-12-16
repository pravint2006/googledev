'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useFarmStore } from '@/hooks/use-farm-store';
import { PlusCircle, Tractor } from 'lucide-react';
import FarmCard from '@/components/farm-card';
import { Skeleton } from '@/components/ui/skeleton';

export default function FarmsPage() {
  const { farms, isLoading } = useFarmStore();

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
            <Tractor className="h-8 w-8" />
            My Farms
          </h1>
          <p className="text-muted-foreground">
            Manage all your farms and their gate valves from here.
          </p>
        </div>
        <Button asChild>
          <Link href="/farms/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Farm
          </Link>
        </Button>
      </div>
      
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-lg" />
          ))}
        </div>
      ) : farms.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {farms.map((farm) => (
            <FarmCard key={farm.id} farm={farm} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <Tractor className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No farms found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Get started by adding a new farm.
          </p>
          <div className="mt-6">
            <Button asChild>
              <Link href="/farms/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Farm
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
