'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/google-genai';
import {
  CropRecommendationInput,
  CropRecommendationInputSchema,
} from './crop-recommendation-types';

const getRecommendationsFlow = ai.defineFlow(
  {
    name: 'getRecommendationsCsvFlow',
    inputSchema: CropRecommendationInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const prompt = `You are an expert agricultural advisor for Indian farmers.

Return ONLY valid CSV.

Headers:
plant,reason,waterRequirement,plantingPeriod

Context:
Location: ${input.location}
Season: ${input.season}
Temperature: ${input.tempMin}°C - ${input.tempMax}°C
Rainfall: ${input.rainfall}
Soil: ${input.soilType ?? 'Loam'}
Water Source: ${input.waterSource ?? 'Irrigation'}
${input.waterIrrigation ? `Irrigation Type: ${input.waterIrrigation}` : ''}
${input.waterLevel ? `Water Availability: ${input.waterLevel}` : ''}
${input.landOwned ? `Land Size: ${input.landOwned} acres` : ''}

Rules:
- 3 to 4 crops only
- Prioritize crops suitable for the specified irrigation type and water availability
- Consider land size for recommended crops
- No markdown
- No extra text`;

    const res = await ai.generate({
      model: googleAI.model('gemini-2.5-flash'),
      messages: [
        {
          role: 'user',
          content: [
            {
              text: prompt,
            },
          ],
        },
      ],
    });

    const text = res.text.trim();

    if (!text.startsWith('plant,reason')) {
      throw new Error('AI returned invalid CSV');
    }

    return text;
  }
);

export async function getRecommendations(
  input: CropRecommendationInput
): Promise<string> {
  return await getRecommendationsFlow(input);
}

