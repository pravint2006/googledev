
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

export const CropRecommendationResponseSchema = z.object({
  recommendations: z.array(
    z.object({
      plant: z.string(),
      reason: z.string(),
      waterRequirement: z.enum(['low', 'medium', 'high']),
      plantingPeriod: z.string(),
    })
  ),
});
export type CropRecommendationResponse = z.infer<
  typeof CropRecommendationResponseSchema
>;
