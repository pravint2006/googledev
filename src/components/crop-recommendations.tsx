
'use client';

import { useState, useEffect, useMemo } from 'react';
import { getRecommendations } from '@/ai/flows/crop-recommendation-flow';
import { type CropRecommendationInput } from '@/ai/flows/crop-recommendation-types';
import { useUserProfile } from '@/hooks/use-user-profile';
import { CropData } from '@/lib/crops-database';

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
  AlertTriangle,
} from 'lucide-react';
import { useWeatherStore } from '@/hooks/use-weather-store';
import { Button } from './ui/button';
import Link from 'next/link';
import { CropCard } from './crop-card';

// Helper function to determine season
const getSeason = (date: Date) => {
  const month = date.getMonth(); // 0-11
  if (month >= 5 && month <= 9) return 'Kharif'; // June to October
  if (month >= 10 || month <= 2) return 'Rabi'; // November to March
  return 'Summer'; // April, May
};

// Helper function to get month name
const getMonthName = (date: Date) => {
  return date.toLocaleDateString('en-US', { month: 'long' });
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

  const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
  const plantIndex = headers.indexOf('plant');
  const reasonIndex = headers.indexOf('reason');
  const waterIndex = headers.indexOf('waterrequirement');
  const periodIndex = headers.indexOf('plantingperiod');
  
  // Fallback indices if exact match fails
  const finalPlantIndex = plantIndex >= 0 ? plantIndex : 0;
  const finalReasonIndex = reasonIndex >= 0 ? reasonIndex : 1;
  const finalWaterIndex = waterIndex >= 0 ? waterIndex : 2;
  const finalPeriodIndex = periodIndex >= 0 ? periodIndex : 3;
  
  return rows.slice(1).map(row => {
    // Split by comma but handle quoted values
    const values = row.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    
    // Ensure we have enough values
    while (values.length <= Math.max(finalPlantIndex, finalReasonIndex, finalWaterIndex, finalPeriodIndex)) {
      values.push('');
    }
    
    return {
      plant: values[finalPlantIndex] || '',
      reason: values[finalReasonIndex] || '',
      waterRequirement: values[finalWaterIndex] || 'medium',
      plantingPeriod: values[finalPeriodIndex] || 'N/A',
    };
  }).filter(rec => rec.plant && rec.plant.trim()); // Filter out any empty rows
};

interface CropRecommendationsProps {
  onCropSelect?: (crop: CropData) => void;
}

