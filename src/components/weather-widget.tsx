/**
 * @fileoverview A React component that displays a weather widget.
 *
 * The component uses a combination of client-side and server-side logic
 * to fetch and display weather data. It leverages Genkit for the AI-powered
 * weather fetching flow and integrates with the browser's geolocation API.
 */

'use client';

import { getWeather, WeatherOutput, DailyForecast } from '@/ai/flows/weather-flow';
import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  Sun,
  Umbrella,
} from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Skeleton } from './ui/skeleton';
import { Card, CardContent } from './ui/card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertTriangle } from 'lucide-react';

/**
 * Maps a weather condition string to its corresponding SVG icon component.
 * @param condition The weather condition string (e.g., 'Sunny', 'Cloudy').
 * @returns A React functional component for the weather icon.
 */
function getWeatherIcon(condition: WeatherOutput['condition']) {
  switch (condition) {
    case 'Sunny':
      return Sun;
    case 'Cloudy':
    case 'Partly Cloudy':
      return Cloud;
    case 'Rainy':
      return CloudRain;
    case 'Stormy':
    case 'Thunderstorms':
      return CloudLightning;
    case 'Misty':
    case 'Hazy':
      return CloudFog;
    case 'Snowy':
      return CloudFog; // Placeholder, as Snowy is not in lucide-react
    default:
      return Cloud;
  }
}

/**
 * The main WeatherWidget component.
 * It handles fetching the user's location, running the weather flow,
 * and rendering the weather information.
 */
export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locationFetched, setLocationFetched] = useState(false);

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const weatherResponse = await getWeather({ lat, lon, location: '' });
        
        // Check if the response contains our custom error structure
        if ('error' in weatherResponse && weatherResponse.error) {
          setError((weatherResponse as any).message || 'Failed to get weather data.');
        } else {
          setWeather(weatherResponse);
        }
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred.');
      } finally {
        setLocationFetched(true);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeather(latitude, longitude);
        },
        (err) => {
          setError(
            `Geolocation error: ${err.message}. Please enable location services.`
          );
          setLocationFetched(true);
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
      setLocationFetched(true);
    }
  }, []);

  if (!locationFetched) {
    return <WeatherSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Could Not Load Weather</AlertTitle>
            <AlertDescription>
              {error}
              <p className="text-xs mt-2">This may be because the OpenWeatherMap API key is still activating. This can take some time. Please try again later.</p>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!weather) {
    return <WeatherSkeleton />;
  }

  const {
    city,
    district,
    currentTemp,
    feelsLike,
    condition,
    windSpeed,
    humidity,
    forecast,
    hourlyForecast,
  } = weather;

  const MainWeatherIcon = getWeatherIcon(condition);
  const today = new Date();

  return (
    <Card className="shadow-lg">
      <CardContent className="p-6">
      {/* Today's Weather */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-lg font-semibold text-foreground">
            {format(today, 'eeee, MMMM d, yyyy')}
          </p>
          <p className="text-md text-muted-foreground">
            Current location <br /> {city} - {district}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <MainWeatherIcon className="w-24 h-24 text-accent mr-4" />
          <div>
            <p className="text-7xl font-bold text-foreground">{currentTemp}°</p>
            <p className="text-lg text-muted-foreground capitalize">{condition}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg text-foreground">Feels like {feelsLike}°</p>
          <p className="text-md text-muted-foreground">Wind: {windSpeed} km/h</p>
          <p className="text-md text-muted-foreground">Humidity: {humidity}%</p>
        </div>
      </div>

      {/* 24-Hour Forecast */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-foreground mb-4">
          3-Hour Forecast
        </h3>
        <Carousel
          opts={{
            align: 'start',
          }}
          className="w-full"
        >
          <CarouselContent>
            {hourlyForecast.map((hour, index) => {
              const HourIcon = getWeatherIcon(hour.condition);
              return (
                <CarouselItem
                  key={index}
                  className="pt-1 md:basis-1/6 lg:basis-1/8"
                >
                  <div className="p-1">
                    <div className="bg-muted/50 rounded-lg p-4 flex flex-col items-center justify-center text-center">
                      <p className="text-sm font-medium text-foreground">
                        {hour.time}
                      </p>
                      <HourIcon className="w-8 h-8 text-primary my-2" />
                      <p className="text-xl font-bold text-foreground">
                        {hour.temp}°
                      </p>
                      {hour.rainProbability > 0 && (
                        <div className="flex items-center text-xs text-primary mt-1">
                          <CloudRain className="w-3 h-3 mr-1" />
                          <span>{hour.rainProbability}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>

      {/* 5-Day Forecast */}
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-4">
          5-Day Forecast
        </h3>
        <div className="space-y-2">
          {forecast.map((day, index) => {
            const DayIcon = getWeatherIcon(day.condition);
            const isToday =
              format(parseISO(day.date), 'yyyy-MM-dd') ===
              format(today, 'yyyy-MM-dd');
            return (
              <ForecastRow
                key={index}
                day={day}
                DayIcon={DayIcon}
                isToday={isToday}
              />
            );
          })}
        </div>
      </div>
      </CardContent>
    </Card>
  );
}

function ForecastRow({ day, DayIcon, isToday }: { day: DailyForecast, DayIcon: React.FC<React.SVGProps<SVGSVGElement>>, isToday: boolean }) {
  const displayDay = isToday ? 'Today' : format(parseISO(day.date), 'eee');
  const displayDate = format(parseISO(day.date), 'MMM d');

  return (
    <div
      className="flex items-center justify-between bg-muted/50 p-3 rounded-lg hover:bg-muted/80 transition-colors"
    >
      <div className="flex items-center w-1/3">
        <p className="font-semibold w-12">{displayDay}</p>
        <p className="text-sm text-muted-foreground ml-2">{displayDate}</p>
      </div>
      <div className="flex items-center justify-center w-1/3">
        <DayIcon className="w-8 h-8 text-muted-foreground" />
        <p className="ml-2 text-sm capitalize">{day.condition}</p>
      </div>
      <div className="flex items-center justify-end w-1/3">
        <p className="font-semibold">{day.temp}°</p>
      </div>
    </div>
  );
}

function WeatherSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Skeleton className="w-24 h-24 rounded-full mr-4" />
            <div>
              <Skeleton className="h-20 w-32 mb-2" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
          <div className="space-y-2 text-right">
            <Skeleton className="h-6 w-28 ml-auto" />
            <Skeleton className="h-5 w-36 ml-auto" />
            <Skeleton className="h-5 w-32 ml-auto" />
          </div>
        </div>

        <div className="mb-8">
          <Skeleton className="h-7 w-40 mb-4" />
          <div className="flex space-x-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-36 w-24 rounded-lg flex-shrink-0" />
            ))}
          </div>
        </div>

        <div>
          <Skeleton className="h-7 w-40 mb-4" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

    