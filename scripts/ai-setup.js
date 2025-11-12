#!/usr/bin/env node

// =============================================================================
// 🤖 AI Setup - Production Ready!
// =============================================================================
//
// Usage: node scripts/ai-setup.js [provider] [api-key] [model]
// Example: node scripts/ai-setup.js openrouter sk-or-v1-abc123... x-ai/grok-4-fast:free

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendEnvPath = path.join(__dirname, '../.env');
const backendEnvPath = path.join(__dirname, '../backend/.env');

const providers = {
  openrouter: {
    name: 'OpenRouter',
    description: '🔥 Free Grok models + access to GPT, Claude, etc.',
    defaultModel: 'x-ai/grok-4-fast:free',
    needsApiKey: true,
    setup: 'Get free API key at https://openrouter.ai/keys',
    models: [
      'x-ai/grok-4-fast:free (Free)',
      'x-ai/grok-beta:free (Free)',
      'google/gemma-7b-it:free (Free)',
      'mistralai/mistral-7b-instruct:free (Free)',
      'openai/gpt-3.5-turbo (Paid)',
      'openai/gpt-4 (Paid)',
      'anthropic/claude-3-haiku (Paid)',
    ],
  },
  openai: {
    name: 'OpenAI',
    description: '🧠 Direct OpenAI API - GPT models',
    defaultModel: 'gpt-3.5-turbo',
    needsApiKey: true,
    setup: 'Get API key at https://platform.openai.com/api-keys',
    models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
  },
  anthropic: {
    name: 'Anthropic',
    description: '🎭 Direct Anthropic API - Claude models',
    defaultModel: 'claude-3-haiku-20240307',
    needsApiKey: true,
    setup: 'Get API key at https://console.anthropic.com/',
    models: [
      'claude-3-haiku-20240307',
      'claude-3-sonnet-20240229',
      'claude-3-opus-20240229',
    ],
  },
  groq: {
    name: 'Groq',
    description: '⚡ Lightning fast inference',
    defaultModel: 'mixtral-8x7b-32768',
    needsApiKey: true,
    setup: 'Get API key at https://console.groq.com/keys',
    models: ['mixtral-8x7b-32768', 'llama2-70b-4096', 'gemma-7b-it'],
  },
  ollama: {
    name: 'Ollama',
    description: '🏠 Local models - no API key needed',
    defaultModel: 'llama2',
    needsApiKey: false,
    setup: 'Install from https://ollama.ai/ then run: ollama pull llama2',
    models: ['llama2', 'llama3', 'mistral', 'codellama', 'gemma'],
  },
};

function showHelp() {
  console.log('\n🤖 AI Setup - Production Ready!\n');
  console.log('Usage: node scripts/ai-setup.js [provider] [api-key] [model]\n');
  console.log('Available providers:');

  Object.entries(providers).forEach(([key, provider]) => {
    const keyTag = provider.needsApiKey ? '(API Key)' : '(No Key)';
    console.log(`\n  ${key.padEnd(12)} - ${provider.name} ${keyTag}`);
    console.log(`    ${provider.description}`);
    console.log(`    Setup: ${provider.setup}`);
    console.log(
      `    Models: ${provider.models.slice(0, 3).join(', ')}${
        provider.models.length > 3 ? '...' : ''
      }`
    );
  });

  console.log('\nExamples:');
  console.log('  node scripts/ai-setup.js openrouter sk-or-v1-abc123...');
  console.log('  node scripts/ai-setup.js openai sk-abc123... gpt-4');
  console.log('  node scripts/ai-setup.js ollama  # No API key needed');
  console.log('  node scripts/ai-setup.js        # Show current status');
  console.log('');
}

function getCurrentConfig() {
  const configs = {};

  // Check frontend .env
  if (fs.existsSync(frontendEnvPath)) {
    const content = fs.readFileSync(frontendEnvPath, 'utf8');
    const providerMatch = content.match(/VITE_AI_PROVIDER=(.+)/);
    const apiKeyMatch = content.match(/VITE_AI_API_KEY=(.+)/);
    const modelMatch = content.match(/VITE_AI_MODEL=(.+)/);

    if (providerMatch || apiKeyMatch || modelMatch) {
      configs.frontend = {
        provider: providerMatch ? providerMatch[1] : '',
        apiKey: apiKeyMatch ? apiKeyMatch[1] : '',
        model: modelMatch ? modelMatch[1] : '',
      };
    }
  }

  // Check backend .env
  if (fs.existsSync(backendEnvPath)) {
    const content = fs.readFileSync(backendEnvPath, 'utf8');
    const providerMatch = content.match(/AI_PROVIDER=(.+)/);
    const apiKeyMatch = content.match(/AI_API_KEY=(.+)/);
    const modelMatch = content.match(/AI_MODEL=(.+)/);

    if (providerMatch || apiKeyMatch || modelMatch) {
      configs.backend = {
        provider: providerMatch ? providerMatch[1] : '',
        apiKey: apiKeyMatch ? apiKeyMatch[1] : '',
        model: modelMatch ? modelMatch[1] : '',
      };
    }
  }

  return configs;
}

