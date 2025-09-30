import { getActiveAIProvider, isAIAvailable } from '../config/aiConfig.js';

class AIProvider {
  constructor() {
    this.provider = null;
    this.initialize();
  }

  initialize() {
    this.provider = getActiveAIProvider();
    if (this.provider) {
      console.log(
        `🤖 AI Provider: ${this.provider.name} (${this.provider.model})`
      );
      console.log('✅ AI-powered analysis enabled');
    } else {
      console.log(
        'ℹ️  AI not configured. Check src/config/aiConfig.js for setup instructions.'
      );
      console.log(
        '💡 Quick start: Set openrouter.enabled = true for free AI models'
      );
    }
  }

  isAvailable() {
    return isAIAvailable();
  }

  async invoke(prompt) {
    if (!this.provider) {
      throw new Error('No AI provider configured');
    }

    try {
      switch (this.provider.name) {
        case 'openai':
          return await this.invokeOpenAI(prompt);
        case 'anthropic':
          return await this.invokeAnthropic(prompt);
        case 'openrouter':
          return await this.invokeOpenRouter(prompt);
        case 'google':
          return await this.invokeGoogle(prompt);
        case 'groq':
          return await this.invokeGroq(prompt);
        case 'ollama':
          return await this.invokeOllama(prompt);
        default:
          throw new Error(`Unsupported provider: ${this.provider.name}`);
      }
    } catch (error) {
      console.error(`AI Provider Error (${this.provider.name}):`, error);
      throw error;
    }
  }

  async invokeOpenAI(prompt) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.provider.apiKey}`,
      },
      body: JSON.stringify({
        model: this.provider.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async invokeAnthropic(prompt) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.provider.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.provider.model,
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  async invokeOpenRouter(prompt) {
    const headers = {
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'FastFix Website Analyzer',
    };

    // Add API key if available (for paid models)
    if (this.provider.apiKey) {
      headers['Authorization'] = `Bearer ${this.provider.apiKey}`;
    }

    const response = await fetch(`${this.provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: this.provider.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        model: this.provider.model,
        hasApiKey: !!this.provider.apiKey,
        errorBody: errorText,
      });
      throw new Error(
        `OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Unexpected OpenRouter response format:', data);
      throw new Error('Invalid response format from OpenRouter');
    }

    return data.choices[0].message.content;
  }

  async invokeGoogle(prompt) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.provider.model}:generateContent?key=${this.provider.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.7,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Google API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  async invokeGroq(prompt) {
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.provider.apiKey}`,
        },
        body: JSON.stringify({
          model: this.provider.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
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
    return data.response;
  }

  getProviderInfo() {
    return this.provider
      ? {
          name: this.provider.name,
          model: this.provider.model,
          available: true,
        }
      : {
          name: 'None',
          model: 'Not configured',
          available: false,
        };
  }
}

// Export singleton instance
export default new AIProvider();
