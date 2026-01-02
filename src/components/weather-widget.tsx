
'use client';

import { getWeather, WeatherOutput, DailyForecast, HourlyForecast } from '@/ai/flows/weather-flow';
import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

import {
  CloudIcon,
  CloudFogIcon,
  CloudLightningIcon,
  CloudRainIcon,
  SunIcon,
  WindIcon,
} from '@/components/weather-icons';
import { Skeleton } from './ui/skeleton';
import { Card, CardContent } from './ui/card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertTriangle, Droplets, Thermometer, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';

/**
 * Maps a weather condition string to its corresponding SVG icon component.
 * @param condition The weather condition string (e.g., 'Sunny', 'Cloudy').
 * @returns A React functional component for the weather icon.
 */
function getWeatherIcon(condition: WeatherOutput['condition'], isDay: boolean = true) {
  switch (condition) {
    case 'Sunny':
      return SunIcon;
    case 'Partly Cloudy':
    case 'Cloudy':
      return CloudIcon;
    case 'Rainy':
      return CloudRainIcon;
    case 'Thunderstorms':
      return CloudLightningIcon;
    case 'Misty':
    case 'Hazy':
    case 'Snowy':
      return CloudFogIcon;
    default:
      return isDay ? SunIcon : CloudIcon;
  }
}

/**
 * The main WeatherWidget component.
 */
