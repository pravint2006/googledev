
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  CropRecommendationInputSchema,
  CropRecommendationResponseSchema,
  type CropRecommendationInput,
  type CropRecommendationResponse,
} from './crop-recommendation-types';
import { googleAI } from '@genkit-ai/google-genai';

function extractJson(text: string): any | null {
  const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
  const match = text.match(jsonRegex);

  if (match && match[1]) {
    try {
      return JSON.parse(match[1]);
    } catch (e) {
      console.error('Failed to parse extracted JSON:', e);
      return null;
    }
  }

  // Fallback for cases where there are no backticks
  try {
    return JSON.parse(text);
  } catch (e) {
    // Not valid JSON on its own
    return null;
  }
}

const recommendationPrompt = ai.definePrompt(
  {
    name: 'cropRecommendationPrompt',
    input: { schema: CropRecommendationInputSchema },
    output: { schema: CropRecommendationResponseSchema },
    config: {
      model: googleAI.model('gemini-1.5-flash-latest'),
      temperature: 0.2,
    },
    prompt: `
        You are an expert agricultural advisor for Indian farmers. Your task is to recommend 3-4 suitable plants or crops based on the provided data.

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

        Expected JSON structure:
        {
          "recommendations": [
            {
              "plant": "string (e.g., 'Wheat', 'Millet', 'Tomato')",
              "reason": "string (1-2 sentences explaining why it's a good choice)",
              "waterRequirement": "'low', 'medium', or 'high'",
              "plantingPeriod": "string (e.g., 'June-July', 'October-November')"
            }
          ]
        }

        CRITICAL INSTRUCTIONS:
        - Return ONLY raw JSON.
        - Do NOT include markdown '`' characters.
        - Do NOT include explanations, notes, or any text outside of the JSON structure.
        - The JSON must EXACTLY match the 'Expected JSON structure' defined above.
        - Ensure all string values are enclosed in double quotes.
        `,
  },
);

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
      return output;
    } catch (e: any) {
      // If parsing fails, try to extract from markdown
      if (e.output) {
        const cleanedJson = extractJson(e.output);
        if (cleanedJson) {
          // Attempt to re-validate the cleaned JSON
          const validationResult =
            CropRecommendationResponseSchema.safeParse(cleanedJson);
          if (validationResult.success) {
            return validationResult.data;
          } else {
            console.error(
              'Failed to validate cleaned JSON:',
              validationResult.error
            );
          }
        }
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
