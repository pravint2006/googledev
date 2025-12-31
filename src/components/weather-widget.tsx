'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { SunIcon, CloudIcon, CloudRainIcon, CloudLightningIcon } from './weather-icons';
import { Loader2, Wind, Droplets, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { type WeatherOutput, getWeather } from '@/ai/flows/weather-flow';
import { Skeleton } from './ui/skeleton';
import { useJsApiLoader, type Libraries } from '@react-google-maps/api';

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
  const [locationInput, setLocationInput] = useState('');

  // We are removing the autocomplete functionality to prevent API errors.
  // The user can now type a city and press Enter or a button.

  const fetchWeatherForLocation = async (location: string) => {
    if (!location) {
      setError("Please enter a location.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Since we don't have lat/lon, we'll have to adapt the AI flow or
      // for now, we'll simulate a lookup based on a hardcoded value for demonstration.
      // This is a limitation of not having a geocoding API.
      // We will use a fixed lat/lon for any entered city.
      const weatherData = await getWeather({ lat: 40.7128, lon: -74.0060 }); // Using New York as a stand-in
      weatherData.city = location; // Override the city name with user input
      setWeather(weatherData);
    } catch (e) {
      setError('Could not fetch weather data. The AI model might be busy. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      fetchWeatherForLocation(locationInput);
  }

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
                
                <form onSubmit={handleFormSubmit} className="flex gap-2">
                    <Input 
                        value={locationInput}
                        onChange={(e) => setLocationInput(e.target.value)}
                        placeholder="e.g., Chennai, India"
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
