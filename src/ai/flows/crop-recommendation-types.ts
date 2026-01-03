import { z } from 'zod';

/**
 * Defines the schema for the input data required by the crop recommendation flow.
 */
export const CropRecommendationRequestSchema = z.object({
  location: z.string().describe('The geographical location in India.'),
  season: z
    .enum(['Kharif', 'Rabi', 'Summer'])
    .describe('The current farming season.'),
  temperatureRange: z
    .string()
    .describe('The expected temperature range, e.g., "25°C - 35°C".'),
  rainfall: z
    .enum(['low', 'medium', 'high'])
    .describe('The expected level of rainfall.'),
  soilType: z.string().describe('The type of soil, e.g., "Loamy", "Clay".'),
  waterSource: z
    .enum(['rain-fed', 'irrigation'])
    .describe('The primary source of water for the crops.'),
});

export type CropRecommendationRequest = z.infer<
  typeof CropRecommendationRequestSchema
>;

/**
 * Defines the schema for the structured JSON response expected from the AI.
 */
export const CropRecommendationResponseSchema = z.object({
  recommendations: z.array(
    z.object({
      plant: z.string().describe('The name of the recommended plant or crop.'),
      reason: z
        .string()
        .describe(
          'A short explanation (1-2 sentences) for why the crop is suitable.'
        ),
      waterRequirement: z
        .enum(['low', 'medium', 'high'])
        .describe('The water requirement for the crop.'),
      plantingPeriod: z
        .string()
        .describe('The ideal planting period for the crop.'),
    })
  ),
});

export type CropRecommendationResponse = z.infer<
  typeof CropRecommendationResponseSchema
>;
