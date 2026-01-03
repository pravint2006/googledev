
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { useWeatherStore } from '@/hooks/use-weather-store';
import { getRecommendations } from '@/ai/flows/crop-recommendation-flow';
import type {
  CropRecommendationRequest,
  CropRecommendationResponse,
} from '@/ai/flows/crop-recommendation-types';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { BrainCircuit, Loader2, AlertCircle, Cloudy, Thermometer, Droplets, Compass } from 'lucide-react';

const getSeason = (month: number): 'Kharif' | 'Rabi' | 'Summer' => {
  if (month >= 6 && month <= 9) return 'Kharif'; // June to September
  if (month >= 10 || month <= 2) return 'Rabi'; // October to February
  return 'Summer'; // March to May
};

const getRainfallLevel = (precipitationProbability: number[]): 'low' | 'medium' | 'high' => {
  const avgProbability =
    precipitationProbability.reduce((a, b) => a + b, 0) /
    precipitationProbability.length;
  if (avgProbability < 30) return 'low';
  if (avgProbability < 60) return 'medium';
  return 'high';
};

function RecommendationSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
                <Card key={i} className="bg-muted/50 animate-pulse">
                    <CardHeader>
                        <div className="h-6 w-1/2 bg-muted rounded-md"></div>
                        <div className="h-4 w-3/4 bg-muted rounded-md mt-2"></div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="h-4 w-full bg-muted rounded-md"></div>
                        <div className="h-4 w-2/3 bg-muted rounded-md"></div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export default function CropRecommendations() {
  const { weatherData, loading: weatherLoading } = useWeatherStore();
  const [recommendations, setRecommendations] =
    useState<CropRecommendationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!weatherData) return;

      setIsLoading(true);
      setError(null);

      try {
        const currentMonth = new Date().getMonth() + 1;
        const season = getSeason(currentMonth);
        const tempRange = `${Math.min(...weatherData.daily.temperatureMin)}°C - ${Math.max(...weatherData.daily.temperatureMax)}°C`;
        const rainfall = getRainfallLevel(weatherData.hourly.precipitationProbability);

        const request: CropRecommendationRequest = {
          location: weatherData.locationName,
          season: season,
          temperatureRange: tempRange,
          rainfall: rainfall,
          soilType: 'Loamy', // Hardcoded for now
          waterSource: 'irrigation', // Hardcoded for now
        };

        const response = await getRecommendations(request);
        setRecommendations(response);
      } catch (e: any) {
        setError(e.message || 'An unexpected error occurred.');
        console.error("Failed to get crop recommendations:", e);
      } finally {
        setIsLoading(false);
      }
    };

    if (weatherData) {
      fetchRecommendations();
    } else if (!weatherLoading) {
      // If weather isn't loading and there's no data, we can stop our own loading.
      setIsLoading(false);
    }
  }, [weatherData, weatherLoading]);
  
  // Don't render anything if there's no weather data and it's not loading
  if (!weatherData && !weatherLoading) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <BrainCircuit className="text-primary" />
          AI Crop Advisor
        </CardTitle>
        <CardDescription>
          Based on the 7-day forecast, here are some suitable crops for your location.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <RecommendationSkeleton />
        ) : error ? (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Generating Advice</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        ) : !recommendations || recommendations.recommendations.length === 0 ? (
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Recommendations Available</AlertTitle>
                <AlertDescription>
                    We couldn't generate any crop recommendations at this time.
                </AlertDescription>
            </Alert>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.recommendations.map((rec, index) => (
                <Card key={index} className="bg-muted/50">
                    <CardHeader>
                        <CardTitle className="text-xl font-headline">{rec.plant}</CardTitle>
                        <CardDescription>{rec.reason}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Droplets size={16} className="text-blue-400" />
                            <span>Water: <span className="font-semibold text-foreground capitalize">{rec.waterRequirement}</span></span>
                        </div>
                         <div className="flex items-center gap-2 text-muted-foreground">
                            <Cloudy size={16} className="text-gray-400" />
                            <span>Planting: <span className="font-semibold text-foreground">{rec.plantingPeriod}</span></span>
                        </div>
                    </CardContent>
                </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
