import { describe, it, expect } from 'vitest';
import {
  validateUrl,
  validateEmail,
  validateString,
  validateNumber,
  validateBoolean,
  validateEnum,
  validateGitHubConfig,
  sanitizeString,
  sanitizeFilename,
  sanitizePath,
} from '../../utils/validation.js';
import { ValidationError } from '../../middleware/errorHandler.js';

describe('validateUrl', () => {
  describe('valid URLs', () => {
    it('should validate a basic HTTP URL', () => {
      const result = validateUrl('http://example.com');
      expect(result).toBe('http://example.com/');
    });

    it('should validate a basic HTTPS URL', () => {
      const result = validateUrl('https://example.com');
      expect(result).toBe('https://example.com/');
    });

    it('should validate URL with path', () => {
      const result = validateUrl('https://example.com/path/to/page');
      expect(result).toBe('https://example.com/path/to/page');
    });

    it('should validate URL with query parameters', () => {
      const result = validateUrl('https://example.com?param=value');
      expect(result).toBe('https://example.com/?param=value');
    });

    it('should trim whitespace from URL', () => {
      const result = validateUrl('  https://example.com  ');
      expect(result).toBe('https://example.com/');
    });

    it('should validate URL with port', () => {
      const result = validateUrl('http://localhost:3000');
      expect(result).toBe('http://localhost:3000/');
    });
  });

  describe('invalid URLs', () => {
    it('should throw error for missing URL', () => {
      expect(() => validateUrl('')).toThrow(ValidationError);
      expect(() => validateUrl('')).toThrow('URL is required');
    });

    it('should throw error for null URL', () => {
      expect(() => validateUrl(null)).toThrow(ValidationError);
      expect(() => validateUrl(null)).toThrow('URL is required');
    });

    it('should throw error for non-string URL', () => {
      expect(() => validateUrl(123)).toThrow(ValidationError);
      expect(() => validateUrl(123)).toThrow('URL must be a string');
    });

    it('should throw error for invalid URL format', () => {
      expect(() => validateUrl('not-a-url')).toThrow(ValidationError);
      expect(() => validateUrl('not-a-url')).toThrow('Invalid URL format');
    });

    it('should throw error for disallowed protocol', () => {
      expect(() => validateUrl('ftp://example.com')).toThrow(ValidationError);
      expect(() => validateUrl('ftp://example.com')).toThrow(
        'URL must use one of the following protocols'
      );
    });
  });

  describe('options', () => {
    it('should enforce HTTPS when requireHttps is true', () => {
      expect(() =>
        validateUrl('http://example.com', { requireHttps: true })
      ).toThrow(ValidationError);
      expect(() =>
        validateUrl('http://example.com', { requireHttps: true })
      ).toThrow('URL must use HTTPS protocol');
    });

    it('should allow HTTPS when requireHttps is true', () => {
      const result = validateUrl('https://example.com', { requireHttps: true });
      expect(result).toBe('https://example.com/');
    });

    it('should allow custom protocols', () => {
      const result = validateUrl('ftp://example.com', {
        allowedProtocols: ['ftp:'],
      });
      expect(result).toBe('ftp://example.com/');
    });
  });
});

describe('validateEmail', () => {
  describe('valid emails', () => {
    it('should validate a basic email', () => {
      const result = validateEmail('user@example.com');
      expect(result).toBe('user@example.com');
    });

    it('should validate email with subdomain', () => {
      const result = validateEmail('user@mail.example.com');
      expect(result).toBe('user@mail.example.com');
    });

    it('should validate email with plus sign', () => {
      const result = validateEmail('user+tag@example.com');
      expect(result).toBe('user+tag@example.com');
    });

    it('should trim and lowercase email', () => {
      const result = validateEmail('  USER@EXAMPLE.COM  ');
      expect(result).toBe('user@example.com');
    });

    it('should validate email with numbers', () => {
      const result = validateEmail('user123@example456.com');
      expect(result).toBe('user123@example456.com');
    });
  });

  describe('invalid emails', () => {
    it('should throw error for missing email', () => {
      expect(() => validateEmail('')).toThrow(ValidationError);
      expect(() => validateEmail('')).toThrow('Email is required');
    });

    it('should throw error for null email', () => {
      expect(() => validateEmail(null)).toThrow(ValidationError);
      expect(() => validateEmail(null)).toThrow('Email is required');
    });

    it('should throw error for non-string email', () => {
      expect(() => validateEmail(123)).toThrow(ValidationError);
      expect(() => validateEmail(123)).toThrow('Email must be a string');
    });

    it('should throw error for email without @', () => {
      expect(() => validateEmail('userexample.com')).toThrow(ValidationError);
      expect(() => validateEmail('userexample.com')).toThrow(
        'Invalid email format'
      );
    });

    it('should throw error for email without domain', () => {
      expect(() => validateEmail('user@')).toThrow(ValidationError);
      expect(() => validateEmail('user@')).toThrow('Invalid email format');
    });

    it('should throw error for email without TLD', () => {
      expect(() => validateEmail('user@example')).toThrow(ValidationError);
      expect(() => validateEmail('user@example')).toThrow(
        'Invalid email format'
      );
    });

    it('should throw error for email with spaces', () => {
      expect(() => validateEmail('user name@example.com')).toThrow(
        ValidationError
      );
      expect(() => validateEmail('user name@example.com')).toThrow(
        'Invalid email format'
      );
    });
  });
});

