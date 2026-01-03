#!/usr/bin/env node

const apiKey = 'AIzaSyDWyFbDfVFa-v6z9b_xqY9-6VecLEPu0ss';

const listModels = async () => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error:', response.status, response.statusText);
      console.error('Details:', JSON.stringify(data, null, 2));
      return;
    }

    console.log('✅ Available Models:');
    console.log('');
    data.models.forEach(model => {
      console.log(`- ${model.name}`);
      if (model.supportedGenerationMethods) {
        console.log(`  Methods: ${model.supportedGenerationMethods.join(', ')}`);
      }
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

listModels();
