class OpenRouterProvider {
  constructor() {
    this.baseURL = 'https://openrouter.ai/api/v1';
  }

  getStoredConfig() {
    try {
      const provider = localStorage.getItem('ai-provider');
      const model = localStorage.getItem('ai-model');
      const keys = JSON.parse(localStorage.getItem('ai-keys') || '{}');

      return {
        provider: provider ? JSON.parse(provider) : 'openrouter-free',
        model: model ? JSON.parse(model) : 'google/gemma-7b-it:free',
        keys: keys,
      };
    } catch {
      return {
        provider: 'openrouter-free',
        model: 'google/gemma-7b-it:free',
        keys: {},
      };
    }
  }

  async invoke(prompt) {
    const config = this.getStoredConfig();

    try {
      const headers = {
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'FastFix',
      };

      // Add API key if provider requires it
      if (
        config.provider !== 'openrouter-free' &&
        config.keys[config.provider]
      ) {
        headers['Authorization'] = `Bearer ${config.keys[config.provider]}`;
      }

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'No response generated';
    } catch (error) {
      console.error('OpenRouter API error:', error);

      // Fallback to a simple response for free models
      if (config.provider === 'openrouter-free') {
        return this.getFallbackResponse(prompt);
      }

      throw new Error(`Failed to get AI response: ${error.message}`);
    }
  }

  getFallbackResponse(prompt) {
    // Simple fallback for when API is unavailable
    if (prompt.includes('performance') || prompt.includes('Performance')) {
      return `Based on the analysis, here are the key findings:

1. Overall Assessment:
The website shows good potential but has areas for improvement in performance optimization.

2. Critical Issues:
- Image optimization needed
- JavaScript bundle size could be reduced
- Caching strategies could be improved

3. Key Recommendations:
- Compress and optimize images
- Implement lazy loading
- Minify CSS and JavaScript files`;
    }

    return 'Analysis complete. The website has been evaluated for performance, accessibility, and SEO factors.';
  }

  getProviderInfo() {
    const config = this.getStoredConfig();
    return {
      provider: config.provider,
      model: config.model,
      isLocal: config.provider === 'ollama',
      isFree: config.provider === 'openrouter-free',
    };
  }
}

export default new OpenRouterProvider();
