# 🤖 AI Setup - Production Ready!

Explicit provider selection - perfect for new free APIs!

## 🚀 One-Command Setup

```bash
# Setup with provider, API key, and optional model
npm run ai:setup openrouter sk-or-v1-your-key x-ai/grok-4-fast:free
npm run ai:setup openai sk-your-openai-key gpt-3.5-turbo
npm run ai:setup anthropic sk-ant-your-key claude-3-haiku-20240307
npm run ai:setup groq gsk_your-groq-key mixtral-8x7b-32768
npm run ai:setup ollama  # No API key needed for local

# Check current status
npm run ai:status
```

## 🔧 Manual Setup

Add these 3 lines to your `.env` file:

```bash
VITE_AI_PROVIDER=openrouter
VITE_AI_API_KEY=your_api_key_here
VITE_AI_MODEL=x-ai/grok-4-fast:free
```

## 📋 Available Providers

### 🔥 OpenRouter (Recommended for Free Models)

```bash
VITE_AI_PROVIDER=openrouter
VITE_AI_API_KEY=sk-or-v1-your-key
```

**Free Models**: `x-ai/grok-4-fast:free`, `x-ai/grok-beta:free`, `google/gemma-7b-it:free`  
**Paid Models**: `openai/gpt-4`, `anthropic/claude-3-haiku`  
**Get Key**: https://openrouter.ai/keys

### 🧠 OpenAI (Direct API)

```bash
VITE_AI_PROVIDER=openai
VITE_AI_API_KEY=sk-your-openai-key
```

**Models**: `gpt-3.5-turbo`, `gpt-4`, `gpt-4-turbo`  
**Get Key**: https://platform.openai.com/api-keys

### 🎭 Anthropic (Direct API)

```bash
VITE_AI_PROVIDER=anthropic
VITE_AI_API_KEY=sk-ant-your-key
```

**Models**: `claude-3-haiku-20240307`, `claude-3-sonnet-20240229`  
**Get Key**: https://console.anthropic.com/

### ⚡ Groq (Fast Inference)

```bash
VITE_AI_PROVIDER=groq
VITE_AI_API_KEY=gsk_your-groq-key
```

**Models**: `mixtral-8x7b-32768`, `llama2-70b-4096`  
**Get Key**: https://console.groq.com/keys

### 🏠 Ollama (Local)

```bash
VITE_AI_PROVIDER=ollama
# No API key needed
```

**Models**: `llama2`, `llama3`, `mistral`, `codellama`  
**Setup**: Install from https://ollama.ai/ then run `ollama pull llama2`

## ➕ Adding New Providers

When new free APIs become available, just add them to the provider configs:

**Frontend** (`src/config/aiConfig.js`):

```javascript
newprovider: {
  name: 'New Provider',
  baseUrl: 'https://api.newprovider.com/v1',
  authHeader: 'Authorization',
  authPrefix: 'Bearer',
  defaultModel: 'new-model-name',
  type: 'openai', // or 'anthropic' or 'custom'
},
```

**Backend** (`backend/services/aiProvider.js`):

```javascript
newprovider: {
  name: 'New Provider',
  baseUrl: 'https://api.newprovider.com/v1',
  authHeader: 'Authorization',
  authPrefix: 'Bearer',
  defaultModel: 'new-model-name',
  type: 'openai',
},
```

Then use it:

```bash
npm run ai:setup newprovider your-api-key model-name
```

Perfect for the rapidly changing AI landscape! 🚀