describe('validateString', () => {
  describe('valid strings', () => {
    it('should validate a basic string', () => {
      const result = validateString('hello', 'name');
      expect(result).toBe('hello');
    });

    it('should trim whitespace', () => {
      const result = validateString('  hello  ', 'name');
      expect(result).toBe('hello');
    });

    it('should validate string with minLength', () => {
      const result = validateString('hello', 'name', { minLength: 3 });
      expect(result).toBe('hello');
    });

    it('should validate string with maxLength', () => {
      const result = validateString('hello', 'name', { maxLength: 10 });
      expect(result).toBe('hello');
    });

    it('should validate string with pattern', () => {
      const result = validateString('hello123', 'username', {
        pattern: /^[a-z0-9]+$/,
      });
      expect(result).toBe('hello123');
    });
  });

  describe('invalid strings', () => {
    it('should throw error for non-string value', () => {
      expect(() => validateString(123, 'name')).toThrow(ValidationError);
      expect(() => validateString(123, 'name')).toThrow(
        'name must be a string'
      );
    });

    it('should throw error for string below minLength', () => {
      expect(() => validateString('hi', 'name', { minLength: 3 })).toThrow(
        ValidationError
      );
      expect(() => validateString('hi', 'name', { minLength: 3 })).toThrow(
        'name must be at least 3 characters long'
      );
    });

    it('should throw error for string above maxLength', () => {
      expect(() =>
        validateString('hello world', 'name', { maxLength: 5 })
      ).toThrow(ValidationError);
      expect(() =>
        validateString('hello world', 'name', { maxLength: 5 })
      ).toThrow('name must be at most 5 characters long');
    });

    it('should throw error for string not matching pattern', () => {
      expect(() =>
        validateString('hello!', 'username', { pattern: /^[a-z0-9]+$/ })
      ).toThrow(ValidationError);
      expect(() =>
        validateString('hello!', 'username', { pattern: /^[a-z0-9]+$/ })
      ).toThrow('username format is invalid');
    });
  });
});

describe('validateNumber', () => {
  describe('valid numbers', () => {
    it('should validate a basic number', () => {
      const result = validateNumber(42, 'age');
      expect(result).toBe(42);
    });

    it('should validate a string number', () => {
      const result = validateNumber('42', 'age');
      expect(result).toBe(42);
    });

    it('should validate a float', () => {
      const result = validateNumber(3.14, 'price');
      expect(result).toBe(3.14);
    });

    it('should validate number with min constraint', () => {
      const result = validateNumber(10, 'age', { min: 0 });
      expect(result).toBe(10);
    });

    it('should validate number with max constraint', () => {
      const result = validateNumber(50, 'age', { max: 100 });
      expect(result).toBe(50);
    });

    it('should validate integer', () => {
      const result = validateNumber(42, 'count', { integer: true });
      expect(result).toBe(42);
    });

    it('should validate zero', () => {
      const result = validateNumber(0, 'count');
      expect(result).toBe(0);
    });

    it('should validate negative numbers', () => {
      const result = validateNumber(-5, 'temperature');
      expect(result).toBe(-5);
    });
  });

  describe('invalid numbers', () => {
    it('should throw error for non-numeric value', () => {
      expect(() => validateNumber('abc', 'age')).toThrow(ValidationError);
      expect(() => validateNumber('abc', 'age')).toThrow(
        'age must be a valid number'
      );
    });

    it('should throw error for number below min', () => {
      expect(() => validateNumber(5, 'age', { min: 10 })).toThrow(
        ValidationError
      );
      expect(() => validateNumber(5, 'age', { min: 10 })).toThrow(
        'age must be at least 10'
      );
    });

    it('should throw error for number above max', () => {
      expect(() => validateNumber(150, 'age', { max: 100 })).toThrow(
        ValidationError
      );
      expect(() => validateNumber(150, 'age', { max: 100 })).toThrow(
        'age must be at most 100'
      );
    });

    it('should throw error for non-integer when integer required', () => {
      expect(() => validateNumber(3.14, 'count', { integer: true })).toThrow(
        ValidationError
      );
      expect(() => validateNumber(3.14, 'count', { integer: true })).toThrow(
        'count must be an integer'
      );
    });

    it('should throw error for NaN', () => {
      expect(() => validateNumber(NaN, 'age')).toThrow(ValidationError);
      expect(() => validateNumber(NaN, 'age')).toThrow(
        'age must be a valid number'
      );
    });
  });
});

