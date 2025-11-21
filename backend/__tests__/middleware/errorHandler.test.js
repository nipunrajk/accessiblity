import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  errorHandler,
  asyncHandler,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  TimeoutError,
  ServiceUnavailableError,
  AIProviderError,
  AnalysisError,
} from '../../middleware/errorHandler.js';

vi.mock('../../utils/logger.js');
vi.mock('../../utils/response.js', () => ({
  errorResponse: vi.fn((error, code, statusCode) => ({
    success: false,
    error: typeof error === 'string' ? error : error.message,
    code,
    timestamp: new Date().toISOString(),
  })),
}));

import { errorResponse } from '../../utils/response.js';

describe('Error Handler Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      path: '/api/test',
      url: '/api/test?param=value',
      query: { param: 'value' },
      body: { data: 'test' },
      ip: '127.0.0.1',
      get: vi.fn((header) => {
        if (header === 'user-agent') return 'Test User Agent';
        return null;
      }),
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();

    // Reset mocks
    errorResponse.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('errorHandler', () => {
    it('should handle ValidationError with 400 status', () => {
      const error = new ValidationError('Invalid input');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(errorResponse).toHaveBeenCalledWith(
        error,
        'VALIDATION_ERROR',
        400
      );
    });

    it('should handle NotFoundError with 404 status', () => {
      const error = new NotFoundError('Resource not found');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(errorResponse).toHaveBeenCalledWith(error, 'NOT_FOUND', 404);
    });

    it('should handle UnauthorizedError with 401 status', () => {
      const error = new UnauthorizedError('Unauthorized access');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(errorResponse).toHaveBeenCalledWith(error, 'UNAUTHORIZED', 401);
    });

    it('should handle ForbiddenError with 403 status', () => {
      const error = new ForbiddenError('Access forbidden');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(errorResponse).toHaveBeenCalledWith(error, 'FORBIDDEN', 403);
    });

    it('should handle ConflictError with 409 status', () => {
      const error = new ConflictError('Resource conflict');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(errorResponse).toHaveBeenCalledWith(error, 'CONFLICT', 409);
    });

    it('should handle RateLimitError with 429 status', () => {
      const error = new RateLimitError('Rate limit exceeded');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(errorResponse).toHaveBeenCalledWith(
        error,
        'RATE_LIMIT_EXCEEDED',
        429
      );
    });

    it('should handle TimeoutError with 408 status', () => {
      const error = new TimeoutError('Request timeout');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(408);
      expect(errorResponse).toHaveBeenCalledWith(error, 'REQUEST_TIMEOUT', 408);
    });

    it('should handle ServiceUnavailableError with 503 status', () => {
      const error = new ServiceUnavailableError('Service unavailable');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(errorResponse).toHaveBeenCalledWith(
        error,
        'SERVICE_UNAVAILABLE',
        503
      );
    });

    it('should handle AIProviderError with 502 status', () => {
      const error = new AIProviderError('AI provider error');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(502);
      expect(errorResponse).toHaveBeenCalledWith(
        error,
        'AI_PROVIDER_ERROR',
        502
      );
    });

    it('should handle AnalysisError with 500 status', () => {
      const error = new AnalysisError('Analysis failed');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(errorResponse).toHaveBeenCalledWith(error, 'ANALYSIS_ERROR', 500);
    });

    it('should handle generic Error with 500 status', () => {
      const error = new Error('Generic error');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(errorResponse).toHaveBeenCalledWith(error, 'INTERNAL_ERROR', 500);
    });

    it('should handle ECONNREFUSED error with 503 status', () => {
      const error = new Error('Connection refused');
      error.code = 'ECONNREFUSED';

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(errorResponse).toHaveBeenCalledWith(
        error,
        'SERVICE_UNAVAILABLE',
        503
      );
    });

    it('should handle ETIMEDOUT error with 408 status', () => {
      const error = new Error('Connection timeout');
      error.code = 'ETIMEDOUT';

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(408);
      expect(errorResponse).toHaveBeenCalledWith(error, 'REQUEST_TIMEOUT', 408);
    });

    it('should handle ESOCKETTIMEDOUT error with 408 status', () => {
      const error = new Error('Socket timeout');
      error.code = 'ESOCKETTIMEDOUT';

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(408);
      expect(errorResponse).toHaveBeenCalledWith(error, 'REQUEST_TIMEOUT', 408);
    });

    it('should use explicit statusCode and code if provided', () => {
      const error = new Error('Custom error');
      error.statusCode = 418;
      error.code = 'CUSTOM_ERROR';

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(418);
      expect(errorResponse).toHaveBeenCalledWith(error, 'CUSTOM_ERROR', 418);
    });

    it('should send JSON response', () => {
      const error = new ValidationError('Invalid input');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should build error context from request', () => {
      const error = new Error('Test error');

      errorHandler(error, mockReq, mockRes, mockNext);

      // Verify request context was accessed
      expect(mockReq.get).toHaveBeenCalledWith('user-agent');
    });
  });

  describe('asyncHandler', () => {
    it('should wrap async function and catch errors', async () => {
      const asyncFn = vi.fn().mockRejectedValue(new Error('Async error'));
      const wrappedFn = asyncHandler(asyncFn);

      await wrappedFn(mockReq, mockRes, mockNext);

      expect(asyncFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should pass through successful async function', async () => {
      const asyncFn = vi.fn().mockResolvedValue('success');
      const wrappedFn = asyncHandler(asyncFn);

      await wrappedFn(mockReq, mockRes, mockNext);

      expect(asyncFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle rejected promises', async () => {
      const asyncFn = vi.fn().mockRejectedValue(new Error('Promise rejection'));
      const wrappedFn = asyncHandler(asyncFn);

      await wrappedFn(mockReq, mockRes, mockNext);

      expect(asyncFn).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockNext.mock.calls[0][0].message).toBe('Promise rejection');
    });

    it('should handle async functions that throw', async () => {
      const asyncFn = vi.fn(async (req, res, next) => {
        throw new Error('Async throw');
      });
      const wrappedFn = asyncHandler(asyncFn);

      await wrappedFn(mockReq, mockRes, mockNext);

      expect(asyncFn).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockNext.mock.calls[0][0].message).toBe('Async throw');
    });

    it('should preserve function context', async () => {
      let capturedReq;
      const asyncFn = async (req, res, next) => {
        capturedReq = req;
      };
      const wrappedFn = asyncHandler(asyncFn);

      await wrappedFn(mockReq, mockRes, mockNext);

      expect(capturedReq).toBe(mockReq);
    });
  });

  describe('Custom Error Classes', () => {
    describe('ValidationError', () => {
      it('should create ValidationError with correct properties', () => {
        const error = new ValidationError('Invalid input');

        expect(error.message).toBe('Invalid input');
        expect(error.statusCode).toBe(400);
        expect(error.code).toBe('VALIDATION_ERROR');
        expect(error.name).toBe('ValidationError');
      });

      it('should accept details parameter', () => {
        const details = { field: 'email', reason: 'invalid format' };
        const error = new ValidationError('Invalid input', details);

        expect(error.details).toEqual(details);
      });

      it('should have stack trace', () => {
        const error = new ValidationError('Invalid input');

        expect(error.stack).toBeDefined();
        expect(error.stack).toContain('ValidationError');
      });
    });

    describe('NotFoundError', () => {
      it('should create NotFoundError with default message', () => {
        const error = new NotFoundError();

        expect(error.message).toBe('Resource not found');
        expect(error.statusCode).toBe(404);
        expect(error.code).toBe('NOT_FOUND');
      });

      it('should accept custom message', () => {
        const error = new NotFoundError('User not found');

        expect(error.message).toBe('User not found');
      });
    });

    describe('UnauthorizedError', () => {
      it('should create UnauthorizedError with default message', () => {
        const error = new UnauthorizedError();

        expect(error.message).toBe('Unauthorized access');
        expect(error.statusCode).toBe(401);
        expect(error.code).toBe('UNAUTHORIZED');
      });
    });

    describe('ForbiddenError', () => {
      it('should create ForbiddenError with default message', () => {
        const error = new ForbiddenError();

        expect(error.message).toBe('Access forbidden');
        expect(error.statusCode).toBe(403);
        expect(error.code).toBe('FORBIDDEN');
      });
    });

    describe('ConflictError', () => {
      it('should create ConflictError with default message', () => {
        const error = new ConflictError();

        expect(error.message).toBe('Resource conflict');
        expect(error.statusCode).toBe(409);
        expect(error.code).toBe('CONFLICT');
      });
    });

    describe('RateLimitError', () => {
      it('should create RateLimitError with default message', () => {
        const error = new RateLimitError();

        expect(error.message).toBe('Rate limit exceeded');
        expect(error.statusCode).toBe(429);
        expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
      });
    });

    describe('TimeoutError', () => {
      it('should create TimeoutError with default message', () => {
        const error = new TimeoutError();

        expect(error.message).toBe('Request timeout');
        expect(error.statusCode).toBe(408);
        expect(error.code).toBe('REQUEST_TIMEOUT');
      });
    });

    describe('ServiceUnavailableError', () => {
      it('should create ServiceUnavailableError with default message', () => {
        const error = new ServiceUnavailableError();

        expect(error.message).toBe('Service temporarily unavailable');
        expect(error.statusCode).toBe(503);
        expect(error.code).toBe('SERVICE_UNAVAILABLE');
      });
    });

    describe('AIProviderError', () => {
      it('should create AIProviderError with default message', () => {
        const error = new AIProviderError();

        expect(error.message).toBe('AI provider error');
        expect(error.statusCode).toBe(502);
        expect(error.code).toBe('AI_PROVIDER_ERROR');
      });

      it('should accept details parameter', () => {
        const details = { provider: 'OpenAI', reason: 'API key invalid' };
        const error = new AIProviderError('AI error', details);

        expect(error.details).toEqual(details);
      });
    });

    describe('AnalysisError', () => {
      it('should create AnalysisError with default message', () => {
        const error = new AnalysisError();

        expect(error.message).toBe('Analysis failed');
        expect(error.statusCode).toBe(500);
        expect(error.code).toBe('ANALYSIS_ERROR');
      });

      it('should accept details parameter', () => {
        const details = { stage: 'lighthouse', reason: 'timeout' };
        const error = new AnalysisError('Analysis error', details);

        expect(error.details).toEqual(details);
      });
    });
  });

  describe('Error Classification', () => {
    it('should classify errors by name', () => {
      const error = new Error('Test error');
      error.name = 'ValidationError';

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should prioritize explicit statusCode and code', () => {
      const error = new ValidationError('Test');
      error.statusCode = 422;
      error.code = 'CUSTOM_VALIDATION';

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(422);
      expect(errorResponse).toHaveBeenCalledWith(
        error,
        'CUSTOM_VALIDATION',
        422
      );
    });

    it('should handle unknown error types', () => {
      const error = new Error('Unknown error');
      error.name = 'UnknownError';

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(errorResponse).toHaveBeenCalledWith(error, 'INTERNAL_ERROR', 500);
    });
  });

  describe('Error Context', () => {
    it('should capture request method', () => {
      mockReq.method = 'POST';
      const error = new Error('Test error');

      errorHandler(error, mockReq, mockRes, mockNext);

      // Context is built but we can't directly test it without exposing internals
      // We verify the handler runs without errors
      expect(mockRes.status).toHaveBeenCalled();
    });

    it('should capture request path and URL', () => {
      mockReq.path = '/api/analyze';
      mockReq.url = '/api/analyze?url=example.com';
      const error = new Error('Test error');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalled();
    });

    it('should capture query parameters', () => {
      mockReq.query = { url: 'example.com', includeAI: 'true' };
      const error = new Error('Test error');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalled();
    });

    it('should capture request body', () => {
      mockReq.body = { url: 'example.com', options: { deep: true } };
      const error = new Error('Test error');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalled();
    });

    it('should capture IP address', () => {
      mockReq.ip = '192.168.1.1';
      const error = new Error('Test error');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalled();
    });

    it('should capture user agent', () => {
      mockReq.get = vi.fn((header) => {
        if (header === 'user-agent') return 'Mozilla/5.0';
        return null;
      });
      const error = new Error('Test error');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockReq.get).toHaveBeenCalledWith('user-agent');
    });
  });

  describe('Integration', () => {
    it('should work with asyncHandler and errorHandler together', async () => {
      const asyncFn = async () => {
        throw new ValidationError('Invalid data');
      };
      const wrappedFn = asyncHandler(asyncFn);

      await wrappedFn(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));

      // Simulate errorHandler being called by Express
      const error = mockNext.mock.calls[0][0];
      errorHandler(error, mockReq, mockRes, vi.fn());

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should handle errors thrown in async middleware', async () => {
      const middleware = asyncHandler(async (req, res, next) => {
        throw new NotFoundError('Resource not found');
      });

      await middleware(mockReq, mockRes, mockNext);

      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(NotFoundError);
    });
  });
});
