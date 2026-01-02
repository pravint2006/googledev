
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { SunIcon, CloudIcon, CloudRainIcon, CloudLightningIcon, CloudFogIcon, UmbrellaIcon } from './weather-icons';
import { Loader2, Wind, Droplets, AlertCircle, MapPin, LocateFixed, Edit } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { type WeatherOutput, getWeather, type DailyForecast, type WeatherInput, type HourlyForecast } from '@/ai/flows/weather-flow';
import { Skeleton } from './ui/skeleton';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './ui/carousel';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';


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
  const [view, setView] = useState<ViewState>('loading'); // Start in loading state
  const [error, setError] = useState<string | null>(null);
  const [locationInput, setLocationInput] = useState('');
  const [pincodeInput, setPincodeInput] = useState('');
  const { userProfile, updateUserProfile, isLoading: isProfileLoading } = useUserProfile();
  
  useEffect(() => {
    // This effect runs once when the component mounts and user profile is loaded
    if (!isProfileLoading) {
      if (userProfile?.lastWeatherLocation) {
        // If a location is saved, fetch weather for it
        fetchWeather(userProfile.lastWeatherLocation);
      } else {
        // Otherwise, show the initial selection screen
        setView('initial');
      }
    }
  }, [isProfileLoading, userProfile]);

  const fetchWeather = (input: WeatherInput) => {
    setView('loading');
    setError(null);
    getWeather(input)
      .then((weatherData) => {
        setWeather(weatherData);
        setView('weather');
        // Save the successfully fetched location to the user's profile
         if (input.lat && input.lon) {
            updateUserProfile({ lastWeatherLocation: { ...input, location: weatherData.city } });
        } else {
            updateUserProfile({ lastWeatherLocation: { ...input, location: weatherData.city } });
        }
      })
      .catch(e => {
        console.error(e);
        setError('Could not fetch weather data. The AI model might be busy. Please try again in a moment.');
        setView('error');
      });
  };

  const resetWidget = () => {
    setWeather(null);
    setError(null);
    setLocationInput('');
    setPincodeInput('');
    setView('initial');
  }

  const fetchWeatherByCoords = (lat: number, lon: number) => {
    const input: WeatherInput = { location: 'current location', lat, lon };
    fetchWeather(input);
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
    const input: WeatherInput = { location: locationInput, pincode: pincodeInput };
    fetchWeather(input);
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
        const currentDate = new Date();

        return (
            <div className="relative text-foreground p-6 space-y-8">
                <div className='flex justify-between items-start'>
                    <div>
                        <p className="font-semibold text-primary">{format(currentDate, 'eeee, MMMM d, yyyy')}</p>
                        <CardTitle className="font-headline text-2xl">{weather.city}</CardTitle>
                        <CardDescription className='text-muted-foreground font-semibold'>{weather.district} - {weather.pincode}</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={resetWidget}>
                        Change
                    </Button>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 justify-between">
                    <div className="flex items-center gap-4">
                        <CurrentWeatherIcon className="w-20 h-20 text-primary" />
                        <div>
                        <p className="text-7xl font-bold">{Math.round(weather.currentTemp)}°</p>
                        <p className="text-muted-foreground font-medium">{weather.condition}</p>
                        </div>
                    </div>
                    <div className="text-left sm:text-right">
                       <p className="text-lg">Feels like {Math.round(weather.feelsLike)}°</p>
                       <p className="text-muted-foreground">Wind: {weather.windSpeed} km/h</p>
                       <p className="text-muted-foreground">Humidity: {weather.humidity}%</p>
                    </div>
                </div>

                 <div>
                    <h3 className="font-semibold mb-4 text-foreground/90 border-t pt-6">24-Hour Forecast</h3>
                    <Carousel opts={{ align: "start" }} className="w-full">
                        <CarouselContent>
                            {weather.hourlyForecast.map((hour, index) => {
                                const HourIcon = weatherIcons[hour.condition] || SunIcon;
                                return (
                                <CarouselItem key={index} className="basis-1/4 sm:basis-1/5 md:basis-1/6 lg:basis-1/8">
                                    <HourlyForecastCard hour={hour} HourIcon={HourIcon} />
                                </CarouselItem>
                                );
                            })}
                        </CarouselContent>
                        <CarouselPrevious className='-left-4' />
                        <CarouselNext className='-right-4' />
                    </Carousel>
                </div>

                 <div>
                <h3 className="font-semibold mb-4 text-foreground/90 border-t pt-6">7-Day Forecast</h3>
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

function HourlyForecastCard({ hour, HourIcon }: { hour: HourlyForecast, HourIcon: React.FC<React.SVGProps<SVGSVGElement>> }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 p-3 text-center rounded-lg bg-muted/50 h-full">
            <p className="text-sm font-medium text-muted-foreground">{hour.time}</p>
            <HourIcon className="w-8 h-8 text-primary" />
            <p className="text-lg font-bold">{Math.round(hour.temp)}°</p>
            {hour.rainProbability > 0 && (
                <div className="flex items-center gap-1 text-xs text-primary font-semibold">
                    <UmbrellaIcon className="h-3 w-3" />
                    <span>{hour.rainProbability}%</span>
                </div>
            )}
        </div>
    )
}

function ForecastRow({ day, DayIcon }: { day: DailyForecast, DayIcon: React.FC<React.SVGProps<SVGSVGElement>> }) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div 
        className={cn(
            "flex justify-between items-center text-base font-medium p-2 rounded-md transition-colors",
            isHovered && "bg-muted/50"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
    >
        <span className="w-1/3">{day.day}</span>
        <div className="w-1/3 flex items-center justify-center gap-2 text-primary">
            <DayIcon className="w-6 h-6" />
        </div>
        <span className="w-1/3 text-right text-muted-foreground">{Math.round(day.temp)}°</span>
    </div>
  );
}

function WeatherLoadingSkeleton() {
    return (
        <div className="p-6">
            <CardHeader className='p-0 mb-8'>
                <Skeleton className="h-5 w-56" />
                <Skeleton className="h-7 w-48 mt-1" />
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

            <div className='my-8'>
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="flex gap-4">
                    <Skeleton className="h-28 w-20 rounded-lg" />
                    <Skeleton className="h-28 w-20 rounded-lg" />
                    <Skeleton className="h-28 w-20 rounded-lg" />
                    <Skeleton className="h-28 w-20 rounded-lg" />
                    <Skeleton className="h-28 w-20 rounded-lg" />
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