export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locationFetched, setLocationFetched] = useState(false);

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const weatherResponse = await getWeather({ lat, lon, location: '' });
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
          setError(`Geolocation error: ${err.message}. Please enable location services.`);
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
    currentTemp,
    condition,
    forecast,
    hourlyForecast,
    windSpeed,
    humidity
  } = weather;

  const MainWeatherIcon = getWeatherIcon(condition);
  const today = new Date();

  return (
    <Card className="bg-[#1e293b] text-white border-slate-700 shadow-xl">
      <CardContent className="p-6">
        <div className="mb-4">
          <p className="text-xl font-semibold">{city}</p>
          <p className="text-sm text-slate-400">{format(today, 'eeee, MMMM d')}</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 mb-6">
            <div className="flex-1 flex items-center">
              <MainWeatherIcon className="w-20 h-20 text-yellow-400 mr-4" />
              <div>
                <p className="text-7xl font-bold">{currentTemp}°C</p>
                <p className="text-lg text-slate-300 capitalize">{condition}</p>
              </div>
            </div>
             <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                <div className="flex items-center gap-2">
                    <Thermometer className="w-5 h-5 text-slate-400"/>
                    <div>
                        <p className="text-slate-400">Humidity</p>
                        <p className="font-semibold">{humidity}%</p>
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    <WindIcon className="w-5 h-5 text-slate-400"/>
                    <div>
                        <p className="text-slate-400">Wind</p>
                        <p className="font-semibold">{windSpeed} km/h</p>
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    <Droplets className="w-5 h-5 text-slate-400"/>
                    <div>
                        <p className="text-slate-400">Precipitation</p>
                        <p className="font-semibold">{hourlyForecast[0]?.rainProbability || 0}%</p>
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-slate-400"/>
                     <div>
                        <p className="text-slate-400">Forecast</p>
                        <p className="font-semibold">{forecast.length}-Day</p>
                    </div>
                </div>
            </div>
        </div>

        <Tabs defaultValue="temperature" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-800/80 mb-4">
                <TabsTrigger value="temperature">Temperature</TabsTrigger>
                <TabsTrigger value="precipitation">Precipitation</TabsTrigger>
                <TabsTrigger value="wind">Wind</TabsTrigger>
            </TabsList>
            <TabsContent value="temperature">
                <ForecastChart data={hourlyForecast} dataKey="temp" unit="°" color="hsl(48, 96%, 58%)" />
            </TabsContent>
            <TabsContent value="precipitation">
                <ForecastChart data={hourlyForecast} dataKey="rainProbability" unit="%" color="hsl(204, 96%, 58%)" />
            </TabsContent>
            <TabsContent value="wind">
                <p className="text-center text-slate-400 py-10">Wind forecast data is not available in the current API integration.</p>
            </TabsContent>
        </Tabs>
        
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-slate-200 mb-2">5-Day Forecast</h3>
          <div className="space-y-1">
            {forecast.map((day, index) => {
              const DayIcon = getWeatherIcon(day.condition);
              const isToday = format(parseISO(day.date), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
              return (
                <ForecastRow key={index} day={day} DayIcon={DayIcon} isToday={isToday} />
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ForecastChart({ data, dataKey, unit, color }: { data: HourlyForecast[], dataKey: keyof HourlyForecast, unit: string, color: string }) {
    return (
        <div className="h-48 w-full">
            <ResponsiveContainer>
                <LineChart data={data} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                    <XAxis 
                        dataKey="time" 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fill: 'hsl(220, 14%, 71%)', fontSize: 12 }} 
                        interval='preserveStartEnd'
                        padding={{ left: 20, right: 20 }}
                    />
                    <YAxis hide={true} domain={['dataMin - 5', 'dataMax + 5']} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(222.2, 84%, 4.9%)',
                            borderColor: 'hsl(217.2, 32.6%, 17.5%)',
                            color: 'white',
                            borderRadius: '0.5rem',
                        }}
                        labelStyle={{ fontWeight: 'bold' }}
                        formatter={(value) => [`${value}${unit}`, null]}
                    />
                    <Line
                        type="monotone"
                        dataKey={dataKey}
                        stroke={color}
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 6, fill: color }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}


function ForecastRow({ day, DayIcon, isToday }: { day: DailyForecast, DayIcon: React.FC<React.SVGProps<SVGSVGElement>>, isToday: boolean }) {
  const displayDay = isToday ? 'Today' : format(parseISO(day.date), 'eee');

  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-700/50 transition-colors">
      <p className="font-semibold w-16">{displayDay}</p>
      <div className="flex items-center gap-2">
        <DayIcon className="w-7 h-7 text-slate-400" />
        <p className="text-sm text-slate-400 capitalize">{day.condition}</p>
      </div>
      <p className="font-semibold text-right w-16">{day.temp}°</p>
    </div>
  );
}


function WeatherSkeleton() {
  return (
    <Card className="bg-[#1e293b] text-white border-slate-700 shadow-xl">
      <CardContent className="p-6">
        <div className="mb-4">
          <Skeleton className="h-7 w-48 bg-slate-700" />
          <Skeleton className="h-5 w-32 mt-2 bg-slate-700" />
        </div>

        <div className="flex flex-col md:flex-row gap-8 mb-6">
          <div className="flex-1 flex items-center">
            <Skeleton className="w-20 h-20 rounded-full bg-slate-700 mr-4" />
            <div>
              <Skeleton className="h-20 w-32 bg-slate-700" />
              <Skeleton className="h-6 w-24 mt-2 bg-slate-700" />
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                    <Skeleton className="w-5 h-5 bg-slate-700"/>
                    <div className='w-full'>
                        <Skeleton className="h-4 w-16 bg-slate-700"/>
                        <Skeleton className="h-5 w-12 mt-1 bg-slate-700"/>
                    </div>
                </div>
            ))}
          </div>
        </div>

        <Tabs defaultValue="temperature" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-800/80 mb-4">
                <TabsTrigger value="temperature">Temperature</TabsTrigger>
                <TabsTrigger value="precipitation">Precipitation</TabsTrigger>
                <TabsTrigger value="wind">Wind</TabsTrigger>
            </TabsList>
            <TabsContent value="temperature">
                <Skeleton className="h-48 w-full bg-slate-700" />
            </TabsContent>
        </Tabs>
        
        <div className="mt-6">
          <Skeleton className="h-7 w-32 mb-2 bg-slate-700" />
          <div className="space-y-1">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg bg-slate-700" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