function showCurrentStatus() {
  const configs = getCurrentConfig();

  console.log('\n🤖 Current AI Configuration:\n');

  if (configs.frontend) {
    const providerInfo = providers[configs.frontend.provider] || {
      name: configs.frontend.provider,
    };
    console.log(`Frontend: ${providerInfo.name || configs.frontend.provider}`);
    console.log(`  Provider: ${configs.frontend.provider}`);
    console.log(`  Model: ${configs.frontend.model}`);
    if (configs.frontend.apiKey) {
      console.log(`  API Key: ${configs.frontend.apiKey.substring(0, 8)}...`);
    } else {
      console.log(`  API Key: Not set`);
    }
  } else {
    console.log('Frontend: ❌ Not configured');
  }

  if (configs.backend) {
    const providerInfo = providers[configs.backend.provider] || {
      name: configs.backend.provider,
    };
    console.log(`Backend:  ${providerInfo.name || configs.backend.provider}`);
    console.log(`  Provider: ${configs.backend.provider}`);
    console.log(`  Model: ${configs.backend.model}`);
    if (configs.backend.apiKey) {
      console.log(`  API Key: ${configs.backend.apiKey.substring(0, 8)}...`);
    } else {
      console.log(`  API Key: Not set`);
    }
  } else {
    console.log('Backend:  ❌ Not configured');
  }

  if (!configs.frontend && !configs.backend) {
    console.log('No AI configuration found.');
  }

  console.log('');
}

function setupAI(providerName, apiKey, model) {
  if (!providers[providerName]) {
    console.error(`❌ Invalid provider: ${providerName}`);
    console.log('Available providers:', Object.keys(providers).join(', '));
    return false;
  }

  const provider = providers[providerName];

  // Check if API key is needed
  if (provider.needsApiKey && !apiKey) {
    console.error(`❌ API key required for ${provider.name}`);
    console.log(`🔧 ${provider.setup}`);
    return false;
  }

  // Use provided model or default
  const finalModel = model || provider.defaultModel;

  try {
    // Setup frontend .env
    const frontendConfig = `# AI Configuration - Auto-generated
VITE_AI_PROVIDER=${providerName}
VITE_AI_API_KEY=${apiKey || ''}
VITE_AI_MODEL=${finalModel}

# API Configuration
VITE_API_URL=http://localhost:3001
`;

    fs.writeFileSync(frontendEnvPath, frontendConfig);
    console.log(`✅ Frontend configured: ${frontendEnvPath}`);

    // Setup backend .env
    const backendConfig = `# AI Configuration - Auto-generated
AI_PROVIDER=${providerName}
AI_API_KEY=${apiKey || ''}
AI_MODEL=${finalModel}

# Server Configuration
PORT=3001
NODE_ENV=development
`;

    // Create backend directory if it doesn't exist
    const backendDir = path.dirname(backendEnvPath);
    if (!fs.existsSync(backendDir)) {
      fs.mkdirSync(backendDir, { recursive: true });
    }

    fs.writeFileSync(backendEnvPath, backendConfig);
    console.log(`✅ Backend configured: ${backendEnvPath}`);

    console.log(`\n🎉 Successfully configured ${provider.name}!`);
    console.log(`📝 ${provider.description}`);
    console.log(`🤖 Provider: ${providerName}`);
    console.log(`🎯 Model: ${finalModel}`);

    if (apiKey) {
      console.log(`🔑 API Key: ${apiKey.substring(0, 8)}...`);
    } else {
      console.log(`🆓 No API key needed`);
    }

    console.log('\n🔄 Restart your development servers to apply changes.');

    return true;
  } catch (error) {
    console.error('❌ Error setting up configuration:', error.message);
    return false;
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  showCurrentStatus();
  showHelp();
} else if (args[0] === '--help' || args[0] === '-h') {
  showHelp();
} else {
  const providerName = args[0];
  const apiKey = args[1];
  const model = args[2];

  if (setupAI(providerName, apiKey, model)) {
    console.log('');
  }
}
