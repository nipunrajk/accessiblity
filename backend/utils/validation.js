import { ValidationError } from '../middleware/errorHandler.js';

/**
 * URL validation and sanitization
 * @param {string} url - URL to validate
 * @param {Object} options - Validation options
 * @param {string[]} options.allowedProtocols - Allowed protocols (default: ['http:', 'https:'])
 * @param {boolean} options.requireHttps - Require HTTPS protocol
 * @returns {string} Validated and normalized URL
 * @throws {ValidationError} If URL is invalid
 *
 * @example
 * const validUrl = validateUrl('https://example.com');
 */
export const validateUrl = (url, options = {}) => {
  const { allowedProtocols = ['http:', 'https:'], requireHttps = false } =
    options;

  if (!url) {
    throw new ValidationError('URL is required');
  }

  if (typeof url !== 'string') {
    throw new ValidationError('URL must be a string');
  }

  // Sanitize URL
  const sanitizedUrl = url.trim();

  try {
    const urlObj = new URL(sanitizedUrl);

    if (!allowedProtocols.includes(urlObj.protocol)) {
      throw new ValidationError(
        `URL must use one of the following protocols: ${allowedProtocols.join(
          ', '
        )}`
      );
    }

    if (requireHttps && urlObj.protocol !== 'https:') {
      throw new ValidationError('URL must use HTTPS protocol');
    }

    return urlObj.href;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError('Invalid URL format');
  }
};

/**
 * Email validation
 * @param {string} email - Email to validate
 * @returns {string} Validated and normalized email
 * @throws {ValidationError} If email is invalid
 *
 * @example
 * const validEmail = validateEmail('user@example.com');
 */
export const validateEmail = (email) => {
  if (!email) {
    throw new ValidationError('Email is required');
  }

  if (typeof email !== 'string') {
    throw new ValidationError('Email must be a string');
  }

  const sanitizedEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(sanitizedEmail)) {
    throw new ValidationError('Invalid email format');
  }

  return sanitizedEmail;
};

/**
 * String validation with length constraints
 * @param {string} value - String to validate
 * @param {string} fieldName - Field name for error messages
 * @param {Object} options - Validation options
 * @param {number} options.minLength - Minimum length
 * @param {number} options.maxLength - Maximum length
 * @param {RegExp} options.pattern - Pattern to match
 * @returns {string} Validated string
 * @throws {ValidationError} If validation fails
 *
 * @example
 * const name = validateString(input, 'username', { minLength: 3, maxLength: 20 });
 */
