
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { SunIcon, CloudIcon, CloudRainIcon, CloudLightningIcon, CloudFogIcon } from './weather-icons';
import { Loader2, Wind, Droplets, AlertCircle, MapPin, Building, LocateFixed, Edit, Waves } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { type WeatherOutput, getWeather, type DailyForecast } from '@/ai/flows/weather-flow';
import { Skeleton } from './ui/skeleton';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';

const weatherIcons: { [key: string]: React.FC<React.SVGProps<SVGSVGElement>> } = {
  Sunny: SunIcon,
  Cloudy: CloudIcon,
  Rainy: CloudRainIcon,
  Stormy: CloudLightningIcon,
  'Partly Cloudy': CloudIcon,
  Thunderstorms: CloudLightningIcon,
  Hazy: CloudFogIcon,
};

type ViewState = 'initial' | 'form' | 'loading' | 'weather' | 'error';

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherOutput | null>(null);
  const [view, setView] = useState<ViewState>('initial');
  const [error, setError] = useState<string | null>(null);
  const [locationInput, setLocationInput] = useState('');
  const [pincodeInput, setPincodeInput] = useState('');
  
  const bgImage = PlaceHolderImages.find(p => p.id === 'login-background');


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
        setError('Could not fetch weather data. The AI model might be busy. Please try again in a moment.');
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
            <div className="relative text-white">
                {bgImage && (
                    <Image
                    src={bgImage.imageUrl}
                    alt={bgImage.description}
                    fill
                    className="object-cover -z-10 rounded-lg brightness-50"
                    data-ai-hint={bgImage.imageHint}
                    />
                )}
                 <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black/80 rounded-lg -z-9" />

                <div className='p-6 relative z-10'>
                    <div className='flex justify-between items-start'>
                        <div>
                            <CardTitle className="font-headline text-2xl">{weather.city}</CardTitle>
                            <CardDescription className='text-white/80'>{weather.pincode}</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" onClick={resetWidget} className='text-white hover:bg-white/10 hover:text-white'>
                            Change
                        </Button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-6 justify-between my-8">
                        <div className="flex items-center gap-4">
                            <CurrentWeatherIcon className="w-20 h-20" />
                            <div>
                            <p className="text-7xl font-bold">{weather.currentTemp}°</p>
                            <p className="text-white/80 font-medium">{weather.condition}</p>
                            </div>
                        </div>
                        <div className="text-right">
                           <p className="text-lg">Feels like {weather.feelsLike}°</p>
                           <p className="text-white/80">Wind: {weather.windSpeed} km/h</p>
                           <p className="text-white/80">Humidity: {weather.humidity}%</p>
                        </div>
                    </div>

                     <div>
                    <h3 className="font-semibold mb-4 text-white/90 border-t border-white/20 pt-4">3-Day Forecast</h3>
                    <div className="space-y-2">
                        {weather.forecast.map((day, index) => {
                          const DayIcon = weatherIcons[day.condition] || SunIcon;
                          return (
                            <ForecastRow key={index} day={day} DayIcon={DayIcon} />
                          );
                        })}
                    </div>
                    </div>
                </div>
            </div>
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
     <Card className="overflow-hidden">
      {renderContent()}
    </Card>
  );
}

function ForecastRow({ day, DayIcon }: { day: DailyForecast, DayIcon: React.FC<React.SVGProps<SVGSVGElement>> }) {
  return (
    <div className="flex justify-between items-center text-base font-medium p-2 rounded-md hover:bg-white/10 transition-colors">
        <span className="w-1/3">{day.day}</span>
        <div className="w-1/3 flex items-center justify-center gap-2">
           {day.precipitationChance > 0 && <span className='text-sm text-blue-300'>{day.precipitationChance}%</span>}
            <DayIcon className="w-6 h-6" />
        </div>
        <span className="w-1/3 text-right">{day.maxTemp}° / {day.minTemp}°</span>
    </div>
  );
}


function WeatherLoadingSkeleton() {
    return (
        <div className="p-6">
            <CardHeader className='p-0'>
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-5 w-64 mt-1" />
            </CardHeader>
            <div className="flex justify-between my-8">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-20 w-20 rounded-full" />
                    <div>
                        <Skeleton className="h-16 w-32" />
                        <Skeleton className="h-5 w-20 mt-2" />
                    </div>
                </div>
                <div className="space-y-2 text-right">
                    <Skeleton className="h-6 w-24 ml-auto" />
                    <Skeleton className="h-5 w-32 ml-auto" />
                    <Skeleton className="h-5 w-32 ml-auto" />
                </div>
            </div>
            <div>
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-2">
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                </div>
            </div>
        </div>
    );
}
