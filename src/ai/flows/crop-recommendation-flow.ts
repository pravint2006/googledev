
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const CropRecommendationInputSchema = z.object({
  location: z.string(),
  season: z.string(),
  tempMin: z.number(),
  tempMax: z.number(),
  rainfall: z.string(),
  soilType: z.string().optional(),
  waterSource: z.string().optional(),
});
export type CropRecommendationInput = z.infer<
  typeof CropRecommendationInputSchema
>;

const recommendationPrompt = ai.definePrompt({
  name: 'cropRecommendationCsvPrompt',
  input: { schema: CropRecommendationInputSchema },
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
      - Generate a list of 3-4 crop recommendations suitable for the upcoming planting period.
      - Return the data as a CSV (Comma-Separated Values) string.
      - The CSV headers must be: plant,reason,waterRequirement,plantingPeriod
      - Each recommendation should be on a new line.
      - Do NOT include any text, explanations, or markdown before or after the CSV data.

      EXAMPLE OUTPUT:
      plant,reason,waterRequirement,plantingPeriod
      Tomato,"Thrives in these temperatures and loamy soil. Good market demand.","medium","June-July"
      "Lady's Finger (Okra)","Resistant to heat and suitable for the observed rainfall patterns.","low","June-July"
      "Brinjal (Eggplant)","Well-suited for the Kharif season with these conditions.","medium","June-July"
      `,
});

const getRecommendationsFlow = ai.defineFlow(
  {
    name: 'getRecommendationsCsvFlow',
    inputSchema: CropRecommendationInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    try {
      const { output } = await recommendationPrompt(input);
      if (!output) {
        // Return a header-only CSV string if AI returns no output
        return 'plant,reason,waterRequirement,plantingPeriod';
      }
      return output.trim();
    } catch (e: any) {
      console.error(
        'Failed to generate recommendations from AI:',
        e.message
      );
      // If the model output is available in the error, log it for debugging.
      if (e.output) {
        console.error('AI raw output:', e.output);
      }
      // Return a specific error string that the frontend can check for.
      return 'AI_ERROR:Could not generate recommendations.';
    }
  }
);

export async function getRecommendations(
  input: CropRecommendationInput
): Promise<string> {
  return await getRecommendationsFlow(input);
}