describe('validateBoolean', () => {
  describe('valid booleans', () => {
    it('should validate true boolean', () => {
      const result = validateBoolean(true, 'isActive');
      expect(result).toBe(true);
    });

    it('should validate false boolean', () => {
      const result = validateBoolean(false, 'isActive');
      expect(result).toBe(false);
    });

    it('should convert string "true" to boolean', () => {
      const result = validateBoolean('true', 'isActive');
      expect(result).toBe(true);
    });

    it('should convert string "false" to boolean', () => {
      const result = validateBoolean('false', 'isActive');
      expect(result).toBe(false);
    });

    it('should convert number 1 to true', () => {
      const result = validateBoolean(1, 'isActive');
      expect(result).toBe(true);
    });

    it('should convert number 0 to false', () => {
      const result = validateBoolean(0, 'isActive');
      expect(result).toBe(false);
    });

    it('should convert string "1" to true', () => {
      const result = validateBoolean('1', 'isActive');
      expect(result).toBe(true);
    });

    it('should convert string "0" to false', () => {
      const result = validateBoolean('0', 'isActive');
      expect(result).toBe(false);
    });
  });

  describe('invalid booleans', () => {
    it('should throw error for invalid string', () => {
      expect(() => validateBoolean('yes', 'isActive')).toThrow(ValidationError);
      expect(() => validateBoolean('yes', 'isActive')).toThrow(
        'isActive must be a boolean value'
      );
    });

    it('should throw error for invalid number', () => {
      expect(() => validateBoolean(2, 'isActive')).toThrow(ValidationError);
      expect(() => validateBoolean(2, 'isActive')).toThrow(
        'isActive must be a boolean value'
      );
    });

    it('should throw error for null', () => {
      expect(() => validateBoolean(null, 'isActive')).toThrow(ValidationError);
      expect(() => validateBoolean(null, 'isActive')).toThrow(
        'isActive must be a boolean value'
      );
    });

    it('should throw error for undefined', () => {
      expect(() => validateBoolean(undefined, 'isActive')).toThrow(
        ValidationError
      );
      expect(() => validateBoolean(undefined, 'isActive')).toThrow(
        'isActive must be a boolean value'
      );
    });
  });
});

describe('validateEnum', () => {
  const allowedStatuses = ['active', 'inactive', 'pending'];

  describe('valid enum values', () => {
    it('should validate value in enum', () => {
      const result = validateEnum('active', 'status', allowedStatuses);
      expect(result).toBe('active');
    });

    it('should validate all allowed values', () => {
      allowedStatuses.forEach((status) => {
        const result = validateEnum(status, 'status', allowedStatuses);
        expect(result).toBe(status);
      });
    });
  });

  describe('invalid enum values', () => {
    it('should throw error for value not in enum', () => {
      expect(() => validateEnum('invalid', 'status', allowedStatuses)).toThrow(
        ValidationError
      );
      expect(() => validateEnum('invalid', 'status', allowedStatuses)).toThrow(
        'status must be one of: active, inactive, pending'
      );
    });

    it('should throw error for case mismatch', () => {
      expect(() => validateEnum('Active', 'status', allowedStatuses)).toThrow(
        ValidationError
      );
    });

    it('should throw error for null', () => {
      expect(() => validateEnum(null, 'status', allowedStatuses)).toThrow(
        ValidationError
      );
    });
  });
});

