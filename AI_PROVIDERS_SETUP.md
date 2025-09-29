# AI Providers Setup Guide

FastFix now supports multiple AI providers! You can choose from OpenAI, Anthropic Claude, Google Gemini, Groq, or run models locally with Ollama.

## Quick Setup

1. **Choose your AI provider** by setting `VITE_AI_PROVIDER` in your `.env` file
2. **Add the corresponding API key** for your chosen provider
3. **Restart the application**

## Supported Providers

### 1. OpenAI (Default)

```env
VITE_AI_PROVIDER=openai
VITE_OPENAI_API_KEY=sk-your-openai-key-here
VITE_OPENAI_MODEL=gpt-3.5-turbo-instruct
```

**How to get API key:**

- Go to [OpenAI Platform](https://platform.openai.com/api-keys)
- Create a new API key
- Copy the key (starts with `sk-`)

### 2. Anthropic Claude

```env
VITE_AI_PROVIDER=anthropic
VITE_ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
VITE_ANTHROPIC_MODEL=claude-3-sonnet-20240229
```

**How to get API key:**

- Go to [Anthropic Console](https://console.anthropic.com/)
- Create an API key
- Copy the key (starts with `sk-ant-`)

**Available models:**

- `claude-3-haiku-20240307` (fastest, cheapest)
- `claude-3-sonnet-20240229` (balanced)
- `claude-3-opus-20240229` (most capable)

### 3. Google Gemini

```env
VITE_AI_PROVIDER=google
VITE_GOOGLE_API_KEY=your-google-api-key-here
VITE_GOOGLE_MODEL=gemini-pro
```

**How to get API key:**

- Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
- Create an API key
- Copy the key

**Available models:**

- `gemini-pro` (text only)
- `gemini-pro-vision` (text and images)

### 4. Groq (Fast Inference)

```env
VITE_AI_PROVIDER=groq
VITE_GROQ_API_KEY=gsk_your-groq-key-here
VITE_GROQ_MODEL=mixtral-8x7b-32768
```

**How to get API key:**

- Go to [Groq Console](https://console.groq.com/keys)
- Create an API key
- Copy the key (starts with `gsk_`)

**Available models:**

- `mixtral-8x7b-32768` (Mixtral 8x7B)
- `llama2-70b-4096` (Llama 2 70B)
- `gemma-7b-it` (Google Gemma 7B)

### 5. Ollama (Local Models)

```env
VITE_AI_PROVIDER=ollama
VITE_OLLAMA_BASE_URL=http://localhost:11434
VITE_OLLAMA_MODEL=llama2
```

**Setup Ollama:**

1. Install Ollama from [ollama.ai](https://ollama.ai/)
2. Pull a model: `ollama pull llama2`
3. Start Ollama: `ollama serve`

**Popular models:**

- `llama2` (7B, 13B, 70B)
- `mistral` (7B)
- `codellama` (7B, 13B, 34B)
- `vicuna` (7B, 13B)

## Backend Configuration

Don't forget to update your `backend/.env` file with the same provider settings:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=your-key-here
OPENAI_MODEL=gpt-3.5-turbo
# ... add other provider configs as needed
```

## Switching Providers

1. Update your `.env` files with the new provider and API key
2. Restart both frontend and backend
3. The AI Provider Settings dropdown will show your current provider

## Cost Considerations

| Provider        | Cost (per 1M tokens) | Speed     | Quality   |
| --------------- | -------------------- | --------- | --------- |
| OpenAI GPT-3.5  | ~$0.50-2.00          | Fast      | Good      |
| OpenAI GPT-4    | ~$10-60              | Slow      | Excellent |
| Claude 3 Haiku  | ~$0.25-1.25          | Fast      | Good      |
| Claude 3 Sonnet | ~$3-15               | Medium    | Excellent |
| Claude 3 Opus   | ~$15-75              | Slow      | Best      |
| Google Gemini   | ~$0.50-2.00          | Fast      | Good      |
| Groq            | ~$0.27-2.70          | Very Fast | Good      |
| Ollama          | Free                 | Medium    | Varies    |

## Troubleshooting

### Common Issues

1. **"API key not set" error**

   - Make sure you've added the correct API key to your `.env` file
   - Restart the application after changing environment variables

2. **"Failed to get AI response" error**

   - Check if your API key is valid and has sufficient credits
   - Verify the model name is correct for your provider

3. **Ollama connection failed**

   - Make sure Ollama is running: `ollama serve`
   - Check if the model is installed: `ollama list`
   - Verify the base URL is correct (default: http://localhost:11434)

4. **Rate limiting errors**
   - Some providers have rate limits
   - Consider upgrading your API plan or switching providers

### Testing Your Setup

You can test your AI provider by running an analysis on any website. The AI Provider Settings dropdown will show your current configuration.

## Need Help?

- Check the browser console for detailed error messages
- Verify your API keys are valid and have sufficient credits
- Make sure you're using the correct model names for each provider
