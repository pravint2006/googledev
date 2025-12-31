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
  lat: z.number().describe('The latitude for the weather forecast.'),
  lon: z.number().describe('The longitude for the weather forecast.'),
});
export type WeatherInput = z.infer<typeof WeatherInputSchema>;

const DailyForecastSchema = z.object({
  day: z.string().describe('The day of the week (e.g., "Monday").'),
  temp: z.number().describe('The temperature in Celsius.'),
  condition: z.enum(['Sunny', 'Cloudy', 'Rainy', 'Stormy']).describe('The weather condition.'),
});

const WeatherOutputSchema = z.object({
  city: z.string().describe("The city for which the weather is being reported."),
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
  
  Based on the provided latitude: {{{lat}}} and longitude: {{{lon}}}, provide a realistic and representative weather forecast for that location.
  
  Important rules:
  - You MUST invent plausible weather data. Do not attempt to look up real-time weather.
  - The city name must be a real, major city that is plausible for the given coordinates.
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
