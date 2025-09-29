import { OpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';

// AI Provider Configuration
const AI_PROVIDER = import.meta.env.VITE_AI_PROVIDER || 'openai';

// API Keys
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const OLLAMA_BASE_URL =
  import.meta.env.VITE_OLLAMA_BASE_URL || 'http://localhost:11434';

// Models
const OPENAI_MODEL =
  import.meta.env.VITE_OPENAI_MODEL || 'gpt-3.5-turbo-instruct';
const ANTHROPIC_MODEL =
  import.meta.env.VITE_ANTHROPIC_MODEL || 'claude-3-sonnet-20240229';
const GOOGLE_MODEL = import.meta.env.VITE_GOOGLE_MODEL || 'gemini-pro';
const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || 'mixtral-8x7b-32768';
const OLLAMA_MODEL = import.meta.env.VITE_OLLAMA_MODEL || 'llama2';

class AIProviderService {
  constructor() {
    this.model = this.initializeModel();
  }

  initializeModel() {
    switch (AI_PROVIDER.toLowerCase()) {
      case 'openai':
        if (!OPENAI_API_KEY) {
          throw new Error(
            'OpenAI API key is not set. Please check your .env file.'
          );
        }
        return new OpenAI({
          openAIApiKey: OPENAI_API_KEY,
          modelName: OPENAI_MODEL,
          temperature: 0.7,
        });

      case 'anthropic':
        if (!ANTHROPIC_API_KEY) {
          throw new Error(
            'Anthropic API key is not set. Please check your .env file.'
          );
        }
        return new ChatAnthropic({
          anthropicApiKey: ANTHROPIC_API_KEY,
          modelName: ANTHROPIC_MODEL,
          temperature: 0.7,
        });

      case 'google':
        if (!GOOGLE_API_KEY) {
          throw new Error(
            'Google API key is not set. Please check your .env file.'
          );
        }
        return new ChatGoogleGenerativeAI({
          apiKey: GOOGLE_API_KEY,
          modelName: GOOGLE_MODEL,
          temperature: 0.7,
        });

      case 'groq':
        if (!GROQ_API_KEY) {
          throw new Error(
            'Groq API key is not set. Please check your .env file.'
          );
        }
        // Groq uses OpenAI-compatible API
        return new OpenAI({
          openAIApiKey: GROQ_API_KEY,
          modelName: GROQ_MODEL,
          temperature: 0.7,
          configuration: {
            baseURL: 'https://api.groq.com/openai/v1',
          },
        });

      case 'ollama':
        return new OpenAI({
          openAIApiKey: 'ollama', // Ollama doesn't require API key
          modelName: OLLAMA_MODEL,
          temperature: 0.7,
          configuration: {
            baseURL: `${OLLAMA_BASE_URL}/v1`,
          },
        });

      default:
        console.warn(
          `Unknown AI provider: ${AI_PROVIDER}. Falling back to OpenAI.`
        );
        return new OpenAI({
          openAIApiKey: OPENAI_API_KEY,
          modelName: OPENAI_MODEL,
          temperature: 0.7,
        });
    }
  }

  async invoke(prompt, input) {
    try {
      const formattedPrompt = await prompt.format(input);
      const response = await this.model.invoke(formattedPrompt);

      // Handle different response formats
      if (typeof response === 'string') {
        return response;
      } else if (response?.content) {
        return response.content;
      } else if (response?.choices?.[0]?.message?.content) {
        return response.choices[0].message.content;
      } else {
        return response;
      }
    } catch (error) {
      console.error(`AI Provider (${AI_PROVIDER}) error:`, error);
      throw new Error(`Failed to get AI response: ${error.message}`);
    }
  }

  getProviderInfo() {
    return {
      provider: AI_PROVIDER,
      model: this.getModelName(),
      isLocal: AI_PROVIDER === 'ollama',
    };
  }

  getModelName() {
    switch (AI_PROVIDER.toLowerCase()) {
      case 'openai':
        return OPENAI_MODEL;
      case 'anthropic':
        return ANTHROPIC_MODEL;
      case 'google':
        return GOOGLE_MODEL;
      case 'groq':
        return GROQ_MODEL;
      case 'ollama':
        return OLLAMA_MODEL;
      default:
        return 'unknown';
    }
  }
}

// Create singleton instance
const aiProvider = new AIProviderService();

export default aiProvider;
