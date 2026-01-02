
'use server';
/**
 * @fileOverview A weather forecasting agent that uses the OpenWeatherMap API.
 *
 * - getWeather - A function that handles fetching real weather data.
 * - WeatherInput - The input type for the getWeather function.
 * - WeatherOutput - The return type for the getWeather function.
 */

import { z } from 'genkit';
import { format, fromUnixTime } from 'date-fns';

const WeatherInputSchema = z.object({
  location: z.string().describe('The city or location for the weather forecast (e.g., "Chennai, India").'),
  pincode: z.string().optional().describe('An optional Indian pincode to help specify the location.'),
  lat: z.number().optional().describe('The latitude for the location.'),
  lon: z.number().optional().describe('The longitude for the location.'),
});
export type WeatherInput = z.infer<typeof WeatherInputSchema>;

const DailyForecastSchema = z.object({
  day: z.string().describe('The day of the week (e.g., "Monday").'),
  date: z.string().describe('The date of the forecast in YYYY-MM-DD format.'),
  temp: z.number().describe('The average temperature for the day in Celsius.'),
  condition: z.enum(['Sunny', 'Cloudy', 'Rainy', 'Stormy', 'Partly Cloudy', 'Thunderstorms', 'Hazy', 'Snowy', 'Misty']).describe('The weather condition.'),
});
export type DailyForecast = z.infer<typeof DailyForecastSchema>;

const HourlyForecastSchema = z.object({
    time: z.string().describe('The hour for the forecast (e.g., "4 PM", "12 AM").'),
    temp: z.number().describe('The temperature for the hour in Celsius.'),
    condition: z.enum(['Sunny', 'Cloudy', 'Rainy', 'Stormy', 'Partly Cloudy', 'Thunderstorms', 'Hazy', 'Snowy', 'Misty']).describe('The weather condition.'),
    rainProbability: z.number().min(0).max(100).describe('The probability of rain as a percentage (0-100).'),
});
export type HourlyForecast = z.infer<typeof HourlyForecastSchema>;

const WeatherOutputSchema = z.object({
  city: z.string().describe("The city for which the weather is being reported, including state/region and country."),
  district: z.string().describe('The district or county for the location.'),
  pincode: z.string().describe('The postal code or pincode for the location.'),
  currentTemp: z.number().describe('The current temperature in Celsius.'),
  feelsLike: z.number().describe('What the current temperature feels like in Celsius.'),
  condition: z.enum(['Sunny', 'Cloudy', 'Rainy', 'Stormy', 'Partly Cloudy', 'Thunderstorms', 'Hazy', 'Snowy', 'Misty']).describe('The current weather condition.'),
  windSpeed: z.number().describe('The wind speed in km/h.'),
  humidity: z.number().describe('The humidity percentage.'),
  forecast: z.array(DailyForecastSchema).describe('A 5-day weather forecast with day, date, average temperature, and condition.'),
  hourlyForecast: z.array(HourlyForecastSchema).describe('A 24-hour forecast with time, temperature, condition, and rain probability.'),
});
export type WeatherOutput = z.infer<typeof WeatherOutputSchema>;


function mapWeatherCondition(main: string, description: string): WeatherOutput['condition'] {
    switch (main) {
        case 'Thunderstorm':
            return 'Thunderstorms';
        case 'Drizzle':
        case 'Rain':
            return 'Rainy';
        case 'Snow':
            return 'Snowy';
        case 'Mist':
        case 'Fog':
            return 'Misty';
        case 'Haze':
        case 'Dust':
        case 'Sand':
        case 'Ash':
            return 'Hazy';
        case 'Clear':
            return 'Sunny';
        case 'Clouds':
            if (description.includes('few clouds') || description.includes('scattered clouds')) {
                return 'Partly Cloudy';
            }
            return 'Cloudy';
        default:
            return 'Partly Cloudy';
    }
}


async function getCoordsFromLocation(location: string, pincode: string | undefined, apiKey: string): Promise<{ lat: number; lon: number; name: string; country: string; }> {
    const query = pincode ? `${location},${pincode}` : location;
    const geocodeUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=1&appid=${apiKey}`;
    
    const response = await fetch(geocodeUrl);
    if (!response.ok) {
        throw new Error('Failed to fetch geocoding data from OpenWeatherMap.');
    }
    const data = await response.json();
    if (!data || data.length === 0) {
        throw new Error(`Could not find location: "${location}". Please try a different name.`);
    }
    const { lat, lon, name, country } = data[0];
    return { lat, lon, name, country };
}


export async function getWeather(input: WeatherInput): Promise<WeatherOutput> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OPENWEATHER_API_KEY in environment variables');
  }

  let lat = input.lat;
  let lon = input.lon;
  let locationName = input.location;

  if (lat == null || lon == null) {
    const geo = await getCoordsFromLocation(input.location, input.pincode, apiKey);
    lat = geo.lat;
    lon = geo.lon;
    locationName = `${geo.name}, ${geo.country}`;
  }

  const weatherUrl =
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

  const weatherResponse = await fetch(weatherUrl);
  if (!weatherResponse.ok) {
    throw new Error(`Weather API failed: ${weatherResponse.status}`);
  }

  const weatherData = await weatherResponse.json();
  const { list, city } = weatherData;
  const current = list[0];

  const hourlyForecast = list.slice(0, 8).map((hour: any) => ({
    time: format(fromUnixTime(hour.dt), 'h a'),
    temp: Math.round(hour.main.temp),
    condition: mapWeatherCondition(hour.weather[0].main, hour.weather[0].description),
    rainProbability: Math.round((hour.pop || 0) * 100),
  }));

  const dailyMap: Record<string, any[]> = {};
  list.forEach((i: any) => {
    const d = format(fromUnixTime(i.dt), 'yyyy-MM-dd');
    dailyMap[d] ??= [];
    dailyMap[d].push(i);
  });

  const forecast = Object.entries(dailyMap).slice(0, 5).map(([date, items]) => {
    const avg =
      items.reduce((s, i) => s + i.main.temp, 0) / items.length;
    const mid = items[Math.floor(items.length / 2)];

    return {
      day: format(new Date(date), 'eeee'),
      date,
      temp: Math.round(avg),
      condition: mapWeatherCondition(mid.weather[0].main, mid.weather[0].description),
    };
  });

  return {
    city: locationName,
    district: city?.state || 'N/A',
    pincode: input.pincode || 'N/A',
    currentTemp: Math.round(current.main.temp),
    feelsLike: Math.round(current.main.feels_like),
    condition: mapWeatherCondition(current.weather[0].main, current.weather[0].description),
    windSpeed: +(current.wind.speed * 3.6).toFixed(1),
    humidity: current.main.humidity,
    forecast,
    hourlyForecast,
  };
}
