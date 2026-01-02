
'use server';
/**
 * @fileOverview A weather forecasting agent that uses the Google Weather API.
 *
 * - getWeather - A function that handles fetching real weather data.
 * - WeatherInput - The input type for the getWeather function.
 * - WeatherOutput - The return type for the getWeather function.
 */

import { z } from 'genkit';
import { format, parseISO } from 'date-fns';

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

// Mapping from Google's weather codes to our simplified conditions
const conditionMap: { [key: number]: WeatherOutput['condition'] } = {
    1000: 'Sunny', 1001: 'Cloudy', 1002: 'Cloudy', 1003: 'Partly Cloudy', 1004: 'Cloudy',
    1100: 'Sunny', 1101: 'Partly Cloudy', 1102: 'Partly Cloudy',
    2000: 'Hazy', 2100: 'Hazy',
    4000: 'Rainy', 4001: 'Rainy', 4002: 'Rainy', 4200: 'Rainy', 4201: 'Rainy',
    5000: 'Stormy', 5001: 'Stormy', 5100: 'Stormy', 5101: 'Stormy',
    8000: 'Thunderstorms'
};
const defaultCondition: WeatherOutput['condition'] = 'Partly Cloudy';

function mapWeatherCode(code: number | undefined): WeatherOutput['condition'] {
    if (code === undefined) return defaultCondition;
    return conditionMap[code] || defaultCondition;
}

async function getGeocodedLocation(input: WeatherInput, apiKey: string): Promise<{ lat: number; lng: number }> {
    if (input.lat && input.lon) {
        return { lat: input.lat, lng: input.lon };
    }
    
    const address = `${input.location}, ${input.pincode || ''}`.trim();
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

    const response = await fetch(geocodeUrl);
    if (!response.ok) {
        throw new Error('Failed to fetch data from Geocoding API.');
    }
    const data = await response.json();
    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        throw new Error(`Geocoding failed: ${data.status} - ${data.error_message || 'No results found.'}`);
    }
    return data.results[0].geometry.location;
}

export async function getWeather(input: WeatherInput): Promise<WeatherOutput> {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        throw new Error("Google Maps API key is not configured. Please add it to your .env.local file.");
    }

    try {
        const { lat, lng } = await getGeocodedLocation(input, apiKey);

        const requests = 'currentConditions,dailyForecast,hourlyForecast';
        const weatherUrl = `https://weather.googleapis.com/v1/weather:get?location=${lat},${lng}&requests=${requests}&days=7&units=METRIC&languageCode=en`;

        const weatherResponse = await fetch(weatherUrl, {
            headers: {
                'X-Goog-Api-Key': apiKey,
                'Content-Type': 'application/json'
            },
        });

        if (!weatherResponse.ok) {
            const errorBody = await weatherResponse.text();
            console.error("Weather API Error:", errorBody);
            if (errorBody.includes("Weather API has not been used in project")) {
                 throw new Error("The Weather API is not enabled for your API key. Please enable it in the Google Cloud Console.");
            }
            throw new Error(`Failed to fetch data from Weather API. Status: ${weatherResponse.status}. Response: ${errorBody}`);
        }

        const weatherData = await weatherResponse.json();
        
        const reverseGeocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
        const reverseGeocodeResponse = await fetch(reverseGeocodeUrl);
        const reverseGeocodeData = await reverseGeocodeResponse.json();

        let city = input.location;
        let district = 'N/A';
        let pincode = input.pincode || 'N/A';

        if (reverseGeocodeData.status === 'OK' && reverseGeocodeData.results.length > 0) {
            const components = reverseGeocodeData.results[0].address_components;
            const locality = components.find((c: any) => c.types.includes('locality'))?.long_name;
            const adminArea3 = components.find((c: any) => c.types.includes('administrative_area_level_3'))?.long_name;
            const adminArea2 = components.find((c: any) => c.types.includes('administrative_area_level_2'))?.long_name;
            const postalTown = components.find((c: any) => c.types.includes('postal_town'))?.long_name;

            city = locality || postalTown || adminArea3 || input.location;
            district = adminArea2 || 'N/A';
            pincode = components.find((c: any) => c.types.includes('postal_code'))?.long_name || input.pincode || 'N/A';
        }


        const { dailyForecast, hourlyForecast, currentConditions } = weatherData;
        const current = currentConditions;

        // Handle cases where some data might be missing from the weather API response
        if (!current || !dailyForecast?.days || !hourlyForecast?.hours) {
            throw new Error("Incomplete data received from Weather API. The response might be missing current conditions, daily, or hourly forecasts.");
        }

        return {
            city,
            district,
            pincode,
            currentTemp: Math.round(current.temperature),
            feelsLike: Math.round(current.temperatureApparent),
            condition: mapWeatherCode(current.weatherCode),
            windSpeed: parseFloat(current.windSpeed.toFixed(1)),
            humidity: Math.round(current. humidity * 100),
            forecast: dailyForecast.days.slice(0, 7).map((day: any) => ({
                day: format(parseISO(day.date), 'eeee'),
                date: `${day.date.year}-${String(day.date.month).padStart(2,'0')}-${String(day.date.day).padStart(2,'0')}`,
                temp: Math.round(day.temperatureAvg),
                condition: mapWeatherCode(day.weatherCodeMax),
            })),
            hourlyForecast: hourlyForecast.hours.slice(0, 24).map((hour: any) => ({
                time: format(parseISO(hour.dateTime), 'h a'),
                temp: Math.round(hour.temperature),
                condition: mapWeatherCode(hour.weatherCode),
                rainProbability: Math.round((hour.precipitation?.probability || 0) * 100),
            })),
        };

    } catch (error) {
        console.error("Error in getWeather flow:", error);
        if (error instanceof Error) {
            throw new Error(error.message || "An unknown error occurred while fetching weather data.");
        }
        throw new Error("An unknown error occurred while fetching weather data.");
    }
}
