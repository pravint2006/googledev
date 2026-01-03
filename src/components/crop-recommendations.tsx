
'use client';

import { useState, useEffect, useMemo } from 'react';
import { getRecommendations } from '@/ai/flows/crop-recommendation-flow';
import { type CropRecommendationInput } from '@/ai/flows/crop-recommendation-types';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Skeleton } from './ui/skeleton';
import {
  BrainCircuit,
  Lightbulb,
  AlertTriangle,
  Droplets,
  CalendarDays,
} from 'lucide-react';
import { useWeatherStore } from '@/hooks/use-weather-store';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

// Helper function to determine season
const getSeason = (date: Date) => {
  const month = date.getMonth(); // 0-11
  if (month >= 5 && month <= 9) return 'Kharif'; // June to October
  if (month >= 10 || month <= 2) return 'Rabi'; // November to March
  return 'Summer'; // April, May
};

// Helper function to determine rainfall level
const getRainfallLevel = (precipitationProbs: number[]): string => {
  const avgProbability =
    precipitationProbs.reduce((acc, curr) => acc + curr, 0) /
    precipitationProbs.length;
  if (avgProbability > 60) return 'high';
  if (avgProbability > 30) return 'medium';
  return 'low';
};

function RecommendationSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

interface ParsedRecommendation {
  plant: string;
  reason: string;
  waterRequirement: string;
  plantingPeriod: string;
}

// Function to parse the CSV string from the AI
const parseCsvResponse = (csvString: string): ParsedRecommendation[] => {
  if (!csvString || typeof csvString !== 'string') return [];
  
  const rows = csvString.trim().split('\n');
  if (rows.length < 2) return []; // Expecting header + at least one data row

  const headers = rows[0].split(',').map(h => h.trim());
  const plantIndex = headers.indexOf('plant');
  const reasonIndex = headers.indexOf('reason');
  const waterIndex = headers.indexOf('waterRequirement');
  const periodIndex = headers.indexOf('plantingPeriod');
  
  if (plantIndex === -1 || reasonIndex === -1 || waterIndex === -1 || periodIndex === -1) {
    console.error("CSV headers are missing or incorrect.");
    return [];
  }
  
  return rows.slice(1).map(row => {
    // Basic CSV parsing that handles values with commas if they are quoted
    const values = row.match(/(".*?"|[^,"]+)(?=,\s*,|\s*$)/g) || [];
    const cleanValues = values.map(v => v.trim().replace(/^"|"$/g, ''));
    
    return {
      plant: cleanValues[plantIndex] || '',
      reason: cleanValues[reasonIndex] || '',
      waterRequirement: cleanValues[waterIndex] || 'medium',
      plantingPeriod: cleanValues[periodIndex] || 'N/A',
    };
  }).filter(rec => rec.plant); // Filter out any empty rows
};


export default function CropRecommendations() {
  const { weatherData, loading: weatherLoading } = useWeatherStore();
  const [recommendationCsv, setRecommendationCsv] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateRecommendations = async () => {
      if (!weatherData) return;

      setLoading(true);
      setError(null);

      try {
        const input: CropRecommendationInput = {
          location: weatherData.locationName,
          season: getSeason(new Date()),
          tempMin: Math.min(...weatherData.daily.temperatureMin),
          tempMax: Math.max(...weatherData.daily.temperatureMax),
          rainfall: getRainfallLevel(
            weatherData.hourly.precipitationProbability
          ),
          soilType: 'Loam', // Placeholder
          waterSource: 'Irrigation', // Placeholder
        };
        const response = await getRecommendations(input);
        
        if (response.startsWith('AI_ERROR:')) {
            throw new Error(response.replace('AI_ERROR:', ''));
        }
        
        setRecommendationCsv(response);
      } catch (e: any) {
        setError(e.message || 'An unexpected error occurred.');
        console.error('Error generating crop recommendations:', e);
      } finally {
        setLoading(false);
      }
    };

    if (!weatherLoading && weatherData) {
      generateRecommendations();
    } else if (!weatherLoading && !weatherData) {
      setLoading(false);
    }
  }, [weatherData, weatherLoading]);

  const recommendations = useMemo(() => parseCsvResponse(recommendationCsv || ''), [recommendationCsv]);

  const renderContent = () => {
    if (loading || weatherLoading) {
      return <RecommendationSkeleton />;
    }

    if (error) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 font-headline">
              <BrainCircuit className="h-6 w-6 text-primary" />
              AI Crop Advisor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error Generating Advice</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      );
    }

    if (!recommendations || recommendations.length === 0) {
      return null; // Don't show the card if there are no recommendations
    }

    return (
      <Card className="bg-card/70 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 font-headline">
            <BrainCircuit className="h-6 w-6 text-primary" />
            AI Crop Advisor
          </CardTitle>
          <CardDescription>
            Based on the 7-day forecast, here are some suitable crops for your
            location.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {recommendations.map((rec, index) => (
            <div key={index}>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="p-3 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Lightbulb className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">{rec.plant}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {rec.reason}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                     <Badge variant="outline" className="flex items-center gap-2">
                       <Droplets className="h-3 w-3 text-blue-500" />
                       Water: <span className="font-semibold capitalize">{rec.waterRequirement}</span>
                     </Badge>
                     <Badge variant="outline" className="flex items-center gap-2">
                       <CalendarDays className="h-3 w-3 text-green-500" />
                       Planting: <span className="font-semibold">{rec.plantingPeriod}</span>
                     </Badge>
                  </div>
                </div>
              </div>
              {index < recommendations.length - 1 && (
                  <Separator className="my-4" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

  return <>{renderContent()}</>;
}
