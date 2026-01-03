#!/usr/bin/env node

const apiKey = 'AIzaSyDWyFbDfVFa-v6z9b_xqY9-6VecLEPu0ss';
const model = 'gemini-2.5-flash';

const testPrompt = async () => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: 'Say "API Key is working!" in one sentence',
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ API Error:', response.status, response.statusText);
      console.error('Details:', JSON.stringify(data, null, 2));
      return false;
    }

    console.log('✅ API Key is WORKING with gemini-2.5-flash!');
    console.log('Response:', data.candidates[0].content.parts[0].text);
    return true;
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    return false;
  }
};

testPrompt().then(success => {
  process.exit(success ? 0 : 1);
});
