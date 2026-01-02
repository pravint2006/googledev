
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit/zod';
import { updateUserProfile } from '@/hooks/use-user-profile';
import { User } from 'firebase/auth';

// Input schema for fetching weather, can be coordinates or a city name
export const WeatherInputSchema = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  city: z.string().optional(),
});
export type WeatherInput = z.infer<typeof WeatherInputSchema>;

// Detailed output schema matching the data we need for the UI
export const WeatherOutputSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string(),
  locationName: z.string(),
  current: z.object({
    time: z.string(),
    temperature: z.number(),
    weatherCode: z.number(),
    humidity: z.number(),
    windSpeed: z.number(),
    isDay: z.number(),
  }),
  hourly: z.object({
    time: z.array(z.string()),
    temperature: z.array(z.number()),
    precipitationProbability: z.array(z.number()),
    windSpeed: z.array(z.number()),
  }),
  daily: z.object({
    time: z.array(z.string()),
    weatherCode: z.array(z.number()),
    temperatureMax: z.array(z.number()),
    temperatureMin: z.array(z.number()),
  }),
});
export type WeatherOutput = z.infer<typeof WeatherOutputSchema>;

// Helper to fetch from a URL and parse JSON
async function fetchJson(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export const getWeather = ai.defineFlow(
  {
    name: 'getWeather',
    inputSchema: WeatherInputSchema,
    outputSchema: WeatherOutputSchema,
  },
  async (input) => {
    let { latitude, longitude, city } = input;
    let locationName = city || 'Current Location';

    // If city is provided, we need to geocode it first
    if (city && (!latitude || !longitude)) {
      const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
      const geoResult = await fetchJson(geocodingUrl);
      if (!geoResult.results?.[0]) {
        throw new Error(`Could not find location: ${city}`);
      }
      latitude = geoResult.results[0].latitude;
      longitude = geoResult.results[0].longitude;
      locationName = geoResult.results[0].name;
    }

    if (latitude === undefined || longitude === undefined) {
      throw new Error('Latitude and longitude are required.');
    }
    
     // If city was not provided, use reverse geocoding to find a name
    if (!city) {
      const reverseGeocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?latitude=${latitude}&longitude=${longitude}&count=1`;
      const reverseGeoResult = await fetchJson(reverseGeocodingUrl);
       if (reverseGeoResult.results?.[0]?.name) {
        locationName = reverseGeoResult.results[0].name;
      }
    }


    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,is_day,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=celsius&wind_speed_unit=kmh&precipitation_unit=mm&timezone=auto`;

    const weatherData = await fetchJson(weatherUrl);

    // Transform the data to our required output schema
    return {
      latitude: weatherData.latitude,
      longitude: weatherData.longitude,
      timezone: weatherData.timezone,
      locationName,
      current: {
        time: weatherData.current.time,
        temperature: Math.round(weatherData.current.temperature_2m),
        weatherCode: weatherData.current.weather_code,
        humidity: weatherData.current.relative_humidity_2m,
        windSpeed: weatherData.current.wind_speed_10m,
        isDay: weatherData.current.is_day,
      },
      hourly: {
        time: weatherData.hourly.time.slice(0, 24),
        temperature: weatherData.hourly.temperature_2m.slice(0, 24).map(Math.round),
        precipitationProbability: weatherData.hourly.precipitation_probability.slice(0, 24),
        windSpeed: weatherData.hourly.wind_speed_10m.slice(0, 24).map((ws: number) => Math.round(ws)),
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
