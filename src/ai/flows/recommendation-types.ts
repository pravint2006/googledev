
import { z } from 'zod';
import { WeatherOutputSchema } from './weather-types';

export const RecommendationRequestSchema = z.object({
  weather: WeatherOutputSchema,
});
export type RecommendationRequest = z.infer<typeof RecommendationRequestSchema>;

const RecommendationSchema = z.object({
  id: z.string().describe('A unique ID for the recommendation (e.g., "watering-schedule").'),
  title: z.string().describe('A short, catchy title for the recommendation.'),
  description: z.string().describe('A one or two-sentence description of the recommendation, explaining the advice.'),
  category: z.enum(['Watering', 'Pest Control', 'Planting', 'Harvesting', 'General']).describe('The category of the recommendation.'),
  icon: z.enum(['Droplets', 'Bug', 'Sprout', 'Tractor', 'Info']).describe('An appropriate icon name from the available options.'),
});

export const RecommendationResponseSchema = z.object({
  recommendations: z.array(RecommendationSchema),
});
export type RecommendationResponse = z.infer<typeof RecommendationResponseSchema>;
