
'use server';
/**
 * @fileOverview A weather forecasting AI agent.
 *
 * - getWeather - A function that handles fetching weather data.
 * - WeatherInput - The input type for the getWeather function.
 * - WeatherOutput - The return type for the getWeather function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
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
  date: z.string().describe('The date of the forecast in YYYY-MM-DD format.'),
  temp: z.number().describe('The average temperature for the day in Celsius.'),
  condition: z.enum(['Sunny', 'Cloudy', 'Rainy', 'Stormy', 'Partly Cloudy', 'Thunderstorms', 'Hazy']).describe('The weather condition.'),
});
export type DailyForecast = z.infer<typeof DailyForecastSchema>;

const HourlyForecastSchema = z.object({
    time: z.string().describe('The hour for the forecast (e.g., "4 PM", "12 AM").'),
    temp: z.number().describe('The temperature for the hour in Celsius.'),
    condition: z.enum(['Sunny', 'Cloudy', 'Rainy', 'Stormy', 'Partly Cloudy', 'Thunderstorms', 'Hazy']).describe('The weather condition.'),
    rainProbability: z.number().min(0).max(100).describe('The probability of rain as a percentage (0-100).'),
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
  forecast: z.array(DailyForecastSchema).describe('A 7-day weather forecast with day, date, average temperature, and condition.'),
  hourlyForecast: z.array(HourlyForecastSchema).describe('A 24-hour forecast with time, temperature, condition, and rain probability.'),
});
export type WeatherOutput = z.infer<typeof WeatherOutputSchema>;


export async function getWeather(input: WeatherInput): Promise<WeatherOutput> {
  return getWeatherFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getWeatherPrompt',
  input: { schema: WeatherInputSchema },
  output: { schema: WeatherOutputSchema },
  model: googleAI.model('gemini-2.5-flash'),
  prompt: `You are a weather forecasting service. Your function is to generate plausible and detailed weather data based on the provided location.
  
  You MUST invent plausible weather data. Do not look up real-time weather.
  
  If the user provides "Thungavi" and pincode "642203", you MUST use "Tirupur" as the district. For other locations, provide a plausible district and pincode.
  
  Return a 7-day daily forecast and a 24-hour hourly forecast. The 7-day forecast MUST start with today's day of the week and be sequential. For each day in the 7-day forecast, you MUST include the full date in YYYY-MM-DD format.
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
