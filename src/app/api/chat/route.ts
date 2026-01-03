import { NextRequest, NextResponse } from 'next/server';
import { googleAI } from '@genkit-ai/google-genai';
import { ai } from '@/ai/genkit';

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    if (!message || !context) {
      return NextResponse.json(
        { error: 'Message and context are required' },
        { status: 400 }
      );
    }

    // Create a prompt with context
    const prompt = `You are an expert agricultural advisor for Indian farmers with deep knowledge of crop farming.

${context}

Provide a helpful, concise response (2-3 sentences) based on the user's farm information and current conditions.
Focus on practical, actionable advice.`;

    // Call Gemini API
    const result = await ai.generate({
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

    return NextResponse.json({
      response: result.text,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
