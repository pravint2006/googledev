
'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { format, parseISO, isToday } from 'date-fns';
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
import { ScrollArea, ScrollBar } from './ui/scroll-area';
import { cn } from '@/lib/utils';

function WeatherSkeleton() {
  return (
    <Card className="bg-primary/90 text-primary-foreground border-primary p-6 flex flex-col items-center justify-center min-h-[360px] animate-pulse">
        <Loader2 className="h-10 w-10 animate-spin" />
        <p className="mt-4">Fetching weather data...</p>
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
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyAugxfHDgayygJevNNKsEbCB1pCtPnFr28",
    libraries,
  });

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

  const fetchWeather = async (params: { latitude?: number; longitude?: number; city?: string } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWeather(params);
      setWeatherData(data);
       if (data) {
        updateUserProfile({ 
          lastWeatherLocation: { 
            latitude: data.latitude, 
            longitude: data.longitude, 
            city: data.locationName,
            location: data.fullLocationName,
            pincode: data.pincode
          }
        });
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
        const { city, latitude, longitude } = userProfile.lastWeatherLocation;
        if(city) {
            fetchWeather({ city });
        } else if (latitude && longitude){
            fetchWeather({ latitude, longitude });
        } else {
             // Fallback if profile data is incomplete
            fetchWeather({ city: 'Delhi' });
        }
    } else if (userProfile === null) { // Check for explicit null, not undefined during loading
        // 2. Fallback to browser geolocation
        navigator.geolocation.getCurrentPosition(
            (position) => {
                fetchWeather({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            (err) => {
                // 3. If geolocation fails, set a default city
                console.warn('Geolocation failed:', err.message);
                fetchWeather({ city: 'Delhi' }); // Default to a major city in India
            },
            { timeout: 10000 }
        );
    }
  }, [userProfile]);

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
  
  const displayData = useMemo(() => {
    if (!weatherData) return null;
    const { current, daily } = weatherData;

    if (selectedDayIndex === 0 && isToday(parseISO(daily.time[0]))) {
      return {
        temp: current.temperature,
        weatherCode: current.weatherCode,
        isDay: current.isDay === 1,
        description: weatherDescription(current.weatherCode),
        humidity: current.humidity,
        windSpeed: current.windSpeed,
        highTemp: daily.temperatureMax[0],
        lowTemp: daily.temperatureMin[0],
      };
    }
    const selectedDaily = daily;
    return {
      temp: selectedDaily.temperatureMax[selectedDayIndex], // Show high temp for future days
      weatherCode: selectedDaily.weatherCode[selectedDayIndex],
      isDay: true, // For future days, assume day time for icon
      description: weatherDescription(selectedDaily.weatherCode[selectedDayIndex]),
      humidity: null, // Not available for future daily forecasts
      windSpeed: null, // Not available for future daily forecasts
      highTemp: selectedDaily.temperatureMax[selectedDayIndex],
      lowTemp: selectedDaily.temperatureMin[selectedDayIndex],
    };
  }, [selectedDayIndex, weatherData]);

  const hourlyDataForChart = useMemo(() => {
    if (!weatherData) return [];
    const { hourly } = weatherData;
    const startIndex = selectedDayIndex * 24;
    const endIndex = startIndex + 24;
    // Check if the slices exist before mapping
    if (hourly.time.length < endIndex || hourly.temperature.length < endIndex) return [];
    return hourly.time.slice(startIndex, endIndex).map((t, i) => ({
      time: t,
      value: hourly.temperature[startIndex + i],
    }));
  }, [selectedDayIndex, weatherData]);
  
  const hourlyPrecipitationData = useMemo(() => {
      if (!weatherData) return [];
      const { hourly } = weatherData;
      const startIndex = selectedDayIndex * 24;
      const endIndex = startIndex + 24;
      // Check if the slices exist before mapping
      if (hourly.time.length < endIndex || hourly.precipitationProbability.length < endIndex) return [];
      return hourly.time.slice(startIndex, endIndex).map((t, i) => ({
          time: t,
          value: hourly.precipitationProbability[startIndex + i],
      }));
  }, [selectedDayIndex, weatherData]);

  const hourlyWindData = useMemo(() => {
      if (!weatherData) return [];
      const { hourly } = weatherData;
      const startIndex = selectedDayIndex * 24;
      const endIndex = startIndex + 24;
      // Check if the slices exist before mapping
      if (hourly.time.length < endIndex || hourly.windSpeed.length < endIndex || hourly.windDirection.length < endIndex) return [];
      return hourly.time.slice(startIndex, endIndex).map((t, i) => ({
          time: t,
          speed: hourly.windSpeed[startIndex + i],
          direction: hourly.windDirection[startIndex + i],
      }));
  }, [selectedDayIndex, weatherData]);

  const renderSearch = () => {
    if (!isLoaded) {
      return <Input placeholder="Loading search..." disabled className="bg-primary/80 border-green-700 text-white placeholder:text-primary-foreground/70 h-9 text-sm w-full max-w-xs" />
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
              className="bg-primary/80 border-green-700 text-white placeholder:text-primary-foreground/70 h-9 text-sm w-full"
            />
        </Autocomplete>
    );
  };
  
  // Conditional returns now happen after all hooks have been called.
  if (loading) {
    return <WeatherSkeleton />;
  }

  if (error) {
    return (
        <Card className="bg-primary/90 text-primary-foreground border-destructive/50 p-6">
             <Alert variant="destructive" className='border-0 text-white'>
                <AlertTitle className="text-red-300">Could Not Load Weather</AlertTitle>
                <AlertDescription className="text-red-400/90">{error}</AlertDescription>
            </Alert>
            <form onSubmit={handleSearch} className="flex gap-2 mt-4">
                 {renderSearch()}
                <Button type="submit" variant="secondary">Search</Button>
            </form>
        </Card>
    );
  }

  if (!weatherData || !displayData) {
    return null;
  }
  
  const { daily, locationName, fullLocationName, pincode } = weatherData;

  const displayLocation = fullLocationName ? `${fullLocationName}${pincode ? ` - ${pincode}` : ''}` : `${locationName}${pincode ? ` - ${pincode}` : ''}`;

  return (
    <Card className="bg-primary/90 text-primary-foreground border-primary p-6 backdrop-blur-sm shadow-2xl shadow-slate-900/50">
        <div className="flex justify-between items-start gap-4">
            <div>
                <p className="flex items-center gap-2 text-lg"><MapPin size={16} />{locationName}</p>
                 {(fullLocationName || pincode) && (
                    <p className="text-xs text-primary-foreground/70 ml-6 truncate" title={displayLocation}>
                        {displayLocation.split(',').slice(1).join(',').trim()}
                    </p>
                )}
            </div>
            <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-xs">
              {renderSearch()}
              <Button type="submit" variant="ghost" size="icon" className="h-9 w-9 hover:bg-primary">
                <Search size={16} />
              </Button>
            </form>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center my-6 md:my-10 gap-4 md:gap-8 text-center md:text-left">
            <WeatherIcon weatherCode={displayData.weatherCode} isDay={displayData.isDay} className="w-24 h-24 md:w-32 md:h-32" />
            <div>
                <p className="text-7xl md:text-8xl font-light">{displayData.temp}<span className="text-5xl md:text-6xl text-primary-foreground/70 align-top">°C</span></p>
                <p className="text-lg text-primary-foreground/80 -mt-2">{displayData.description}</p>
                <div className="flex gap-4 justify-center md:justify-start mt-2 text-sm text-primary-foreground/70">
                    <span className='font-semibold'>{displayData.highTemp}°</span> / {displayData.lowTemp}°
                    {displayData.humidity !== null && <span className="flex items-center gap-1"><Droplet size={14} />{displayData.humidity}%</span>}
                    {displayData.windSpeed !== null && <span className="flex items-center gap-1"><Wind size={14} />{displayData.windSpeed} km/h</span>}
                </div>
            </div>
        </div>
      
        <Tabs defaultValue="temperature" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-primary/80">
                <TabsTrigger value="temperature">Temperature</TabsTrigger>
                <TabsTrigger value="precipitation">Precipitation</TabsTrigger>
                <TabsTrigger value="wind">Wind</TabsTrigger>
            </TabsList>
            <TabsContent value="temperature" className="mt-4">
               <HourlyWeatherChart data={hourlyDataForChart} unit="°C" color="#facc15" />
            </TabsContent>
            <TabsContent value="precipitation" className="mt-4">
                <HourlyWeatherChart data={hourlyPrecipitationData} unit="%" color="#38bdf8" />
            </TabsContent>
            <TabsContent value="wind" className="mt-4">
                 <WindChart data={hourlyWindData} />
            </TabsContent>
        </Tabs>

        <div className="mt-6 border-t border-primary pt-4">
             <div className="grid grid-cols-7 gap-1">
                {daily.time.map((day, i) => {
                    const dayDate = parseISO(day);
                    return (
                        <button
                            key={day}
                            onClick={() => setSelectedDayIndex(i)}
                            className={cn(
                                'flex flex-col items-center gap-1 rounded-lg p-2 text-center transition-colors duration-200',
                                selectedDayIndex === i ? 'bg-primary' : 'hover:bg-primary/80'
                            )}
                        >
                            <p className="text-sm font-medium">{isToday(dayDate) ? 'Today' : format(dayDate, 'E')}</p>
                            <p className="text-xs text-primary-foreground/70">{format(dayDate, 'd')}</p>
                            <WeatherIcon weatherCode={daily.weatherCode[i]} isDay={true} className="w-8 h-8 my-1" />
                            <p className="text-sm">
                                <span className="font-semibold">{daily.temperatureMax[i]}°</span>
                                <span className="text-primary-foreground/70 ml-1">{daily.temperatureMin[i]}°</span>
                            </p>
                        </button>
                    );
                })}
            </div>
        </div>
    </Card>
  );
}

    