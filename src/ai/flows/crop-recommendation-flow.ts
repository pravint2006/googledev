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
    // Create a month-specific crop list based on planting seasons
    const cropsByMonth: { [key: string]: string[] } = {
      'January': ['Wheat', 'Chickpea', 'Mustard', 'Lentil', 'Onion', 'Potato'],
      'February': ['Wheat', 'Chickpea', 'Mustard', 'Lentil', 'Onion'],
      'March': ['Wheat', 'Onion', 'Tomato'],
      'April': ['Cotton', 'Corn', 'Tomato', 'Sugarcane'],
      'May': ['Cotton', 'Corn', 'Soybean', 'Sugarcane'],
      'June': ['Rice', 'Corn', 'Soybean', 'Cotton', 'Sugarcane'],
      'July': ['Rice', 'Corn', 'Soybean', 'Cotton'],
      'August': ['Rice', 'Potato', 'Onion'],
      'September': ['Wheat', 'Mustard', 'Potato', 'Onion', 'Sugarcane'],
      'October': ['Wheat', 'Chickpea', 'Mustard', 'Potato', 'Onion', 'Lentil', 'Sugarcane'],
      'November': ['Wheat', 'Chickpea', 'Mustard', 'Lentil', 'Sugarcane'],
      'December': ['Wheat', 'Chickpea', 'Onion', 'Lentil'],
    };

    // Soil type compatibility mapping
    const cropsBySoil: { [key: string]: string[] } = {
      'clay': ['Rice', 'Sugarcane', 'Onion'],
      'sandy': ['Mustard', 'Potato'],
      'loamy': ['Wheat', 'Rice', 'Cotton', 'Corn', 'Chickpea', 'Mustard', 'Potato', 'Onion', 'Tomato', 'Lentil', 'Soybean'],
      'chalky': ['Wheat', 'Mustard', 'Onion'],
      'silt': ['Wheat', 'Rice', 'Tomato', 'Onion'],
      'peaty': ['Potato', 'Tomato'],
    };

    const currentDate = new Date(input.location ? new Date() : new Date());
    const monthName = currentDate.toLocaleString('en-US', { month: 'long' });
    const monthCrops = cropsByMonth[monthName] || [];
    
    // Get crops suitable for the soil type
    const soilType = (input.soilType || 'loamy').toLowerCase();
    const soilCrops = cropsBySoil[soilType] || cropsBySoil['loamy'];
    
    // Find intersection of month crops and soil crops
    const allowedCrops = monthCrops.filter(crop => soilCrops.includes(crop));
    const cropsListStr = allowedCrops.length > 0 ? allowedCrops.join(', ') : monthCrops.join(', ');

    const prompt = `You are an expert agricultural advisor for Indian farmers.

Return ONLY valid CSV with NO extra text or markdown.

HEADERS (exactly as shown):
plant,reason,waterRequirement,plantingPeriod

IMPORTANT INSTRUCTIONS:
1. ONLY recommend crops that are:
   - Plantable in ${monthName}
   - Suitable for ${soilType} soil
   - From this list: ${cropsListStr}
2. Return EXACTLY 2-3 BEST crops for this month and soil
3. waterRequirement must be: low, medium, or high
4. plantingPeriod must be SHORT month abbreviations (e.g., Sep-Oct, Jun-Jul, Aug-Sep)
5. Do NOT include quotes around values
6. Do NOT include any text outside the CSV
7. No markdown, no explanation, only CSV

EXAMPLE OUTPUT:
plant,reason,waterRequirement,plantingPeriod
Wheat,Excellent for winter in loamy soil,medium,Sep-Oct
Chickpea,Protein-rich for loamy soil,low,Oct-Nov

Farmer Details:
Location: ${input.location}
Soil Type: ${soilType}
Season: ${input.season}
Temperature: ${input.tempMin}°C - ${input.tempMax}°C
Rainfall: ${input.rainfall}
Water Source: ${input.waterSource ?? 'Irrigation'}
${input.waterIrrigation ? `Irrigation Type: ${input.waterIrrigation}` : ''}
${input.waterLevel ? `Water Availability: ${input.waterLevel}` : ''}
${input.landOwned ? `Land Size: ${input.landOwned} acres` : ''}`;

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

