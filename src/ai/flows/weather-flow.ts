
'use server';

import { ai } from '@/ai/genkit';
import { WeatherInput, WeatherInputSchema, WeatherOutput, WeatherOutputSchema } from './weather-types';


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

    // SCENARIO 1: We have coordinates. This is the priority.
    // We will use these coordinates to get weather and find a name.
    if (latitude !== undefined && longitude !== undefined) {
        // If we don't have a name, find one.
        if (!locationName) {
            const reverseGeocodingUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
            try {
                const reverseGeoResult = await fetchJson(reverseGeocodingUrl, {
                    headers: { 'User-Agent': 'AgriGateManager/1.0' }
                });
                const address = reverseGeoResult.address;
                locationName = address.city || address.town || address.village || address.suburb || "Current Location";
            } catch (e) {
                console.warn("Reverse geocoding failed, using default name.", e);
                locationName = "Current Location";
            }
        }
    } 
    // SCENARIO 2: We ONLY have a city name. 
    // We must find coordinates for it.
    else if (city && (latitude === undefined || longitude === undefined)) {
        const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
        const geoResult = await fetchJson(geocodingUrl);
        if (!geoResult.results?.[0]) {
            throw new Error(`Could not find location: ${city}`);
        }
        latitude = geoResult.results[0].latitude;
        longitude = geoResult.results[0].longitude;
        locationName = geoResult.results[0].name; // Use the name from the result for consistency
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
      current: {
        time: weatherData.current.time,
        temperature: Math.round(weatherData.current.temperature_2m),
        weatherCode: weatherData.current.weather_code,
        humidity: weatherData.current.relative_humidity_2m,
        windSpeed: weatherData.current.wind_speed_10m,
        isDay: weatherData.current.is_day,
      },
      hourly: {
        time: weatherData.hourly.time.slice(0, 24 * 7), // Get all 7 days of hourly data
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
    return await getWeatherFlow(input);
}
