import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI({
      // Set a 60-second timeout for generative requests.
      // This is useful for complex prompts that may take longer to complete.
      clientOptions: {
        timeout: 60000,
      },
    }),
  ],
  // The model is inherited from the plugin, specifying it here is not needed
  // and can cause errors if the name is not perfectly matched.
});
