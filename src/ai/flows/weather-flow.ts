
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
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
    if (!apiKey) {
        throw new Error("OpenWeatherMap API key is not configured. Please add NEXT_PUBLIC_OPENWEATHER_API_KEY to your .env.local file.");
    }

    try {
        let lat = input.lat;
        let lon = input.lon;
        let locationName = input.location;

        if (!lat || !lon) {
            const geoData = await getCoordsFromLocation(input.location, input.pincode, apiKey);
            lat = geoData.lat;
            lon = geoData.lon;
            locationName = `${geoData.name}, ${geoData.country}`;
        }
        
        // Fetch current weather and forecast in one call
        const weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        
        const weatherResponse = await fetch(weatherUrl);
        if (!weatherResponse.ok) {
            throw new Error(`Failed to fetch weather data from OpenWeatherMap. Status: ${weatherResponse.status}`);
        }

        const weatherData = await weatherResponse.json();

        const { list, city } = weatherData;
        const current = list[0];

        // Process hourly forecast for the next 24 hours
        const hourlyForecast: HourlyForecast[] = list.slice(0, 8).map((hour: any) => ({
            time: format(fromUnixTime(hour.dt), 'h a'),
            temp: Math.round(hour.main.temp),
            condition: mapWeatherCondition(hour.weather[0].main, hour.weather[0].description),
            rainProbability: Math.round((hour.pop || 0) * 100),
        }));

        // Process daily forecast
        const dailyForecasts: { [key: string]: { temps: number[], conditions: string[], descriptions: string[]} } = {};
        list.forEach((item: any) => {
            const date = format(fromUnixTime(item.dt), 'yyyy-MM-dd');
            if (!dailyForecasts[date]) {
                dailyForecasts[date] = { temps: [], conditions: [], descriptions: [] };
            }
            dailyForecasts[date].temps.push(item.main.temp);
            dailyForecasts[date].conditions.push(item.weather[0].main);
            dailyForecasts[date].descriptions.push(item.weather[0].description);
        });

        const forecast: DailyForecast[] = Object.keys(dailyForecasts).slice(0, 5).map(date => {
            const dayData = dailyForecasts[date];
            const avgTemp = dayData.temps.reduce((a, b) => a + b, 0) / dayData.temps.length;
            // For daily condition, find the most frequent one
            const mode = (arr: string[]) => arr.reduce((a, b, i, arr) => (arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b), '');
            const mainCondition = mode(dayData.conditions);
            const description = dayData.descriptions[Math.floor(dayData.descriptions.length / 2)]; // Use midday description
            return {
                day: format(new Date(date), 'eeee'),
                date: date,
                temp: Math.round(avgTemp),
                condition: mapWeatherCondition(mainCondition, description),
            };
        });

        return {
            city: locationName,
            district: city.name || 'N/A',
            pincode: input.pincode || 'N/A',
            currentTemp: Math.round(current.main.temp),
            feelsLike: Math.round(current.main.feels_like),
            condition: mapWeatherCondition(current.weather[0].main, current.weather[0].description),
            windSpeed: parseFloat((current.wind.speed * 3.6).toFixed(1)), // m/s to km/h
            humidity: current.main.humidity,
            forecast: forecast,
            hourlyForecast: hourlyForecast,
        };

    } catch (error) {
        console.error("Error in getWeather flow:", error);
        if (error instanceof Error) {
            throw new Error(error.message || "An unknown error occurred while fetching weather data.");
        }
        throw new Error("An unknown error occurred while fetching weather data.");
    }
}
