
'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  WandSparkles,
  AlertTriangle,
  Droplets,
  Bug,
  Sprout,
  Tractor,
  Info,
} from 'lucide-react';
import {
  getRecommendations,
} from '@/ai/flows/recommendation-flow';
import { type RecommendationResponse } from '@/ai/flows/recommendation-types';
import { useWeatherStore } from '@/hooks/use-weather-store';

const iconMap = {
  Droplets: Droplets,
  Bug: Bug,
  Sprout: Sprout,
  Tractor: Tractor,
  Info: Info,
};

function RecommendationSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-4 w-full mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function AiRecommendations() {
  const { weatherData, loading: weatherLoading } = useWeatherStore();
  const [recommendations, setRecommendations] =
    useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecommendations() {
      if (!weatherData) return;

      setLoading(true);
      setError(null);
      try {
        const result = await getRecommendations({ weather: weatherData });
        setRecommendations(result);
      } catch (e: any) {
        console.error('Failed to get AI recommendations:', e);
        setError(
          'Could not generate AI recommendations at this time. Please try again later.'
        );
      } finally {
        setLoading(false);
      }
    }

    if (!weatherLoading && weatherData) {
      fetchRecommendations();
    } else if (!weatherLoading && !weatherData) {
      // Handle case where weather data fails to load
      setLoading(false);
      setError('Cannot fetch recommendations without weather data.');
    }
  }, [weatherData, weatherLoading]);

  if (loading || weatherLoading) {
    return <RecommendationSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <WandSparkles className="h-6 w-6 text-primary" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!recommendations || recommendations.recommendations.length === 0) {
    return null; // Don't show the card if there's nothing to recommend
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <WandSparkles className="h-6 w-6 text-primary" />
          AI Recommendations
        </CardTitle>
        <CardDescription>
          Personalized advice for your farm based on the latest weather
          forecast.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.recommendations.map((rec) => {
          const Icon = iconMap[rec.icon] || Info;
          return (
            <div key={rec.id} className="flex items-start gap-4">
              <div className="p-2 bg-muted rounded-full">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{rec.title}</p>
                <p className="text-sm text-muted-foreground">
                  {rec.description}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
