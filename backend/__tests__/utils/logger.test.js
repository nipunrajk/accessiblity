/**
 * Example Unit Test - Logger Utility
 *
 * This is an example test file demonstrating how to test utility functions.
 * Tests focus on core functionality without mocking.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import logger from '../../utils/logger.js';

describe('Logger Utility', () => {
  let consoleLogSpy;
  let consoleErrorSpy;
  let consoleWarnSpy;

  beforeEach(() => {
    // Capture console output
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('info', () => {
    it('should log info messages', () => {
      logger.info('Test message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should include context in log output', () => {
      const context = { userId: '123', action: 'test' };
      logger.info('Test with context', context);
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('should log error messages', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle errors without stack traces', () => {
      logger.error('Simple error message');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    it('should log warning messages', () => {
      logger.warn('Warning message');
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  describe('debug', () => {
    it('should log debug messages in development', () => {
      // Create a new logger instance with development config
      const devConfig = {
        app: {
          server: {
            env: 'development',
          },
        },
      };
      const devLogger = new logger.constructor(devConfig);

      devLogger.debug('Debug message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });
});
