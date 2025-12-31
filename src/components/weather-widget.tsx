'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { SunIcon, CloudIcon, CloudRainIcon, CloudLightningIcon } from './weather-icons';
import { Loader2, MapPin, Wind, Droplets, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { type WeatherOutput, getWeather } from '@/ai/flows/weather-flow';
import { Skeleton } from './ui/skeleton';

const weatherIcons = {
  Sunny: SunIcon,
  Cloudy: CloudIcon,
  Rainy: CloudRainIcon,
  Stormy: CloudLightningIcon,
};

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualLocation, setManualLocation] = useState('');

  const fetchWeather = async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    try {
      const weatherData = await getWeather({ lat, lon });
      setWeather(weatherData);
    } catch (e) {
      setError('Could not fetch weather data. The AI model might be busy. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };
  
  // This function is a placeholder for a proper geocoding service
  const geocodeManualLocation = () => {
    // For this example, we'll use a simplified mapping.
    // A real implementation would use a geocoding API.
    const locations: Record<string, {lat: number, lon: number}> = {
        'new york': { lat: 40.7128, lon: -74.0060 },
        'london': { lat: 51.5072, lon: -0.1276 },
        'tokyo': { lat: 35.6762, lon: 139.6503 },
        'sydney': { lat: -33.8688, lon: 151.2093 },
        'chennai': { lat: 13.0827, lon: 80.2707 },
    };
    const location = locations[manualLocation.toLowerCase()];
    if (location) {
        fetchWeather(location.lat, location.lon);
    } else {
        setError(`Could not find coordinates for "${manualLocation}". Please try a major city like London or Tokyo.`);
        setLoading(false);
    }
  }

  const handleManualLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualLocation) {
        setLoading(true);
        geocodeManualLocation();
    }
  };

  if (loading) {
    return <WeatherLoadingSkeleton />;
  }
  
  if (!weather) {
     return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Weather Forecast</CardTitle>
                <CardDescription>Enter a location to see the weather.</CardDescription>
            </CardHeader>
            <CardContent>
                 {error && (
                    <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <p>{error}</p>
                    </div>
                )}
                <form onSubmit={handleManualLocationSubmit} className="flex gap-2">
                    <Input 
                        placeholder="e.g., Chennai"
                        value={manualLocation}
                        onChange={(e) => setManualLocation(e.target.value)}
                    />
                    <Button type="submit">Get Weather</Button>
                </form>
            </CardContent>
        </Card>
     )
  }

  const CurrentWeatherIcon = weatherIcons[weather.condition] || SunIcon;

  return (
    <Card className="bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-slate-900 dark:via-slate-800 dark:to-emerald-950">
      <CardHeader>
        <CardTitle className="font-headline">Weather in {weather.city}</CardTitle>
        <CardDescription>Current conditions and 3-day forecast.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-6 justify-between">
          <div className="flex items-center gap-4">
            <CurrentWeatherIcon className="w-20 h-20 text-primary" />
            <div>
              <p className="text-6xl font-bold">{weather.currentTemp}°C</p>
              <p className="text-muted-foreground font-medium">{weather.condition}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm self-start sm:self-center border p-4 rounded-lg bg-background/50">
             <div className="flex items-center gap-2">
                <Wind className="h-5 w-5 text-muted-foreground" />
                <span>{weather.windSpeed} km/h</span>
             </div>
             <div className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-muted-foreground" />
                <span>{weather.humidity}% Humidity</span>
             </div>
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-2 text-foreground/80">3-Day Forecast</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {weather.forecast.map((day, index) => {
              const DayIcon = weatherIcons[day.condition] || SunIcon;
              return (
                <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-background/50 border">
                  <DayIcon className="w-8 h-8 text-primary/80" />
                  <div>
                    <p className="font-semibold">{day.day}</p>
                    <p className="text-muted-foreground">{day.temp}°C</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WeatherLoadingSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-5 w-64 mt-1" />
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex justify-between">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-20 w-20 rounded-full" />
                        <div>
                            <Skeleton className="h-16 w-32" />
                            <Skeleton className="h-5 w-20 mt-2" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-6 w-32" />
                    </div>
                </div>
                <div>
                    <Skeleton className="h-6 w-24 mb-2" />
                    <div className="grid sm:grid-cols-3 gap-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
