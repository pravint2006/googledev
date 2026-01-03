
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useFarmStore } from '@/hooks/use-farm-store';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Tractor, MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import FarmCard from '@/components/farm-card';
import WeatherWidget from '@/components/weather-widget';
import CropRecommendations from '@/components/crop-recommendations';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { farms, isLoading } = useFarmStore();
  const router = useRouter();

  const handleCropSelect = (crop: any) => {
    router.push(`/advisor?crop=${encodeURIComponent(crop.name)}`);
  };

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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <WeatherWidget />
          <CropRecommendations onCropSelect={handleCropSelect} />
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Get Crop Advice
            </h2>
            <p className="text-muted-foreground mb-4">
              Click on any crop card above to chat with our AI advisor for personalized recommendations.
            </p>
            <Button asChild className="w-full">
              <Link href="/advisor">
                <MessageSquare className="mr-2 h-4 w-4" />
                Open AI Advisor
              </Link>
            </Button>
          </div>
        </div>
        <div className="lg:col-span-4">
          {isLoading ? (
            <div className="space-y-6">
                <Skeleton className="h-8 w-32 rounded" />
                <div className="grid grid-cols-1 gap-4">
                    <Skeleton className="h-36 rounded-lg" />
                    <Skeleton className="h-36 rounded-lg" />
                </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight text-gray-900">Your Farms</h2>
              {farms.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-8 text-center border-l-4 border-l-green-500">
                  <Tractor className="h-12 w-12 text-gray-400 mb-3" />
                  <CardTitle className="text-lg text-gray-900 mb-1">No Farms Yet</CardTitle>
                  <CardDescription className="text-sm text-gray-500 mb-4">
                    Get started by adding your first farm
                  </CardDescription>
                  <Button asChild size="sm" className="bg-green-600 hover:bg-green-700">
                    <Link href="/farms/new">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Farm
                    </Link>
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {farms.map((farm) => (
                    <FarmCard key={farm.id} farm={farm} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
