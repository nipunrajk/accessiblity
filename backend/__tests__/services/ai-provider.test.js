import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AIProviderService from '../../services/ai/ai-provider.service.js';

// Mock logger
vi.mock('../../utils/logger.js', () => ({
  default: {
    aiProvider: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('AIProviderService', () => {
  const mockConfig = {
    provider: 'openai',
    apiKey: 'test-api-key',
    model: 'gpt-4',
    maxTokens: 1000,
    temperature: 0.7,
    providers: {
      openai: {
        name: 'OpenAI',
        type: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        authHeader: 'Authorization',
        authPrefix: 'Bearer',
        defaultModel: 'gpt-3.5-turbo',
      },
      anthropic: {
        name: 'Anthropic',
        type: 'anthropic',
        baseUrl: 'https://api.anthropic.com/v1',
        defaultModel: 'claude-3-sonnet-20240229',
      },
      groq: {
        name: 'Groq',
        type: 'openai',
        baseUrl: 'https://api.groq.com/openai/v1',
        authHeader: 'Authorization',
        authPrefix: 'Bearer',
        defaultModel: 'llama3-70b-8192',
      },
      ollama: {
        name: 'Ollama',
        type: 'ollama',
        baseUrl: 'http://localhost:11434',
        defaultModel: 'llama2',
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with valid config', () => {
      const service = new AIProviderService(mockConfig);
      expect(service.config).toEqual(mockConfig);
      expect(service.providerConfig.available).toBe(true);
    });

    it('should use provided model over default', () => {
      const service = new AIProviderService(mockConfig);
      expect(service.providerConfig.model).toBe('gpt-4');
    });

    it('should use default model when not provided', () => {
      const config = { ...mockConfig, model: undefined };
      const service = new AIProviderService(config);
      expect(service.providerConfig.model).toBe('gpt-3.5-turbo');
    });

    it('should handle unknown provider', () => {
      const config = { ...mockConfig, provider: 'unknown' };
      const service = new AIProviderService(config);
      expect(service.providerConfig.available).toBe(false);
      expect(service.providerConfig.error).toContain('Unknown provider');
    });

    it('should mark as unavailable when API key missing for non-ollama', () => {
      const config = { ...mockConfig, apiKey: '' };
      const service = new AIProviderService(config);
      expect(service.providerConfig.available).toBe(false);
    });

    it('should mark ollama as available without API key', () => {
      const config = { ...mockConfig, provider: 'ollama', apiKey: '' };
      const service = new AIProviderService(config);
      expect(service.providerConfig.available).toBe(true);
    });
  });

  describe('isAvailable', () => {
    it('should return true when provider is configured', () => {
      const service = new AIProviderService(mockConfig);
      expect(service.isAvailable()).toBe(true);
    });

    it('should return false when API key is missing', () => {
      const config = { ...mockConfig, apiKey: '' };
      const service = new AIProviderService(config);
      expect(service.isAvailable()).toBe(false);
    });

    it('should return false for unknown provider', () => {
      const config = { ...mockConfig, provider: 'unknown' };
      const service = new AIProviderService(config);
      expect(service.isAvailable()).toBe(false);
    });

    it('should return true for ollama without API key', () => {
      const config = { ...mockConfig, provider: 'ollama', apiKey: '' };
      const service = new AIProviderService(config);
      expect(service.isAvailable()).toBe(true);
    });
  });

  describe('getProviderName', () => {
    it('should return provider name', () => {
      const service = new AIProviderService(mockConfig);
      expect(service.getProviderName()).toBe('OpenAI');
    });

    it('should return correct name for different providers', () => {
      const config = { ...mockConfig, provider: 'anthropic' };
      const service = new AIProviderService(config);
      expect(service.getProviderName()).toBe('Anthropic');
    });
  });

  describe('getModelName', () => {
    it('should return model name', () => {
      const service = new AIProviderService(mockConfig);
      expect(service.getModelName()).toBe('gpt-4');
    });

    it('should return default model when not specified', () => {
      const config = { ...mockConfig, model: undefined };
      const service = new AIProviderService(config);
      expect(service.getModelName()).toBe('gpt-3.5-turbo');
    });
  });

  describe('invoke', () => {
    it('should throw error when provider not available', async () => {
      const config = { ...mockConfig, apiKey: '' };
      const service = new AIProviderService(config);

      await expect(service.invoke('test prompt')).rejects.toThrow(
        'AI not configured'
      );
    });

    it('should throw error for unsupported provider type', async () => {
      const config = {
        ...mockConfig,
        providers: {
          custom: {
            name: 'Custom',
            type: 'unsupported',
            baseUrl: 'http://example.com',
            defaultModel: 'model',
          },
        },
        provider: 'custom',
      };
      const service = new AIProviderService(config);

      await expect(service.invoke('test prompt')).rejects.toThrow(
        'Unsupported provider type'
      );
    });
  });

  describe('_invokeOpenAICompatible', () => {
    it('should successfully invoke OpenAI API', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'AI response' } }],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const service = new AIProviderService(mockConfig);
      const result = await service.invoke('test prompt');

      expect(result).toBe('AI response');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-api-key',
          }),
        })
      );
    });

    it('should send correct request body', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'response' } }],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const service = new AIProviderService(mockConfig);
      await service.invoke('test prompt');

      const fetchCall = global.fetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);

      expect(body).toEqual({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'test prompt' }],
        temperature: 0.7,
        max_tokens: 1000,
      });
    });

    it('should handle API error response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Invalid API key',
      });

      const service = new AIProviderService(mockConfig);

      await expect(service.invoke('test prompt')).rejects.toThrow(
        'OpenAI API error: Unauthorized'
      );
    });

    it('should handle empty response', async () => {
      const mockResponse = {
        choices: [{ message: {} }],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const service = new AIProviderService(mockConfig);
      const result = await service.invoke('test prompt');

      expect(result).toBe('');
    });

    it('should work with Groq provider', async () => {
      const config = { ...mockConfig, provider: 'groq' };
      const mockResponse = {
        choices: [{ message: { content: 'Groq response' } }],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const service = new AIProviderService(config);
      const result = await service.invoke('test prompt');

      expect(result).toBe('Groq response');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.groq.com/openai/v1/chat/completions',
        expect.any(Object)
      );
    });

    it('should handle network errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const service = new AIProviderService(mockConfig);

      await expect(service.invoke('test prompt')).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('_invokeAnthropic', () => {
    it('should successfully invoke Anthropic API', async () => {
      const config = { ...mockConfig, provider: 'anthropic' };
      const mockResponse = {
        content: [{ text: 'Claude response' }],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const service = new AIProviderService(config);
      const result = await service.invoke('test prompt');

      expect(result).toBe('Claude response');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-api-key': 'test-api-key',
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01',
          }),
        })
      );
    });

    it('should send correct request body', async () => {
      const config = { ...mockConfig, provider: 'anthropic' };
      const mockResponse = {
        content: [{ text: 'response' }],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const service = new AIProviderService(config);
      await service.invoke('test prompt');

      const fetchCall = global.fetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);

      expect(body).toEqual({
        model: 'gpt-4',
        max_tokens: 1000,
        messages: [{ role: 'user', content: 'test prompt' }],
      });
    });

    it('should handle API error response', async () => {
      const config = { ...mockConfig, provider: 'anthropic' };

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        text: async () => 'Rate limit exceeded',
      });

      const service = new AIProviderService(config);

      await expect(service.invoke('test prompt')).rejects.toThrow(
        'Anthropic API error: Too Many Requests'
      );
    });

    it('should handle empty response', async () => {
      const config = { ...mockConfig, provider: 'anthropic' };
      const mockResponse = {
        content: [{}],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const service = new AIProviderService(config);
      const result = await service.invoke('test prompt');

      expect(result).toBe('');
    });

    it('should use default model when not specified', async () => {
      const config = {
        ...mockConfig,
        provider: 'anthropic',
        model: undefined,
      };
      const mockResponse = {
        content: [{ text: 'response' }],
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const service = new AIProviderService(config);
      await service.invoke('test prompt');

      const fetchCall = global.fetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);

      expect(body.model).toBe('claude-3-sonnet-20240229');
    });
  });

  describe('_invokeOllama', () => {
    it('should successfully invoke Ollama API', async () => {
      const config = { ...mockConfig, provider: 'ollama', apiKey: '' };
      const mockResponse = {
        response: 'Ollama response',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const service = new AIProviderService(config);
      const result = await service.invoke('test prompt');

      expect(result).toBe('Ollama response');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/generate',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should send correct request body', async () => {
      const config = { ...mockConfig, provider: 'ollama', apiKey: '' };
      const mockResponse = {
        response: 'response',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const service = new AIProviderService(config);
      await service.invoke('test prompt');

      const fetchCall = global.fetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);

      expect(body).toEqual({
        model: 'gpt-4',
        prompt: 'test prompt',
        stream: false,
      });
    });

    it('should handle API error response', async () => {
      const config = { ...mockConfig, provider: 'ollama', apiKey: '' };

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Model not found',
      });

      const service = new AIProviderService(config);

      await expect(service.invoke('test prompt')).rejects.toThrow(
        'Ollama API error: Not Found'
      );
    });

    it('should handle empty response', async () => {
      const config = { ...mockConfig, provider: 'ollama', apiKey: '' };
      const mockResponse = {};

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const service = new AIProviderService(config);
      const result = await service.invoke('test prompt');

      expect(result).toBe('');
    });

    it('should not require API key', async () => {
      const config = { ...mockConfig, provider: 'ollama', apiKey: '' };
      const mockResponse = {
        response: 'response',
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const service = new AIProviderService(config);
      expect(service.isAvailable()).toBe(true);

      await service.invoke('test prompt');

      const fetchCall = global.fetch.mock.calls[0];
      expect(fetchCall[1].headers).not.toHaveProperty('Authorization');
      expect(fetchCall[1].headers).not.toHaveProperty('x-api-key');
    });
  });

  describe('error handling', () => {
    it('should handle JSON parse errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const service = new AIProviderService(mockConfig);

      await expect(service.invoke('test prompt')).rejects.toThrow(
        'Invalid JSON'
      );
    });

    it('should handle fetch network errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      const service = new AIProviderService(mockConfig);

      await expect(service.invoke('test prompt')).rejects.toThrow(
        'ECONNREFUSED'
      );
    });

    it('should handle timeout errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Request timeout'));

      const service = new AIProviderService(mockConfig);

      await expect(service.invoke('test prompt')).rejects.toThrow(
        'Request timeout'
      );
    });
  });

  describe('response parsing', () => {
    it('should handle missing choices array in OpenAI response', async () => {
      const mockResponse = {};

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const service = new AIProviderService(mockConfig);
      const result = await service.invoke('test prompt');

      expect(result).toBe('');
    });

    it('should handle missing content array in Anthropic response', async () => {
      const config = { ...mockConfig, provider: 'anthropic' };
      const mockResponse = {};

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const service = new AIProviderService(config);
      const result = await service.invoke('test prompt');

      expect(result).toBe('');
    });

    it('should handle missing response field in Ollama response', async () => {
      const config = { ...mockConfig, provider: 'ollama', apiKey: '' };
      const mockResponse = { done: true };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const service = new AIProviderService(config);
      const result = await service.invoke('test prompt');

      expect(result).toBe('');
    });
  });

  describe('multiple providers', () => {
    it('should handle switching between providers', async () => {
      // OpenAI
      const openaiResponse = {
        choices: [{ message: { content: 'OpenAI response' } }],
      };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => openaiResponse,
      });

      const openaiService = new AIProviderService(mockConfig);
      const openaiResult = await openaiService.invoke('test');
      expect(openaiResult).toBe('OpenAI response');

      // Anthropic
      const anthropicConfig = { ...mockConfig, provider: 'anthropic' };
      const anthropicResponse = {
        content: [{ text: 'Anthropic response' }],
      };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => anthropicResponse,
      });

      const anthropicService = new AIProviderService(anthropicConfig);
      const anthropicResult = await anthropicService.invoke('test');
      expect(anthropicResult).toBe('Anthropic response');
    });
  });
});
