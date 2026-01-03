
'use server';
/**
 * @fileOverview A crop recommendation AI agent.
 * This file defines the Genkit flow for generating crop recommendations
 * based on weather and environmental data.
 */
import { ai } from '@/ai/genkit';
import {
  CropRecommendationRequest,
  CropRecommendationRequestSchema,
  CropRecommendationResponse,
  CropRecommendationResponseSchema,
} from './crop-recommendation-types';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * The main prompt for the crop recommendation AI.
 * It takes a request object and returns a structured response.
 */
const recommendationPrompt = ai.definePrompt({
  name: 'cropRecommendationPrompt',
  input: { schema: CropRecommendationRequestSchema },
  output: { schema: CropRecommendationResponseSchema },
  config: {
    model: googleAI.model('gemini-1.5-flash-latest'),
    temperature: 0.2,
  },
  prompt: `
    You are an expert agricultural advisor for Indian farmers. Your task is to recommend 3-4 suitable plants or crops for the upcoming period based on the provided data.

    Your recommendations should be practical, clear, and easy for a farmer to understand.

    INPUT DATA:
    - Location (India): {{location}}
    - Season: {{season}}
    - Temperature Range (°C): {{temperatureRange}}
    - Rainfall Level: {{rainfall}}
    - Soil Type: {{soilType}}
    - Water Source: {{waterSource}}

    YOUR TASK:
    For each recommended plant/crop, provide:
    1.  The plant name.
    2.  A brief explanation (1-2 sentences) of why it is suitable.
    3.  The water requirement (low, medium, or high).
    4.  The ideal planting period.

    CRITICAL INSTRUCTIONS:
    - Return ONLY raw JSON.
    - Do NOT include markdown formatting (e.g., \`\`\`json).
    - Do NOT include any explanations or text outside of the JSON structure.
    - The JSON output must EXACTLY match the following structure:
      {
        "recommendations": [
          {
            "plant": "string",
            "reason": "string",
            "waterRequirement": "low | medium | high",
            "plantingPeriod": "string"
          }
        ]
      }
    `,
});

/**
 * The Genkit flow that orchestrates the crop recommendation process.
 */
const getRecommendationsFlow = ai.defineFlow(
  {
    name: 'getRecommendationsFlow',
    inputSchema: CropRecommendationRequestSchema,
    outputSchema: CropRecommendationResponseSchema,
  },
  async (request) => {
    const { text, output } = await recommendationPrompt(request);

    if (output) {
      // If Genkit successfully parsed the output, return it directly.
      return output;
    }

    // If Genkit failed, try to manually parse the raw text output.
    console.log("Genkit parsing failed, attempting manual parse of raw text:", text);
    try {
      // Look for a JSON block within markdown code fences
      const jsonMatch = text?.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        const extractedJson = JSON.parse(jsonMatch[1]);
        // Validate the manually extracted JSON against the schema
        const validationResult = CropRecommendationResponseSchema.safeParse(extractedJson);
        if (validationResult.success) {
          return validationResult.data;
        } else {
          console.error("Manually extracted JSON failed validation:", validationResult.error);
        }
      }
      
      // If no markdown block, try parsing the whole text
      const parsedText = JSON.parse(text || '');
      const validationResult = CropRecommendationResponseSchema.safeParse(parsedText);
       if (validationResult.success) {
          return validationResult.data;
        } else {
           console.error("Raw text JSON failed validation:", validationResult.error);
        }

    } catch (e) {
      console.error('Error during manual AI recommendation parsing:', e);
      if (text) {
        console.error('AI raw text:', text);
      }
      throw new Error('Failed to generate valid recommendations from AI.');
    }

    throw new Error('Failed to generate valid recommendations from AI.');
  }
);

/**
 * An exported async function that wraps the Genkit flow.
 * This is the function that server components or API routes will call.
 *
 * @param {CropRecommendationRequest} request The request object for recommendations.
 * @returns {Promise<CropRecommendationResponse>} A promise that resolves with the AI's recommendations.
 */
export async function getRecommendations(
  request: CropRecommendationRequest
): Promise<CropRecommendationResponse> {
  return getRecommendationsFlow(request);
}