export const validateString = (value, fieldName, options = {}) => {
  const { minLength, maxLength, pattern } = options;

  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`);
  }

  const sanitized = value.trim();

  if (minLength !== undefined && sanitized.length < minLength) {
    throw new ValidationError(
      `${fieldName} must be at least ${minLength} characters long`
    );
  }

  if (maxLength !== undefined && sanitized.length > maxLength) {
    throw new ValidationError(
      `${fieldName} must be at most ${maxLength} characters long`
    );
  }

  if (pattern && !pattern.test(sanitized)) {
    throw new ValidationError(`${fieldName} format is invalid`);
  }

  return sanitized;
};

/**
 * Number validation with range constraints
 * @param {*} value - Value to validate
 * @param {string} fieldName - Field name for error messages
 * @param {Object} options - Validation options
 * @param {number} options.min - Minimum value
 * @param {number} options.max - Maximum value
 * @param {boolean} options.integer - Require integer
 * @returns {number} Validated number
 * @throws {ValidationError} If validation fails
 *
 * @example
 * const age = validateNumber(input, 'age', { min: 0, max: 120, integer: true });
 */
export const validateNumber = (value, fieldName, options = {}) => {
  const { min, max, integer = false } = options;

  const num = Number(value);

  if (isNaN(num)) {
    throw new ValidationError(`${fieldName} must be a valid number`);
  }

  if (integer && !Number.isInteger(num)) {
    throw new ValidationError(`${fieldName} must be an integer`);
  }

  if (min !== undefined && num < min) {
    throw new ValidationError(`${fieldName} must be at least ${min}`);
  }

  if (max !== undefined && num > max) {
    throw new ValidationError(`${fieldName} must be at most ${max}`);
  }

  return num;
};

/**
 * Boolean validation
 * @param {*} value - Value to validate
 * @param {string} fieldName - Field name for error messages
 * @returns {boolean} Validated boolean
 * @throws {ValidationError} If validation fails
 *
 * @example
 * const isActive = validateBoolean(input, 'isActive');
 */
export const validateBoolean = (value, fieldName) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (value === 'true' || value === '1' || value === 1) {
    return true;
  }

  if (value === 'false' || value === '0' || value === 0) {
    return false;
  }

  throw new ValidationError(`${fieldName} must be a boolean value`);
};

/**
 * Enum validation
 * @param {*} value - Value to validate
 * @param {string} fieldName - Field name for error messages
 * @param {Array} allowedValues - Array of allowed values
 * @returns {*} Validated value
 * @throws {ValidationError} If value not in allowed values
 *
 * @example
 * const status = validateEnum(input, 'status', ['active', 'inactive', 'pending']);
 */
export const validateEnum = (value, fieldName, allowedValues) => {
  if (!allowedValues.includes(value)) {
    throw new ValidationError(
      `${fieldName} must be one of: ${allowedValues.join(', ')}`
    );
  }
  return value;
};

// Array validation
export const validateArray = (arr, fieldName, minLength = 0) => {
  if (!Array.isArray(arr)) {
    throw new ValidationError(`${fieldName} must be an array`);
  }

  if (arr.length < minLength) {
    throw new ValidationError(
      `${fieldName} must contain at least ${minLength} items`
    );
  }

  return arr;
};

// Required field validation
export const validateRequired = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`${fieldName} is required`);
  }
  return value;
};

// GitHub configuration validation
export const validateGitHubConfig = (config) => {
  const { githubToken, owner, repo } = config;

  validateRequired(githubToken, 'GitHub token');
  validateRequired(owner, 'Repository owner');
  validateRequired(repo, 'Repository name');

  // Basic token format validation
  if (typeof githubToken !== 'string' || githubToken.length < 10) {
    throw new ValidationError('Invalid GitHub token format');
  }

  // Basic owner/repo validation
  if (!/^[a-zA-Z0-9._-]+$/.test(owner)) {
    throw new ValidationError('Invalid repository owner format');
  }

  if (!/^[a-zA-Z0-9._-]+$/.test(repo)) {
    throw new ValidationError('Invalid repository name format');
  }

  return { githubToken, owner, repo };
};

// Issue validation
export const validateIssue = (issue) => {
  if (!issue || typeof issue !== 'object') {
    throw new ValidationError('Issue must be an object');
  }

  const { type, title, description } = issue;

  if (!type || !title) {
    throw new ValidationError('Issue must have type and title');
  }

  const validTypes = ['performance', 'accessibility', 'best-practices', 'seo'];
  if (!validTypes.includes(type)) {
    throw new ValidationError(
      `Issue type must be one of: ${validTypes.join(', ')}`
    );
  }

  return issue;
};

// Changes validation for repository modifications
export const validateChanges = (changes) => {
  validateArray(changes, 'changes', 1);

  return changes.map((change, index) => {
    if (!change || typeof change !== 'object') {
      throw new ValidationError(`Change at index ${index} must be an object`);
    }

    const { findText, replaceText } = change;

    if (!findText || !replaceText) {
      throw new ValidationError(
        `Change at index ${index} must include findText and replaceText`
      );
    }

    if (typeof findText !== 'string' || typeof replaceText !== 'string') {
      throw new ValidationError(
        `findText and replaceText must be strings at index ${index}`
      );
    }

    return change;
  });
};

/**
 * Input sanitization functions
 */

/**
 * Sanitize string input by trimming and removing dangerous characters
 * @param {string} input - Input string to sanitize
 * @param {Object} options - Sanitization options
 * @param {boolean} options.allowHtml - Allow HTML tags (default: false)
 * @param {boolean} options.allowNewlines - Allow newline characters (default: true)
 * @returns {string} Sanitized string
 *
 * @example
 * const clean = sanitizeString(userInput);
 */
export const sanitizeString = (input, options = {}) => {
  const { allowHtml = false, allowNewlines = true } = options;

  if (typeof input !== 'string') {
    return '';
  }

  let sanitized = input.trim();

  // Remove HTML tags if not allowed
  if (!allowHtml) {
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  }

  // Remove newlines if not allowed
  if (!allowNewlines) {
    sanitized = sanitized.replace(/[\r\n]+/g, ' ');
  }

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  return sanitized;
};

/**
 * Sanitize object by removing undefined/null values and sanitizing strings
 * @param {Object} obj - Object to sanitize
 * @param {Object} options - Sanitization options
 * @returns {Object} Sanitized object
 *
 * @example
 * const clean = sanitizeObject({ name: '  John  ', age: null, email: 'test@example.com' });
 */
export const sanitizeObject = (obj, options = {}) => {
  if (!obj || typeof obj !== 'object') {
    return {};
  }

  const sanitized = {};

  for (const [key, value] of Object.entries(obj)) {
    // Skip null/undefined values
    if (value === null || value === undefined) {
      continue;
    }

    // Sanitize strings
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value, options);
    }
    // Recursively sanitize nested objects
    else if (typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value, options);
    }
    // Keep other types as-is
    else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Sanitize filename to prevent directory traversal
 * @param {string} filename - Filename to sanitize
 * @returns {string} Sanitized filename
 *
 * @example
 * const safe = sanitizeFilename('../../../etc/passwd'); // Returns 'etc-passwd'
 */
export const sanitizeFilename = (filename) => {
  if (typeof filename !== 'string') {
    return '';
  }

  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '-') // Replace special chars with dash
    .replace(/\.{2,}/g, '.') // Remove multiple dots
    .replace(/^\.+/, '') // Remove leading dots
    .replace(/\.+$/, '') // Remove trailing dots
    .substring(0, 255); // Limit length
};

/**
 * Sanitize path to prevent directory traversal
 * @param {string} path - Path to sanitize
 * @returns {string} Sanitized path
 *
 * @example
 * const safe = sanitizePath('../../etc/passwd'); // Throws error or returns safe path
 */
export const sanitizePath = (path) => {
  if (typeof path !== 'string') {
    throw new ValidationError('Path must be a string');
  }

  // Check for directory traversal attempts
  if (path.includes('..')) {
    throw new ValidationError(
      'Path cannot contain directory traversal sequences'
    );
  }

  // Remove leading/trailing slashes and normalize
  return path.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/');
};
