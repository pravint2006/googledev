
import { z } from 'zod';

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
    windDirection: z.array(z.number()),
  }),
  daily: z.object({
    time: z.array(z.string()),
    weatherCode: z.array(z.number()),
    temperatureMax: z.array(z.number()),
    temperatureMin: z.array(z.number()),
  }),
});
export type WeatherOutput = z.infer<typeof WeatherOutputSchema>;
