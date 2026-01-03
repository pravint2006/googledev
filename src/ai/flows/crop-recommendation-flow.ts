
'use server';

import { ai } from '@/ai/genkit';
import {
  CropRecommendationInputSchema,
  CropRecommendationResponseSchema,
  type CropRecommendationInput,
  type CropRecommendationResponse,
} from './crop-recommendation-types';
import { googleAI } from '@genkit-ai/google-genai';

const recommendationPrompt = ai.definePrompt({
  name: 'cropRecommendationPrompt',
  input: { schema: CropRecommendationInputSchema },
  output: { schema: CropRecommendationResponseSchema },
  config: {
    model: googleAI.model('gemini-1.5-flash-latest'),
    temperature: 0.2,
  },
  prompt: `
      You are an expert agricultural advisor for Indian farmers. 
      Your task is to recommend 3-4 suitable plants or crops based on the provided data.

      CONTEXT:
      - Location: {{location}} (in India)
      - Current Season: {{season}}
      - 7-Day Temperature Forecast: {{tempMin}}°C - {{tempMax}}°C
      - 7-Day Rainfall Level: {{rainfall}}
      - Soil Type: {{soilType}} (Assume 'Loam' if not provided)
      - Water Source: {{waterSource}}

      YOUR TASK:
      - Based on the context above, generate a list of 3-4 crop recommendations suitable for the upcoming planting period.
      - For each recommendation, provide the plant name, a short reason for its suitability, its water requirement, and the ideal planting period.
      - Keep the language simple and direct for a farmer.
      `,
});

const getRecommendationsFlow = ai.defineFlow(
  {
    name: 'getRecommendationsFlow',
    inputSchema: CropRecommendationInputSchema,
    outputSchema: CropRecommendationResponseSchema,
  },
  async (input) => {
    try {
      const { output } = await recommendationPrompt(input);
      if (!output) {
        throw new Error('AI returned no output.');
      }
      // Genkit's `output: { schema: ... }` handles the parsing.
      // If it fails, it will throw an error that we catch below.
      return output;
    } catch (e: any) {
      console.error(
        'Failed to generate or parse recommendations from AI:',
        e.message
      );
      // If the model output is available in the error, log it for debugging.
      if (e.output) {
        console.error('AI raw output:', e.output);
      }
      throw new Error('Failed to generate valid recommendations from AI.');
    }
  }
);

export async function getRecommendations(
  input: CropRecommendationInput
): Promise<CropRecommendationResponse> {
  return await getRecommendationsFlow(input);
}