describe('validateGitHubConfig', () => {
  describe('valid GitHub config', () => {
    it('should validate complete config', () => {
      const config = {
        githubToken: 'ghp_1234567890abcdef',
        owner: 'testuser',
        repo: 'testrepo',
      };
      const result = validateGitHubConfig(config);
      expect(result).toEqual(config);
    });

    it('should validate config with hyphens and underscores', () => {
      const config = {
        githubToken: 'ghp_1234567890abcdef',
        owner: 'test-user_123',
        repo: 'test-repo_456',
      };
      const result = validateGitHubConfig(config);
      expect(result).toEqual(config);
    });

    it('should validate config with dots', () => {
      const config = {
        githubToken: 'ghp_1234567890abcdef',
        owner: 'test.user',
        repo: 'test.repo',
      };
      const result = validateGitHubConfig(config);
      expect(result).toEqual(config);
    });
  });

  describe('invalid GitHub config', () => {
    it('should throw error for missing token', () => {
      const config = { owner: 'testuser', repo: 'testrepo' };
      expect(() => validateGitHubConfig(config)).toThrow(ValidationError);
      expect(() => validateGitHubConfig(config)).toThrow(
        'GitHub token is required'
      );
    });

    it('should throw error for missing owner', () => {
      const config = { githubToken: 'ghp_1234567890abcdef', repo: 'testrepo' };
      expect(() => validateGitHubConfig(config)).toThrow(ValidationError);
      expect(() => validateGitHubConfig(config)).toThrow(
        'Repository owner is required'
      );
    });

    it('should throw error for missing repo', () => {
      const config = { githubToken: 'ghp_1234567890abcdef', owner: 'testuser' };
      expect(() => validateGitHubConfig(config)).toThrow(ValidationError);
      expect(() => validateGitHubConfig(config)).toThrow(
        'Repository name is required'
      );
    });

    it('should throw error for short token', () => {
      const config = {
        githubToken: 'short',
        owner: 'testuser',
        repo: 'testrepo',
      };
      expect(() => validateGitHubConfig(config)).toThrow(ValidationError);
      expect(() => validateGitHubConfig(config)).toThrow(
        'Invalid GitHub token format'
      );
    });

    it('should throw error for invalid owner format', () => {
      const config = {
        githubToken: 'ghp_1234567890abcdef',
        owner: 'test user',
        repo: 'testrepo',
      };
      expect(() => validateGitHubConfig(config)).toThrow(ValidationError);
      expect(() => validateGitHubConfig(config)).toThrow(
        'Invalid repository owner format'
      );
    });

    it('should throw error for invalid repo format', () => {
      const config = {
        githubToken: 'ghp_1234567890abcdef',
        owner: 'testuser',
        repo: 'test repo',
      };
      expect(() => validateGitHubConfig(config)).toThrow(ValidationError);
      expect(() => validateGitHubConfig(config)).toThrow(
        'Invalid repository name format'
      );
    });

    it('should throw error for special characters in owner', () => {
      const config = {
        githubToken: 'ghp_1234567890abcdef',
        owner: 'test@user',
        repo: 'testrepo',
      };
      expect(() => validateGitHubConfig(config)).toThrow(ValidationError);
    });
  });
});

describe('sanitizeString', () => {
  describe('basic sanitization', () => {
    it('should trim whitespace', () => {
      const result = sanitizeString('  hello  ');
      expect(result).toBe('hello');
    });

    it('should remove HTML tags by default', () => {
      const result = sanitizeString('<script>alert("xss")</script>');
      expect(result).toBe('alert("xss")');
    });

    it('should remove multiple HTML tags', () => {
      const result = sanitizeString('<div><p>Hello</p></div>');
      expect(result).toBe('Hello');
    });

    it('should remove null bytes', () => {
      const result = sanitizeString('hello\0world');
      expect(result).toBe('helloworld');
    });

    it('should return empty string for non-string input', () => {
      expect(sanitizeString(123)).toBe('');
      expect(sanitizeString(null)).toBe('');
      expect(sanitizeString(undefined)).toBe('');
    });
  });

  describe('options', () => {
    it('should allow HTML when allowHtml is true', () => {
      const result = sanitizeString('<p>Hello</p>', { allowHtml: true });
      expect(result).toBe('<p>Hello</p>');
    });

    it('should keep newlines by default', () => {
      const result = sanitizeString('hello\nworld');
      expect(result).toBe('hello\nworld');
    });

    it('should remove newlines when allowNewlines is false', () => {
      const result = sanitizeString('hello\nworld\r\ntest', {
        allowNewlines: false,
      });
      expect(result).toBe('hello world test');
    });
  });

  describe('XSS prevention', () => {
    it('should remove script tags', () => {
      const result = sanitizeString('<script>alert("xss")</script>Hello');
      expect(result).toBe('alert("xss")Hello');
    });

    it('should remove onclick attributes', () => {
      const result = sanitizeString('<div onclick="alert()">Click</div>');
      expect(result).toBe('Click');
    });

    it('should remove iframe tags', () => {
      const result = sanitizeString('<iframe src="evil.com"></iframe>');
      expect(result).toBe('');
    });
  });
});

