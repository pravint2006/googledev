
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
  temp: z.number().describe('The temperature in Celsius.'),
  condition: z.enum(['Sunny', 'Cloudy', 'Rainy', 'Stormy']).describe('The weather condition.'),
});

const WeatherOutputSchema = z.object({
  city: z.string().describe("The city for which the weather is being reported."),
  district: z.string().describe('The district or county for the location.'),
  pincode: z.string().describe('The postal code or pincode for the location.'),
  currentTemp: z.number().describe('The current temperature in Celsius.'),
  condition: z.enum(['Sunny', 'Cloudy', 'Rainy', 'Stormy']).describe('The current weather condition.'),
  windSpeed: z.number().describe('The wind speed in km/h.'),
  humidity: z.number().describe('The humidity percentage.'),
  forecast: z.array(DailyForecastSchema).describe('A 3-day weather forecast.'),
});
export type WeatherOutput = z.infer<typeof WeatherOutputSchema>;


export async function getWeather(input: WeatherInput): Promise<WeatherOutput> {
  return getWeatherFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getWeatherPrompt',
  input: { schema: WeatherInputSchema },
  output: { schema: WeatherOutputSchema },
  prompt: `You are a weather forecasting service.
  
  You will receive one of two types of input:
  1. A location name, optionally with an Indian pincode.
  2. Latitude and longitude coordinates.

  Based on the provided input, determine the location and provide a realistic and representative weather forecast.
  
  Important rules:
  - You MUST invent plausible weather data. Do not attempt to look up real-time weather.
  - The city name, district, and pincode in the output MUST be the full, unambiguous name of the location, including state/region and country if applicable.
  - If the user provides "Thungavi" and "642203", you MUST use "Tirupur" as the district. For other locations, provide a plausible district and pincode.
  - Return a 3-day forecast starting from tomorrow.
  - Today is Sunday. So the forecast should be for Monday, Tuesday, and Wednesday.
  - Make the weather conditions varied and interesting. For example, don't make it "Sunny" every day.
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
