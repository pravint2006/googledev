
'use server';

import { ai } from '@/ai/genkit';
import { WeatherInput, WeatherInputSchema, WeatherOutput, WeatherOutputSchema } from './weather-types';
import { googleAI } from '@genkit-ai/google-genai';

// Simple in-memory cache with TTL
const weatherCache = new Map<string, { data: WeatherOutput; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function getCacheKey(input: WeatherInput): string {
  if (input.latitude !== undefined && input.longitude !== undefined) {
    return `${input.latitude},${input.longitude}`;
  }
  return input.city || 'default';
}

function getCachedWeather(input: WeatherInput): WeatherOutput | null {
  const key = getCacheKey(input);
  const cached = weatherCache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  // Remove expired cache
  if (cached) {
    weatherCache.delete(key);
  }
  
  return null;
}

function setCachedWeather(input: WeatherInput, data: WeatherOutput): void {
  const key = getCacheKey(input);
  weatherCache.set(key, { data, timestamp: Date.now() });
}

// Helper to fetch from a URL and parse JSON
async function fetchJson(url: string, options: RequestInit = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

const getWeatherFlow = ai.defineFlow(
  {
    name: 'getWeatherFlow',
    inputSchema: WeatherInputSchema,
    outputSchema: WeatherOutputSchema,
  },
  async (input) => {
    let { latitude, longitude, city } = input;
    let locationName = city;
    let fullLocationName: string | undefined;
    let pincode: string | undefined;

    const nominatimHeaders = { 'User-Agent': 'AgriGateManager/1.0' };

    // SCENARIO 1: We have coordinates. This is the priority.
    // We will use these coordinates to get weather and find a name.
    if (latitude !== undefined && longitude !== undefined) {
        if (!locationName) { // We need to find the name
            const reverseGeocodingUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;
            try {
                const reverseGeoResult = await fetchJson(reverseGeocodingUrl, { headers: nominatimHeaders });
                const address = reverseGeoResult.address;
                locationName = address.city || address.town || address.village || address.suburb || "Current Location";
                fullLocationName = reverseGeoResult.display_name;
                pincode = address.postcode;
            } catch (e) {
                console.warn("Reverse geocoding failed, using default name.", e);
                locationName = "Current Location";
            }
        } else { // We have a name, but let's get full details anyway for consistency
             const searchUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName)}&format=json&limit=1&addressdetails=1`;
             try {
                const results = await fetchJson(searchUrl, { headers: nominatimHeaders });
                if (results && results.length > 0) {
                    const geoResult = results[0];
                    latitude = parseFloat(geoResult.lat);
                    longitude = parseFloat(geoResult.lon);
                    fullLocationName = geoResult.display_name;
                    pincode = geoResult.address?.postcode;
                }
             } catch(e) {
                console.warn(`Could not enrich location for ${locationName}`, e);
             }
        }
    } 
    // SCENARIO 2: We ONLY have a city name. 
    // We must find coordinates for it using Nominatim.
    else if (city && (latitude === undefined || longitude === undefined)) {
        let geoResult;
        let foundLocation = false;
        
        // Step 1: Search for "<city>, India"
        try {
            const indiaSearchUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city + ', India')}&format=json&limit=1&addressdetails=1`;
            const results = await fetchJson(indiaSearchUrl, { headers: nominatimHeaders });
            if (results && results.length > 0) {
                geoResult = results[0];
                foundLocation = true;
            }
        } catch (e) {
            console.warn(`Nominatim search for "${city}, India" failed.`, e);
        }

        // Step 2: Fallback to searching just for "<city>"
        if (!foundLocation) {
            try {
                const globalSearchUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1&addressdetails=1`;
                const results = await fetchJson(globalSearchUrl, { headers: nominatimHeaders });
                if (results && results.length > 0) {
                    geoResult = results[0];
                }
            } catch (e) {
                console.warn(`Nominatim global search for "${city}" failed.`, e);
            }
        }

        if (geoResult) {
            latitude = parseFloat(geoResult.lat);
            longitude = parseFloat(geoResult.lon);
            const addressParts = geoResult.display_name.split(',');
            locationName = addressParts[0]; // The primary name of the location
            fullLocationName = geoResult.display_name;
            pincode = geoResult.address?.postcode;
        } else {
             throw new Error(`Could not find location: ${city}`);
        }
    }

    // After the above logic, if we still don't have coordinates, we cannot proceed.
    if (latitude === undefined || longitude === undefined) {
      throw new Error('A valid location (coordinates or city name) is required to fetch weather.');
    }
    
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,is_day,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=celsius&wind_speed_unit=kmh&precipitation_unit=mm&timezone=auto`;

    const weatherData = await fetchJson(weatherUrl);

    // Transform the data to our required output schema
    return {
      latitude: weatherData.latitude,
      longitude: weatherData.longitude,
      timezone: weatherData.timezone,
      locationName: locationName || "Unknown Location",
      fullLocationName: fullLocationName,
      pincode: pincode,
      current: {
        time: weatherData.current.time,
        temperature: Math.round(weatherData.current.temperature_2m),
        weatherCode: weatherData.current.weather_code,
        humidity: weatherData.current.relative_humidity_2m,
        windSpeed: weatherData.current.wind_speed_10m,
        isDay: weatherData.current.is_day,
      },
      hourly: {
        time: weatherData.hourly.time.slice(0, 24 * 7),
        temperature: weatherData.hourly.temperature_2m.slice(0, 24 * 7).map(Math.round),
        precipitationProbability: weatherData.hourly.precipitation_probability.slice(0, 24 * 7),
        windSpeed: weatherData.hourly.wind_speed_10m.slice(0, 24 * 7).map((ws: number) => Math.round(ws)),
        windDirection: weatherData.hourly.wind_direction_10m.slice(0, 24 * 7),
      },
      daily: {
        time: weatherData.daily.time.slice(0, 7),
        weatherCode: weatherData.daily.weather_code.slice(0, 7),
        temperatureMax: weatherData.daily.temperature_2m_max.slice(0, 7).map(Math.round),
        temperatureMin: weatherData.daily.temperature_2m_min.slice(0, 7).map(Math.round),
      },
    };
  }
);

export async function getWeather(input: WeatherInput): Promise<WeatherOutput> {
    // Check cache first
    const cached = getCachedWeather(input);
    if (cached) {
      console.log('Using cached weather data');
      return cached;
    }

    const result = await getWeatherFlow(input);
    
    // Cache the result
    setCachedWeather(input, result);
    
    return result;
}