describe('sanitizeFilename', () => {
  describe('valid filenames', () => {
    it('should keep valid filename unchanged', () => {
      const result = sanitizeFilename('document.pdf');
      expect(result).toBe('document.pdf');
    });

    it('should keep alphanumeric with dashes and underscores', () => {
      const result = sanitizeFilename('my-file_123.txt');
      expect(result).toBe('my-file_123.txt');
    });
  });

  describe('path traversal prevention', () => {
    it('should sanitize directory traversal attempt', () => {
      const result = sanitizeFilename('../../../etc/passwd');
      expect(result).not.toContain('..');
      expect(result).not.toContain('/');
    });

    it('should replace slashes with dashes', () => {
      const result = sanitizeFilename('path/to/file.txt');
      expect(result).toBe('path-to-file.txt');
    });

    it('should remove leading dots', () => {
      const result = sanitizeFilename('...hidden');
      expect(result).toBe('hidden');
    });

    it('should remove trailing dots', () => {
      const result = sanitizeFilename('file...');
      expect(result).toBe('file');
    });

    it('should replace multiple dots', () => {
      const result = sanitizeFilename('file...txt');
      expect(result).toBe('file.txt');
    });
  });

  describe('special characters', () => {
    it('should replace spaces with dashes', () => {
      const result = sanitizeFilename('my file.txt');
      expect(result).toBe('my-file.txt');
    });

    it('should replace special characters', () => {
      const result = sanitizeFilename('file@#$%.txt');
      expect(result).toBe('file----.txt');
    });

    it('should handle unicode characters', () => {
      const result = sanitizeFilename('файл.txt');
      expect(result).not.toContain('файл');
    });
  });

  describe('edge cases', () => {
    it('should return empty string for non-string input', () => {
      expect(sanitizeFilename(123)).toBe('');
      expect(sanitizeFilename(null)).toBe('');
    });

    it('should limit filename length to 255 characters', () => {
      const longName = 'a'.repeat(300);
      const result = sanitizeFilename(longName);
      expect(result.length).toBe(255);
    });

    it('should handle empty string', () => {
      const result = sanitizeFilename('');
      expect(result).toBe('');
    });
  });
});

describe('sanitizePath', () => {
  describe('valid paths', () => {
    it('should keep valid path unchanged', () => {
      const result = sanitizePath('path/to/file');
      expect(result).toBe('path/to/file');
    });

    it('should remove leading slashes', () => {
      const result = sanitizePath('/path/to/file');
      expect(result).toBe('path/to/file');
    });

    it('should remove trailing slashes', () => {
      const result = sanitizePath('path/to/file/');
      expect(result).toBe('path/to/file');
    });

    it('should normalize multiple slashes', () => {
      const result = sanitizePath('path//to///file');
      expect(result).toBe('path/to/file');
    });
  });

  describe('directory traversal prevention', () => {
    it('should throw error for directory traversal', () => {
      expect(() => sanitizePath('../etc/passwd')).toThrow(ValidationError);
      expect(() => sanitizePath('../etc/passwd')).toThrow(
        'Path cannot contain directory traversal sequences'
      );
    });

    it('should throw error for nested directory traversal', () => {
      expect(() => sanitizePath('path/../../etc/passwd')).toThrow(
        ValidationError
      );
    });

    it('should throw error for encoded directory traversal', () => {
      expect(() => sanitizePath('path/..%2F..%2Fetc/passwd')).toThrow(
        ValidationError
      );
    });
  });

  describe('invalid inputs', () => {
    it('should throw error for non-string path', () => {
      expect(() => sanitizePath(123)).toThrow(ValidationError);
      expect(() => sanitizePath(123)).toThrow('Path must be a string');
    });

    it('should throw error for null', () => {
      expect(() => sanitizePath(null)).toThrow(ValidationError);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      const result = sanitizePath('');
      expect(result).toBe('');
    });

    it('should handle single directory', () => {
      const result = sanitizePath('directory');
      expect(result).toBe('directory');
    });
  });
});
