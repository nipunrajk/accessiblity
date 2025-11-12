#!/usr/bin/env node

// =============================================================================
// 🤖 AI Provider Switcher - Super Simple CLI Tool
// =============================================================================
//
// Usage: node scripts/switch-ai-provider.js [provider]
// Example: node scripts/switch-ai-provider.js openrouter

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, '../src/config/aiConfig.js');

const providers = {
  openrouter: {
    name: 'OpenRouter (Grok)',
    description: '🔥 Free Grok models available!',
    setup: 'Get free API key at https://openrouter.ai/keys',
    envVar: 'VITE_OPENROUTER_API_KEY',
  },
  openai: {
    name: 'OpenAI (GPT)',
    description: '🧠 Most popular AI models',
    setup: 'Get API key at https://platform.openai.com/api-keys',
    envVar: 'VITE_OPENAI_API_KEY',
  },
  anthropic: {
    name: 'Anthropic (Claude)',
    description: '🎭 Excellent reasoning capabilities',
    setup: 'Get API key at https://console.anthropic.com/',
    envVar: 'VITE_ANTHROPIC_API_KEY',
  },
  groq: {
    name: 'Groq',
    description: '⚡ Lightning fast inference',
    setup: 'Get API key at https://console.groq.com/keys',
    envVar: 'VITE_GROQ_API_KEY',
  },
  ollama: {
    name: 'Ollama (Local)',
    description: '🏠 Run models locally, no API key needed',
    setup: 'Install from https://ollama.ai/ then run: ollama pull llama2',
    envVar: 'None (local)',
  },
};

function showHelp() {
  console.log('\n🤖 AI Provider Switcher\n');
  console.log('Usage: node scripts/switch-ai-provider.js [provider]\n');
  console.log('Available providers:');

  Object.entries(providers).forEach(([key, provider]) => {
    console.log(
      `  ${key.padEnd(12)} - ${provider.name} ${provider.description}`
    );
  });

  console.log('\nExamples:');
  console.log(
    '  node scripts/switch-ai-provider.js openrouter  # Switch to Grok'
  );
  console.log(
    '  node scripts/switch-ai-provider.js openai      # Switch to GPT'
  );
  console.log(
    '  node scripts/switch-ai-provider.js             # Show current provider'
  );
  console.log('');
}

function getCurrentProvider() {
  try {
    const config = fs.readFileSync(configPath, 'utf8');
    const match = config.match(/const ACTIVE_PROVIDER = '([^']+)'/);
    return match ? match[1] : 'unknown';
  } catch (error) {
    console.error('❌ Error reading config file:', error.message);
    return null;
  }
}

function switchProvider(newProvider) {
  if (!providers[newProvider]) {
    console.error(`❌ Invalid provider: ${newProvider}`);
    console.log('Available providers:', Object.keys(providers).join(', '));
    return false;
  }

  try {
    let config = fs.readFileSync(configPath, 'utf8');

    // Replace the ACTIVE_PROVIDER line
    config = config.replace(
      /const ACTIVE_PROVIDER = '[^']+'/,
      `const ACTIVE_PROVIDER = '${newProvider}'`
    );

    fs.writeFileSync(configPath, config);

    const provider = providers[newProvider];
    console.log(`✅ Switched to ${provider.name}!`);
    console.log(`📝 ${provider.description}`);
    console.log(`🔧 Setup: ${provider.setup}`);

    if (provider.envVar !== 'None (local)') {
      console.log(
        `🔑 Don't forget to set ${provider.envVar} in your .env file!`
      );
    }

    console.log('\n🔄 Restart your development server to apply changes.');

    return true;
  } catch (error) {
    console.error('❌ Error updating config file:', error.message);
    return false;
  }
}

function showCurrentProvider() {
  const current = getCurrentProvider();
  if (!current) return;

  const provider = providers[current];
  if (provider) {
    console.log(`\n🤖 Current AI Provider: ${provider.name}`);
    console.log(`📝 ${provider.description}`);
    console.log(`🔧 Setup: ${provider.setup}`);
    if (provider.envVar !== 'None (local)') {
      console.log(`🔑 Environment variable: ${provider.envVar}`);
    }
  } else {
    console.log(`\n🤖 Current provider: ${current} (unknown)`);
  }
  console.log('');
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  showCurrentProvider();
  showHelp();
} else if (args[0] === '--help' || args[0] === '-h') {
  showHelp();
} else {
  const newProvider = args[0];
  if (switchProvider(newProvider)) {
    console.log('');
  }
}
