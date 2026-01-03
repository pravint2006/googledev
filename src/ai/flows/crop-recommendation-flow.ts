'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  CropRecommendationInput,
  CropRecommendationInputSchema,
} from './crop-recommendation-types';

const recommendationPrompt = ai.definePrompt({
  name: 'cropRecommendationCsvPrompt',
  input: { schema: CropRecommendationInputSchema },
  prompt: `
You are an expert agricultural advisor for Indian farmers.

Return ONLY valid CSV.

Headers:
plant,reason,waterRequirement,plantingPeriod

Context:
Location: {{location}}
Season: {{season}}
Temperature: {{tempMin}}°C - {{tempMax}}°C
Rainfall: {{rainfall}}
Soil: {{soilType}}
Water Source: {{waterSource}}

Rules:
- 3 to 4 crops only
- No markdown
- No extra text
`,
});

export const getRecommendationsFlow = ai.defineFlow(
  {
    name: 'getRecommendationsCsvFlow',
    input: { schema: CropRecommendationInputSchema },
    output: { schema: z.string() },
  },
  async (input) => {
    const res = await ai.generate({
      model: 'googleai/gemini-pro',
      prompt: recommendationPrompt,
      input: {
        ...input,
        soilType: input.soilType ?? 'Loam',
        waterSource: input.waterSource ?? 'Irrigation',
      },
      config: { temperature: 0.4 },
    });

    const text = res.text()?.trim() ?? '';

    if (!text.startsWith('plant,reason')) {
      throw new Error('AI returned invalid CSV');
    }

    return text;
  }
);

export async function getRecommendations(
  input: CropRecommendationInput
): Promise<string> {
  return getRecommendationsFlow.run(input);
}
