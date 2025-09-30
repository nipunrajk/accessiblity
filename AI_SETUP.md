# AI Configuration Guide

FastFix supports multiple AI providers for enhanced website analysis. Follow these simple steps to enable AI features:

## Quick Setup (Recommended)

### Option 1: xAI Grok 4 Fast (Newest & Fastest - Recommended)

1. Get API key from [OpenRouter](https://openrouter.ai/keys)
2. Add to `.env` file: `VITE_OPENROUTER_API_KEY=your_key_here`
3. Model `x-ai/grok-4-fast:free` is already selected in `src/config/aiConfig.js`
4. That's it! Grok 4 Fast is free and lightning fast.

### Option 2: Free AI Models (No API Key Required)

1. Open `src/config/aiConfig.js`
2. Set `openrouter.enabled = true` (already enabled by default)
3. Works without API key but with rate limits.

### Option 3: OpenAI (Most Popular)

1. Get API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add to `.env` file: `VITE_OPENAI_API_KEY=your_key_here`
3. In `src/config/aiConfig.js`, set `openai.enabled = true`

### Option 4: Anthropic Claude (Great for Analysis)

1. Get API key from [Anthropic Console](https://console.anthropic.com/)
2. Add to `.env` file: `VITE_ANTHROPIC_API_KEY=your_key_here`
3. In `src/config/aiConfig.js`, set `anthropic.enabled = true`

## Configuration File

Edit `src/config/aiConfig.js` to:

- Enable/disable providers
- Choose AI models
- Set API keys directly (alternative to .env)

## Supported Providers

| Provider      | Free Option    | API Key Required | Best For              |
| ------------- | -------------- | ---------------- | --------------------- |
| xAI Grok 4    | ✅ Yes         | ✅ Yes\*         | Latest & fastest AI   |
| OpenRouter    | ✅ Yes         | ❌ No            | Getting started       |
| OpenAI        | ❌ No          | ✅ Yes           | High quality analysis |
| Anthropic     | ❌ No          | ✅ Yes           | Detailed reasoning    |
| Google Gemini | ❌ No          | ✅ Yes           | Fast responses        |
| Groq          | ❌ No          | ✅ Yes           | Ultra-fast inference  |
| Ollama        | ✅ Yes (Local) | ❌ No            | Privacy & offline use |

\*xAI Grok 4 Fast is free but requires OpenRouter API key for better rate limits

## Environment Variables

Copy `.env.example` to `.env` and add your API keys:

```bash
cp .env.example .env
# Edit .env with your API keys
```

## Verification

Check the browser console when running the app:

- ✅ `🤖 AI Provider: openrouter (google/gemma-7b-it:free)` - AI is working
- ℹ️ `AI not configured. Check src/config/aiConfig.js` - AI needs setup

## Troubleshooting

1. **No AI analysis showing?**

   - Check `src/config/aiConfig.js` - ensure at least one provider is `enabled: true`
   - Verify API keys in `.env` file or config file

2. **API errors?**

   - Check API key validity
   - Verify you have credits/quota remaining
   - Check browser console for detailed error messages

3. **Want to switch providers?**
   - Disable current provider: `enabled: false`
   - Enable new provider: `enabled: true`
   - Restart the development server

## Local AI with Ollama

For privacy and offline use:

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Download a model
ollama pull llama2

# Enable in config
# Set ollama.enabled = true in src/config/aiConfig.js
```

## Cost Considerations

- **Free**: OpenRouter free models, Ollama local models
- **Low cost**: OpenAI GPT-3.5-turbo (~$0.002/1K tokens)
- **Premium**: OpenAI GPT-4, Anthropic Claude 3 Opus

Most website analyses cost less than $0.01 per analysis with paid models.
