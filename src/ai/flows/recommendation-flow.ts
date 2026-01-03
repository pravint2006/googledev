
'use server';

import { ai } from '@/ai/genkit';
import {
  RecommendationRequest,
  RecommendationRequestSchema,
  RecommendationResponse,
  RecommendationResponseSchema,
} from './recommendation-types';
import { googleAI } from '@genkit-ai/google-genai';

const recommendationPrompt = ai.definePrompt({
  name: 'recommendationPrompt',
  model: googleAI.model('gemini-1.5-flash-latest'),
  input: { schema: RecommendationRequestSchema },
  output: { schema: RecommendationResponseSchema },
  prompt: `You are an expert agricultural AI assistant for "AgriGate Manager". Your task is to provide actionable, location-specific recommendations to farmers in India based on the provided weather data.

Analyze the following weather forecast:
- Location: {{weather.locationName}}
- Current Temperature: {{weather.current.temperature}}°C
- Current Weather Code: {{weather.current.weatherCode}} (Note: Refer to a standard weather code chart for interpretation)
- Next 7 Days Forecast:
  {{#each weather.daily.time}}
  - Day {{add @index 1}} ({{this}}): Max Temp {{lookup ../weather.daily.temperatureMax @index}}°C, Min Temp {{lookup ../weather.daily.temperatureMin @index}}°C, Weather Code {{lookup ../weather.daily.weatherCode @index}}
  {{/each}}
- Hourly Precipitation Chance (next 24 hours):
  {{#each weather.hourly.time}}
   - {{this}}: {{lookup ../weather.hourly.precipitationProbability @index}}%
  {{/each}}

Based on this data, generate 3-4 diverse and practical recommendations for a typical farmer in this region of India. Focus on topics like optimal watering schedules, potential pest or disease outbreaks due to weather patterns, and suggestions for planting or harvesting.

For each recommendation, provide a title, a concise description, a category, and a suitable icon. Ensure the advice is relevant to the weather conditions. For example, if there is a high chance of rain, recommend reducing irrigation. If temperatures are very high, suggest measures to prevent heat stress on crops.

Return the recommendations in the specified JSON format.
`,
});

const getRecommendationsFlow = ai.defineFlow(
  {
    name: 'getRecommendationsFlow',
    inputSchema: RecommendationRequestSchema,
    outputSchema: RecommendationResponseSchema,
  },
  async (request) => {
    const { output } = await recommendationPrompt(request);
    if (!output) {
      throw new Error('Failed to generate recommendations from AI.');
    }
    return output;
  }
);

export async function getRecommendations(
  request: RecommendationRequest
): Promise<RecommendationResponse> {
  return getRecommendationsFlow(request);
}

// A helper to add numbers in Handlebars
function add(a: number, b: number) {
  return a + b;
}
// Genkit doesn't have built-in Handlebars helpers, so we can't register one this way.
// The logic must be in the prompt itself or the data passed to it.
// The above `add` function is just for illustration and won't be called.
