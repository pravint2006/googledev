
import { z } from 'zod';

export const CropRecommendationInputSchema = z.object({
  location: z.string(),
  season: z.string(),
  tempMin: z.number(),
  tempMax: z.number(),
  rainfall: z.string(),
  soilType: z.string().optional(),
  waterSource: z.string().optional(),
  waterIrrigation: z.enum(['drip', 'flood', 'sprinkler', 'manual']).optional(),
  waterLevel: z.enum(['low', 'medium', 'high']).optional(),
  landOwned: z.number().optional(),
});

export type CropRecommendationInput = z.infer<
  typeof CropRecommendationInputSchema
>;
