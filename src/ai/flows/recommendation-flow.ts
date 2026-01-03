
'use server';

import { ai } from '@/ai/genkit';
import {
  RecommendationRequest,
  RecommendationRequestSchema,
  RecommendationResponse,
  RecommendationResponseSchema,
} from './recommendation-types';
import { googleAI } from '@genkit-ai/google-genai';

// A helper to add numbers in Handlebars
const addHelper = (a: number, b: number) => a + b;

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

Return ONLY valid JSON that strictly matches RecommendationResponseSchema. Do NOT include explanations, markdown, or any extra text outside of the JSON structure.
`,
  config: {
    // Add the helper function to the prompt configuration
    helpers: { add: addHelper },
  }
});

const getRecommendationsFlow = ai.defineFlow(
  {
    name: 'getRecommendationsFlow',
    inputSchema: RecommendationRequestSchema,
    outputSchema: RecommendationResponseSchema,
  },
  async (request) => {
    try {
      const { output } = await recommendationPrompt(request);
      if (!output) {
        throw new Error('AI returned no output.');
      }
      // The definePrompt will handle Zod validation. If it fails, it will throw.
      return output;
    } catch (e: any) {
        console.error("Error during AI recommendation generation:", e);
        // Log the raw output if available on the error object
        if (e.output) {
            console.error("Gemini raw output:", e.output);
        }
        // Re-throw a more informative error
        throw new Error('Failed to generate valid recommendations from AI.');
    }
  }
);

export async function getRecommendations(
  request: RecommendationRequest
): Promise<RecommendationResponse> {
  return getRecommendationsFlow(request);
}
