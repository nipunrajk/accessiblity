import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

console.log('Testing AI Provider Configuration...\n');
console.log('Environment Variables:');
console.log('AI_PROVIDER:', process.env.AI_PROVIDER);
console.log(
  'AI_API_KEY:',
  process.env.AI_API_KEY
    ? `${process.env.AI_API_KEY.substring(0, 10)}...`
    : 'NOT SET'
);
console.log('AI_MODEL:', process.env.AI_MODEL);
console.log('\n');

// Test the AI provider
async function testAI() {
  try {
    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.AI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.AI_MODEL,
          messages: [{ role: 'user', content: 'Say "Hello, AI is working!"' }],
          temperature: 0.7,
          max_tokens: 50,
        }),
      }
    );

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