export default function CropRecommendations({ onCropSelect }: CropRecommendationsProps) {
  const { weatherData, loading: weatherLoading } = useWeatherStore();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile();
  
  const [currentMonthCsv, setCurrentMonthCsv] = useState<string | null>(null);
  const [nextMonthCsv, setNextMonthCsv] = useState<string | null>(null);
  
  const [currentMonthLoading, setCurrentMonthLoading] = useState(true);
  const [nextMonthLoading, setNextMonthLoading] = useState(true);
  
  const [currentMonthError, setCurrentMonthError] = useState<string | null>(null);
  const [nextMonthError, setNextMonthError] = useState<string | null>(null);
  
  const [lastFetchDate, setLastFetchDate] = useState<Date | null>(null);
  const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  // Generate recommendations for a specific month
  const generateRecommendationsForMonth = async (
    date: Date,
    setCsv: (csv: string | null) => void,
    setLoading: (loading: boolean) => void,
    setError: (error: string | null) => void
  ) => {
    if (!weatherData) return;

    setLoading(true);
    setError(null);

    try {
      const input: CropRecommendationInput = {
        location: weatherData.locationName,
        season: getSeason(date),
        tempMin: Math.min(...weatherData.daily.temperatureMin),
        tempMax: Math.max(...weatherData.daily.temperatureMax),
        rainfall: getRainfallLevel(
          weatherData.hourly.precipitationProbability
        ),
        soilType: userProfile?.soilType,
        waterSource: userProfile?.waterIrrigation || 'Irrigation',
        waterIrrigation: userProfile?.waterIrrigation,
        waterLevel: userProfile?.waterLevel,
        landOwned: userProfile?.landOwned,
      };
      const response = await getRecommendations(input);
      
      if (response.startsWith('AI_ERROR:')) {
        throw new Error(response.replace('AI_ERROR:', ''));
      }
      
      setCsv(response);
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred.');
      console.error('Error generating crop recommendations:', e);
    } finally {
      setLoading(false);
    }
  };

  // Generate recommendations when weather data or user profile changes
  useEffect(() => {
    if (weatherData && userProfile) {
      const now = new Date();
      
      // Check if we have cached data from today
      if (lastFetchDate && 
          lastFetchDate.getDate() === now.getDate() &&
          lastFetchDate.getMonth() === now.getMonth() &&
          lastFetchDate.getFullYear() === now.getFullYear() &&
          currentMonthCsv && 
          nextMonthCsv) {
        // Use cached data from today
        setCurrentMonthLoading(false);
        setNextMonthLoading(false);
        return;
      }
      
      const currentDate = new Date();
      const nextDate = new Date(currentDate);
      nextDate.setMonth(nextDate.getMonth() + 1);

      generateRecommendationsForMonth(
        currentDate,
        setCurrentMonthCsv,
        setCurrentMonthLoading,
        setCurrentMonthError
      );

      generateRecommendationsForMonth(
        nextDate,
        setNextMonthCsv,
        setNextMonthLoading,
        setNextMonthError
      );
      
      setLastFetchDate(now);
    }
  }, [weatherData, userProfile]);

  const currentMonthRecommendations = useMemo(
    () => parseCsvResponse(currentMonthCsv || ''),
    [currentMonthCsv]
  );

  const nextMonthRecommendations = useMemo(
    () => parseCsvResponse(nextMonthCsv || ''),
    [nextMonthCsv]
  );

  // Show setup prompt if profile is incomplete
  if (!isProfileLoading && userProfile && !userProfile.isProfileComplete) {
    return (
      <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 font-headline text-amber-900 dark:text-amber-100">
            <BrainCircuit className="h-6 w-6" />
            Complete Your Profile
          </CardTitle>
          <CardDescription className="text-amber-800 dark:text-amber-200">
            We need some information about your farm to provide personalized crop recommendations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="default">
            <Link href="/profile">
              Complete Profile Now
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const renderRecommendationSection = (
    title: string,
    recommendations: ParsedRecommendation[],
    isLoading: boolean,
    error: string | null
  ) => {
    if (isLoading) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }

    if (error) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">{title}</CardTitle>
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
      return null;
    }

    return (
      <Card className="bg-card/70 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 font-headline">
            <BrainCircuit className="h-6 w-6 text-primary" />
            {title}
          </CardTitle>
          <CardDescription>
            Click on any crop to learn more and chat with AI advisor
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {recommendations.map((rec, index) => (
              <CropCard
                key={index}
                cropName={rec.plant}
                waterRequirement={rec.waterRequirement}
                plantingPeriod={rec.plantingPeriod}
                onSelect={(crop) => {
                  if (onCropSelect) {
                    onCropSelect(crop);
                  }
                }}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const currentDate = new Date();
  const nextDate = new Date(currentDate);
  nextDate.setMonth(nextDate.getMonth() + 1);

  const currentMonthTitle = `${getMonthName(currentDate)} - Best Crops`;
  const nextMonthTitle = `${getMonthName(nextDate)} - Best Crops`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        {renderRecommendationSection(
          currentMonthTitle,
          currentMonthRecommendations,
          currentMonthLoading,
          currentMonthError
        )}
      </div>
      <div>
        {renderRecommendationSection(
          nextMonthTitle,
          nextMonthRecommendations,
          nextMonthLoading,
          nextMonthError
        )}
      </div>
    </div>
  );
}


