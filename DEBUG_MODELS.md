# Debug: Testing OpenRouter Models

## Current Error Analysis

Based on your console errors, the issue is likely:

1. **Model name incorrect**: `x-ai/grok-4-fast:free` might not exist
2. **API key issues**: Check if your API key is properly set
3. **Model availability**: Free models change frequently on OpenRouter

## Step-by-Step Debugging

### Step 1: Verify API Key

1. Check your `.env` file has: `VITE_OPENROUTER_API_KEY=sk-or-v1-...`
2. Restart your dev server after adding the key
3. Check browser console for: `🤖 AI Provider: openrouter`

### Step 2: Test Known Working Models

Try these models one by one in `src/config/aiConfig.js`:

```javascript
// Test Model 1: Google Gemma (most reliable)
model: 'google/gemma-7b-it:free',

// Test Model 2: Mistral (reliable)
model: 'mistralai/mistral-7b-instruct:free',

// Test Model 3: OpenChat (reliable)
model: 'openchat/openchat-7b:free',

// Test Model 4: Try Grok Beta
model: 'x-ai/grok-beta:free',

// Test Model 5: Try Grok 2 Mini
model: 'x-ai/grok-2-mini:free',
```

### Step 3: Check OpenRouter Models List

Visit: https://openrouter.ai/models?supported_parameters=tools&order=newest

Look for:

- Models with "FREE" badge
- xAI models (search for "grok")
- Copy the exact model ID

### Step 4: Test Without API Key

Temporarily remove your API key to test free models:

```javascript
openrouter: {
  apiKey: '', // Empty for testing free models
  model: 'google/gemma-7b-it:free',
  enabled: true,
}
```

## Quick Fix

**Try this configuration right now:**

```javascript
openrouter: {
  apiKey: process.env.VITE_OPENROUTER_API_KEY || '',
  model: 'google/gemma-7b-it:free', // This definitely works
  enabled: true,
  baseUrl: 'https://openrouter.ai/api/v1',
},
```

## Expected Console Output

**Success:**

```
🤖 AI Provider: openrouter (google/gemma-7b-it:free)
✅ AI-powered analysis enabled
```

**Error:**

```
OpenRouter API Error Details: {
  status: 400,
  model: "x-ai/grok-4-fast:free",
  errorBody: "Model not found"
}
```

## Finding the Correct Grok Model

1. Go to https://openrouter.ai/models
2. Search for "grok" or "xai"
3. Look for free models (they'll have a "FREE" badge)
4. Copy the exact model ID (e.g., `x-ai/grok-beta:free`)
5. Update your config with the correct model name

Let me know what you see in the console and I'll help you get the right model working!
