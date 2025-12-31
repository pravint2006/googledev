
'use server';
/**
 * @fileOverview A weather forecasting AI agent.
 *
 * - getWeather - A function that handles fetching weather data.
 * - WeatherInput - The input type for the getWeather function.
 * - WeatherOutput - The return type for the getWeather function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const WeatherInputSchema = z.object({
  location: z.string().describe('The city or location for the weather forecast (e.g., "Chennai, India").'),
  pincode: z.string().optional().describe('An optional Indian pincode to help specify the location.'),
  lat: z.number().optional().describe('The latitude for the location.'),
  lon: z.number().optional().describe('The longitude for the location.'),
});
export type WeatherInput = z.infer<typeof WeatherInputSchema>;

const DailyForecastSchema = z.object({
  day: z.string().describe('The day of the week (e.g., "Monday").'),
  minTemp: z.number().describe('The minimum temperature for the day in Celsius.'),
  maxTemp: z.number().describe('The maximum temperature for the day in Celsius.'),
  condition: z.enum(['Sunny', 'Cloudy', 'Rainy', 'Stormy', 'Partly Cloudy', 'Thunderstorms', 'Hazy']).describe('The weather condition.'),
  windSpeed: z.number().describe('The wind speed in km/h.'),
  humidity: z.number().describe('The humidity percentage.'),
  uvIndex: z.number().describe('The UV index, from 0 to 11+.'),
  precipitationChance: z.number().min(0).max(100).describe('The percentage chance of precipitation.'),
});
export type DailyForecast = z.infer<typeof DailyForecastSchema>;

const HourlyForecastSchema = z.object({
    time: z.string().describe('The specific hour for the forecast (e.g., "3 PM", "10 AM").'),
    temp: z.number().describe('The temperature at that hour in Celsius.'),
    condition: z.enum(['Sunny', 'Cloudy', 'Rainy', 'Stormy', 'Partly Cloudy', 'Thunderstorms', 'Hazy']).describe('The weather condition at that hour.'),
    rainProbability: z.number().min(0).max(100).describe('The percentage probability of rain at that hour.')
});
export type HourlyForecast = z.infer<typeof HourlyForecastSchema>;


const WeatherOutputSchema = z.object({
  city: z.string().describe("The city for which the weather is being reported, including state/region and country."),
  district: z.string().describe('The district or county for the location.'),
  pincode: z.string().describe('The postal code or pincode for the location.'),
  currentTemp: z.number().describe('The current temperature in Celsius.'),
  feelsLike: z.number().describe('What the current temperature feels like in Celsius.'),
  condition: z.enum(['Sunny', 'Cloudy', 'Rainy', 'Stormy', 'Partly Cloudy', 'Thunderstorms', 'Hazy']).describe('The current weather condition.'),
  windSpeed: z.number().describe('The wind speed in km/h.'),
  humidity: z.number().describe('The humidity percentage.'),
  hourlyForecast: z.array(HourlyForecastSchema).describe('A 24-hour weather forecast.'),
  forecast: z.array(DailyForecastSchema).describe('A 7-day weather forecast.'),
});
export type WeatherOutput = z.infer<typeof WeatherOutputSchema>;


export async function getWeather(input: WeatherInput): Promise<WeatherOutput> {
  return getWeatherFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getWeatherPrompt',
  input: { schema: WeatherInputSchema },
  output: { schema: WeatherOutputSchema },
  prompt: `You are a weather forecasting service. Your primary function is to generate plausible, representative, and detailed weather data.
  
  You will receive one of two types of input:
  1. A location name, optionally with an Indian pincode.
  2. Latitude and longitude coordinates.

  Based on the provided input, determine the location and provide a realistic and representative weather forecast.
  
  CRITICAL RULES:
  - You MUST invent plausible weather data. Do not attempt to look up real-time weather. This is for a simulation.
  - The 'city' field in the output MUST be the full, unambiguous name of the location (e.g., "Thungavi, Tamil Nadu, India").
  - If the user provides "Thungavi" and "642203", you MUST use "Tirupur" as the district. For other locations, provide a plausible district and pincode.
  - Return a 24-hour forecast starting from the next hour.
  - Return a 7-day forecast starting from tomorrow.
  - Today is Sunday. The forecast should be for Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, and the following Sunday.
  - For each hour in the hourly forecast, you must provide all fields: time, temp, condition, and rainProbability.
  - For each day in the daily forecast, you MUST provide all fields: minTemp, maxTemp, condition, windSpeed, humidity, uvIndex, and precipitationChance.
  - The 'feelsLike' temperature should be a plausible value based on the current temperature, humidity, and wind speed.
  - Make the weather conditions and precipitation chances varied and interesting across the days.
  `,
});

const getWeatherFlow = ai.defineFlow(
  {
    name: 'getWeatherFlow',
    inputSchema: WeatherInputSchema,
    outputSchema: WeatherOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
