
'use server';

import { ai } from '@/ai/genkit';
import { WeatherInput, WeatherInputSchema, WeatherOutput, WeatherOutputSchema } from './weather-types';


// Helper to fetch from a URL and parse JSON
async function fetchJson(url: string) {
  const response = await fetch(url);
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
      const reverseGeocodingUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
      try {
        const reverseGeoResult = await fetchJson(reverseGeocodingUrl);
        if (reverseGeoResult.city) {
          locationName = reverseGeoResult.city;
        } else if (reverseGeoResult.locality) {
            locationName = reverseGeoResult.locality;
        }
      } catch (e) {
        console.warn("Reverse geocoding failed, using default name.");
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

export async function getWeather(input: WeatherInput): Promise<WeatherOutput> {
    return await getWeatherFlow(input);
}
