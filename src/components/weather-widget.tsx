
'use client';

import { useEffect, useState, useRef } from 'react';
import { format } from 'date-fns';
import { useUserProfile } from '@/hooks/use-user-profile';
import { getWeather } from '@/ai/flows/weather-flow';
import { WeatherOutput } from '@/ai/flows/weather-types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Droplet, Wind, Thermometer, MapPin, Search } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WeatherIcon } from './weather-icons';
import { HourlyWeatherChart } from './weather-chart';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { WindChart } from './wind-chart';

function WeatherSkeleton() {
  return (
    <Card className="bg-slate-800/80 text-white border-slate-700/50 p-6 flex flex-col items-center justify-center min-h-[360px] animate-pulse">
        <Loader2 className="h-10 w-10 animate-spin text-slate-400" />
        <p className="mt-4 text-slate-400">Fetching weather data...</p>
    </Card>
  );
}

const libraries: ('places')[] = ['places'];

export default function WeatherWidget() {
  const { userProfile, updateUserProfile } = useUserProfile();
  const [weatherData, setWeatherData] = useState<WeatherOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [citySearch, setCitySearch] = useState('');
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyAugxfHDgayygJevNNKsEbCB1pCtPnFr28",
    libraries,
  });

  const fetchWeather = async (params: { latitude?: number; longitude?: number; city?: string } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWeather(params);
      setWeatherData(data);
      if (data) {
        // When updating profile, use the name returned by our weather flow for consistency
        updateUserProfile({ lastWeatherLocation: { latitude: data.latitude, longitude: data.longitude, city: data.locationName }});
      }
    } catch (e: any) {
      setError(e.message || 'Could not load weather data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Try fetching with last known location from user profile
    if (userProfile?.lastWeatherLocation) {
        if(userProfile.lastWeatherLocation.city) {
            fetchWeather({ city: userProfile.lastWeatherLocation.city });
        } else if (userProfile.lastWeatherLocation.latitude && userProfile.lastWeatherLocation.longitude){
            fetchWeather({ latitude: userProfile.lastWeatherLocation.latitude, longitude: userProfile.lastWeatherLocation.longitude });
        } else {
             // Fallback if profile data is incomplete
            fetchWeather({ city: 'Delhi' });
        }
    } else {
        // 2. Fallback to browser geolocation
        navigator.geolocation.getCurrentPosition(
            (position) => {
                fetchWeather({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            (err) => {
                // 3. If geolocation fails, set a default city (e.g., London)
                console.warn('Geolocation failed:', err.message);
                fetchWeather({ city: 'Delhi' }); // Default to a major city in India
            },
            { timeout: 10000 }
        );
    }
  }, []); // Changed dependency to run only once on initial load

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (citySearch.trim()) {
      fetchWeather({ city: citySearch.trim() });
    }
  };

  const onAutocompleteLoad = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
        const place = autocompleteRef.current.getPlace();
        
        if (place.geometry?.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            const city = place.name;
            setCitySearch(city);
            // Fetch weather using precise coordinates instead of just the name
            fetchWeather({ latitude: lat, longitude: lng });
        } else if (place.name) {
            // Fallback to name search if geometry is not available
            setCitySearch(place.name);
            fetchWeather({ city: place.name });
        }
    }
  };
  
  const weatherDescription = (code: number): string => {
      const descriptions: { [key: number]: string } = {
          0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
          45: 'Fog', 48: 'Depositing rime fog',
          51: 'Light drizzle', 53: 'Drizzle', 55: 'Dense drizzle',
          56: 'Light freezing drizzle', 57: 'Dense freezing drizzle',
          61: 'Slight rain', 63: 'Rain', 65: 'Heavy rain',
          66: 'Light freezing rain', 67: 'Heavy freezing rain',
          71: 'Slight snow fall', 73: 'Snow fall', 75: 'Heavy snow fall',
          77: 'Snow grains', 80: 'Slight rain showers', 81: 'Rain showers',
          82: 'Violent rain showers', 85: 'Slight snow showers', 86: 'Heavy snow showers',
          95: 'Thunderstorm', 96: 'Thunderstorm, slight hail', 99: 'Thunderstorm, heavy hail',
      };
      return descriptions[code] || 'Unknown';
  };

  if (loading) {
    return <WeatherSkeleton />;
  }

  if (error) {
    return (
        <Card className="bg-slate-800/80 text-white border-destructive/50 p-6">
             <Alert variant="destructive" className='border-0 text-white'>
                <AlertTitle className="text-red-400">Could Not Load Weather</AlertTitle>
                <AlertDescription className="text-red-300/90">{error}</AlertDescription>
            </Alert>
            <form onSubmit={handleSearch} className="flex gap-2 mt-4">
                 {isLoaded ? (
                    <Autocomplete
                        onLoad={onAutocompleteLoad}
                        onPlaceChanged={onPlaceChanged}
                        options={{
                            types: ['(cities)'],
                            componentRestrictions: { country: 'in' },
                        }}
                    >
                        <Input value={citySearch} onChange={(e) => setCitySearch(e.target.value)} placeholder="Try another city..." className="bg-slate-700/50 border-slate-600 text-white" />
                    </Autocomplete>
                ) : (
                    <Input value={citySearch} onChange={(e) => setCitySearch(e.target.value)} placeholder="Search..." className="bg-slate-700/50 border-slate-600 text-white" />
                )}
                <Button type="submit" variant="secondary">Search</Button>
            </form>
        </Card>
    );
  }

  if (!weatherData) {
    return null;
  }

  const { current, hourly, daily, locationName, timezone } = weatherData;

  const renderSearch = () => {
    if (!isLoaded) {
      return <Input placeholder="Loading search..." disabled className="bg-slate-700/50 border-slate-600 text-white h-9 text-sm w-full max-w-xs" />
    }
    return (
        <Autocomplete
            onLoad={onAutocompleteLoad}
            onPlaceChanged={onPlaceChanged}
            options={{
                types: ['(cities)'],
                componentRestrictions: { country: 'in' },
                fields: ['geometry', 'name'] // Request geometry to get lat/lng
            }}
        >
            <Input 
              value={citySearch} 
              onChange={(e) => setCitySearch(e.target.value)} 
              placeholder="Search for a city in India..." 
              className="bg-slate-700/50 border-slate-600 text-white h-9 text-sm w-full"
            />
        </Autocomplete>
    );
  }

  return (
    <Card className="bg-slate-800/80 text-white border-slate-700/50 p-6 backdrop-blur-sm shadow-2xl shadow-slate-900/50">
        <div className="flex justify-between items-start gap-4">
            <div>
                <p className="flex items-center gap-1"><MapPin size={14} />{locationName}</p>
                <p className="text-xs text-slate-400">{format(new Date(), "eeee, MMMM d 'at' h:mm a")}</p>
            </div>
            <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-xs">
              {renderSearch()}
              <Button type="submit" variant="ghost" size="icon" className="h-9 w-9 hover:bg-slate-700"><Search size={16} /></Button>
            </form>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center my-6 md:my-10 gap-4 md:gap-8 text-center md:text-left">
            <WeatherIcon weatherCode={current.weatherCode} isDay={current.isDay === 1} className="w-24 h-24 md:w-32 md:h-32" />
            <div>
                <p className="text-7xl md:text-8xl font-light">{current.temperature}<span className="text-5xl md:text-6xl text-slate-400 align-top">°C</span></p>
                <p className="text-lg text-slate-300 -mt-2">{weatherDescription(current.weatherCode)}</p>
                <div className="flex gap-4 justify-center md:justify-start mt-2 text-sm text-slate-400">
                    <span className="flex items-center gap-1"><Droplet size={14} />{current.humidity}%</span>
                    <span className="flex items-center gap-1"><Wind size={14} />{current.windSpeed} km/h</span>
                </div>
            </div>
        </div>
      
        <Tabs defaultValue="temperature" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-900/50">
                <TabsTrigger value="temperature">Temperature</TabsTrigger>
                <TabsTrigger value="precipitation">Precipitation</TabsTrigger>
                <TabsTrigger value="wind">Wind</TabsTrigger>
            </TabsList>
            <TabsContent value="temperature" className="mt-4">
               <HourlyWeatherChart data={hourly.time.map((t, i) => ({ time: t, value: hourly.temperature[i]}))} unit="°C" color="hsl(48, 96%, 58%)" />
            </TabsContent>
            <TabsContent value="precipitation" className="mt-4">
                <HourlyWeatherChart data={hourly.time.map((t, i) => ({ time: t, value: hourly.precipitationProbability[i]}))} unit="%" color="hsl(205, 87%, 55%)" />
            </TabsContent>
            <TabsContent value="wind" className="mt-4">
                 <WindChart data={hourly.time.map((t, i) => ({ time: t, speed: hourly.windSpeed[i], direction: hourly.windDirection[i] }))} />
            </TabsContent>
        </Tabs>

        <div className="mt-6 border-t border-slate-700/50 pt-4">
            <h3 className="font-semibold mb-3">7-Day Forecast</h3>
            <div className="space-y-3">
                {daily.time.map((day, i) => (
                    <div key={day} className="flex justify-between items-center text-sm">
                        <p className="w-1/4 text-slate-300">{format(new Date(day), 'eee')}</p>
                        <div className="w-1/4 flex justify-center">
                            <WeatherIcon weatherCode={daily.weatherCode[i]} isDay={true} className="w-6 h-6" />
                        </div>
                        <p className="w-1/4 text-slate-400">{daily.temperatureMin[i]}°</p>
                        <div className="w-1/4 h-1.5 bg-gradient-to-r from-cyan-400 via-yellow-400 to-orange-500 rounded-full" style={{
                            // This is a simplified representation. A real implementation
                            // would calculate the position of the min/max within a broader range.
                        }}></div>
                        <p className="w-1/4 text-right">{daily.temperatureMax[i]}°</p>
                    </div>
                ))}
            </div>
        </div>
    </Card>
  );
}
