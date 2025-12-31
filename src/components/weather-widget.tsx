
'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { SunIcon, CloudIcon, CloudRainIcon, CloudLightningIcon } from './weather-icons';
import { Loader2, Wind, Droplets, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { type WeatherOutput, getWeather } from '@/ai/flows/weather-flow';
import { Skeleton } from './ui/skeleton';
import { Autocomplete, useJsApiLoader, type Libraries } from '@react-google-maps/api';

const weatherIcons = {
  Sunny: SunIcon,
  Cloudy: CloudIcon,
  Rainy: CloudRainIcon,
  Stormy: CloudLightningIcon,
};

const libraries: Libraries = ['places'];

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

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
  
  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lon = place.geometry.location.lng();
        fetchWeather(lat, lon);
      } else {
        setError("Could not find location. Please select a valid location from the list.");
      }
    } else {
       setError("Autocomplete is not loaded.");
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
                 {(error || loadError) && (
                    <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <p>{error || 'Google Maps service failed to load. API key might be missing or invalid.'}</p>
                    </div>
                )}
                
                {isLoaded && !loadError && (
                    <div className="flex gap-2">
                        <Autocomplete
                            onLoad={(ac) => setAutocomplete(ac)}
                            onPlaceChanged={onPlaceChanged}
                            options={{ types: ['(cities)'] }}
                        >
                            <Input 
                                ref={inputRef}
                                placeholder="e.g., Chennai"
                            />
                        </Autocomplete>
                    </div>
                )}
                 {!isLoaded && !loadError && (
                    <Skeleton className="h-10 w-full" />
                )}
            </CardContent>
        </Card>
     )
  }

  const CurrentWeatherIcon = weatherIcons[weather.condition] || SunIcon;

  return (
    <Card className="bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-slate-900 dark:via-slate-800 dark:to-emerald-950">
      <CardHeader>
        <div className='flex justify-between items-start'>
          <div>
            <CardTitle className="font-headline">Weather in {weather.city}</CardTitle>
            <CardDescription>Current conditions and 3-day forecast.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setWeather(null)}>
            Change Location
          </Button>
        </div>
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
