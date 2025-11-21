import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

// Import config module
import { config, getAIProviderConfig } from './config/index.js';

console.log('Testing AI Provider Configuration...\n');
console.log('Configuration:');
console.log('AI_PROVIDER:', config.ai.provider);
console.log(
  'AI_API_KEY:',
  config.ai.apiKey ? `${config.ai.apiKey.substring(0, 10)}...` : 'NOT SET'
);
console.log('AI_MODEL:', config.ai.model);
console.log('\n');

// Test the AI provider
async function testAI() {
  try {
    const providerConfig = getAIProviderConfig();

    if (!providerConfig || !providerConfig.available) {
      console.error('❌ AI provider not available');
      return;
    }

    const response = await fetch(`${providerConfig.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        [providerConfig.authHeader]:
          `${providerConfig.authPrefix} ${providerConfig.apiKey}`.trim(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: providerConfig.model,
        messages: [{ role: 'user', content: 'Say "Hello, AI is working!"' }],
        temperature: 0.7,
        max_tokens: 50,
      }),
    });

    console.log('Response status:', response.status, response.statusText);

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ API Error:', JSON.stringify(data, null, 2));
      return;
    }

    console.log('✅ Success!');
    console.log('Response:', data.choices[0]?.message?.content);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

testAI();
