import dotenv from 'dotenv';

dotenv.config();

class AIProvider {
  constructor() {
    this.provider = this.getActiveProvider();
  }

  getActiveProvider() {
    const aiProvider = process.env.AI_PROVIDER || 'openai';

    switch (aiProvider) {
      case 'openrouter':
        if (process.env.OPENROUTER_API_KEY) {
          return {
            name: 'openrouter',
            apiKey: process.env.OPENROUTER_API_KEY,
            model: process.env.OPENROUTER_MODEL || 'x-ai/grok-4-fast:free',
            baseUrl: 'https://openrouter.ai/api/v1',
          };
        }
        break;

      case 'openai':
        if (process.env.OPENAI_API_KEY) {
          return {
            name: 'openai',
            apiKey: process.env.OPENAI_API_KEY,
            model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
            baseUrl: 'https://api.openai.com/v1',
          };
        }
        break;

      case 'anthropic':
        if (process.env.ANTHROPIC_API_KEY) {
          return {
            name: 'anthropic',
            apiKey: process.env.ANTHROPIC_API_KEY,
            model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
            baseUrl: 'https://api.anthropic.com/v1',
          };
        }
        break;

      case 'groq':
        if (process.env.GROQ_API_KEY) {
          return {
            name: 'groq',
            apiKey: process.env.GROQ_API_KEY,
            model: process.env.GROQ_MODEL || 'mixtral-8x7b-32768',
            baseUrl: 'https://api.groq.com/openai/v1',
          };
        }
        break;

      case 'ollama':
        return {
          name: 'ollama',
          model: process.env.OLLAMA_MODEL || 'llama2',
          baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        };
    }

    return null;
  }

  isAvailable() {
    return this.provider !== null;
  }

  async invoke(prompt) {
    if (!this.provider) {
      throw new Error('No AI provider configured');
    }

    switch (this.provider.name) {
      case 'openrouter':
        return await this.invokeOpenRouter(prompt);
      case 'openai':
        return await this.invokeOpenAI(prompt);
      case 'anthropic':
        return await this.invokeAnthropic(prompt);
      case 'groq':
        return await this.invokeGroq(prompt);
      case 'ollama':
        return await this.invokeOllama(prompt);
      default:
        throw new Error(`Unsupported AI provider: ${this.provider.name}`);
    }
  }

  async invokeOpenAI(prompt) {
    const response = await fetch(`${this.provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.provider.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.provider.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  async invokeOpenRouter(prompt) {
    const response = await fetch(`${this.provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.provider.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.provider.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  async invokeAnthropic(prompt) {
    const response = await fetch(`${this.provider.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.provider.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.provider.model,
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0]?.text || '';
  }

  async invokeGroq(prompt) {
    const response = await fetch(`${this.provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.provider.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.provider.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  async invokeOllama(prompt) {
    const response = await fetch(`${this.provider.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.provider.model,
        prompt: prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response || '';
  }
}

export default new AIProvider();
