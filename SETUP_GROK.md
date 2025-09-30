# Quick Setup: xAI Grok 4 Fast Integration

Since you have an OpenRouter API key, here's how to enable xAI Grok 4 Fast in 2 simple steps:

## Method 1: Environment Variable (Recommended)

1. **Create/Edit `.env` file in your project root:**

```bash
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
```

2. **That's it!** The config is already set to use `x-ai/grok-4-fast:free` model.

## Method 2: Direct in Config File

1. **Edit `src/config/aiConfig.js`:**

```javascript
openrouter: {
  apiKey: 'your_openrouter_api_key_here', // Add your key directly here
  model: 'x-ai/grok-4-fast:free', // Already set
  enabled: true, // Already enabled
  baseUrl: 'https://openrouter.ai/api/v1',
},
```

## Verification

1. **Start the app:** `npm run dev`
2. **Check browser console** for:
   ```
   🤖 AI Provider: openrouter (x-ai/grok-4-fast:free)
   ✅ AI-powered analysis enabled
   ```
3. **Run a website analysis** - you should see AI insights!

## Why xAI Grok 4 Fast?

- ⚡ **Fastest**: Lightning-fast responses
- 🆓 **Free**: No cost per request
- 🧠 **Latest**: Most recent AI model from xAI
- 🔥 **High Quality**: Excellent analysis capabilities

## Troubleshooting

- **No AI insights?** Check the browser console for error messages
- **API errors?** Verify your OpenRouter API key is correct
- **Rate limits?** xAI Grok 4 Fast has generous free limits

Your OpenRouter API key will work immediately with the current configuration!
