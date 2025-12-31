
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { SunIcon, CloudIcon, CloudRainIcon, CloudLightningIcon } from './weather-icons';
import { Loader2, Wind, Droplets, AlertCircle, MapPin, Building, LocateFixed, Edit } from 'lucide-react';
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

type ViewState = 'initial' | 'form' | 'loading' | 'weather' | 'error';

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherOutput | null>(null);
  const [view, setView] = useState<ViewState>('initial');
  const [error, setError] = useState<string | null>(null);
  const [locationInput, setLocationInput] = useState('');
  const [pincodeInput, setPincodeInput] = useState('');

  const resetWidget = () => {
    setWeather(null);
    setError(null);
    setLocationInput('');
    setPincodeInput('');
    setView('initial');
  }

  const fetchWeatherByCoords = (lat: number, lon: number) => {
    setView('loading');
    setError(null);
    getWeather({ location: 'current location', lat, lon })
      .then(setWeather)
      .then(() => setView('weather'))
      .catch(e => {
        console.error(e);
        setError('Could not fetch weather for your location. The AI model might be busy. Please try again.');
        setView('error');
      });
  };

  const handleUseLocation = () => {
    setView('loading');
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setView('error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setError('Unable to retrieve your location. Please ensure location services are enabled.');
        setView('error');
      }
    );
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationInput || !pincodeInput) {
      setError("Please enter a place name and a pincode.");
      setView('error');
      return;
    }
    setView('loading');
    setError(null);
    getWeather({ location: locationInput, pincode: pincodeInput })
      .then(setWeather)
      .then(() => setView('weather'))
      .catch(e => {
        console.error(e);
        setError('Could not fetch weather data. Please check your input and try again.');
        setView('error');
      });
  };

  const renderContent = () => {
    switch (view) {
      case 'loading':
        return <WeatherLoadingSkeleton />;
      
      case 'weather':
        if (!weather) {
            setError('An unexpected error occurred while displaying the weather.');
            setView('error');
            return null;
        }
        const CurrentWeatherIcon = weatherIcons[weather.condition] || SunIcon;
        return (
            <>
                <CardHeader>
                    <div className='flex justify-between items-start'>
                    <div>
                        <CardTitle className="font-headline">Weather in {weather.city}</CardTitle>
                        <CardDescription>Current conditions and 3-day forecast.</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={resetWidget}>
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
                            <Building className="h-5 w-5 text-muted-foreground" />
                            <span>{weather.district}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-muted-foreground" />
                            <span>{weather.pincode}</span>
                        </div>
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
            </>
        );

      case 'form':
      case 'error':
        return (
             <>
                <CardHeader>
                    <CardTitle className="font-headline">Weather Forecast</CardTitle>
                    <CardDescription>Enter an Indian pincode and place name.</CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <p>{error}</p>
                        </div>
                    )}
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                        <div className='flex gap-2'>
                            <Input 
                                value={pincodeInput}
                                onChange={(e) => setPincodeInput(e.target.value)}
                                placeholder="Pincode (e.g., 642203)"
                                className="w-1/3"
                            />
                            <Input 
                                value={locationInput}
                                onChange={(e) => setLocationInput(e.target.value)}
                                placeholder="Place name (e.g., Thungavi)"
                                className="w-2/3"
                            />
                        </div>
                        <div className='flex items-center gap-2'>
                            <Button type="submit" className='w-full'>Get Weather</Button>
                            <Button type="button" variant="outline" onClick={resetWidget}>Back</Button>
                        </div>
                    </form>
                </CardContent>
             </>
        );

      case 'initial':
      default:
        return (
             <>
                <CardHeader>
                    <CardTitle className="font-headline">Weather Forecast</CardTitle>
                    <CardDescription>How would you like to find the weather?</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4">
                     <Button className="w-full" onClick={() => { setView('form'); setError(null); }}>
                        <Edit /> Enter Indian Pincode
                    </Button>
                    <Button className="w-full" variant="outline" onClick={handleUseLocation}>
                        <LocateFixed /> Use Current Location
                    </Button>
                </CardContent>
             </>
        );
    }
  }

  return (
     <Card className="bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-slate-900 dark:via-slate-800 dark:to-emerald-950">
      {renderContent()}
    </Card>
  );
}

function WeatherLoadingSkeleton() {
    return (
        <>
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
        </>
    );
}
