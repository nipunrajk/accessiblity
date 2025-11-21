/**
 * Frontend validation utilities
 * Provides client-side validation functions
 */

/**
 * URL validation
 * @param {string} url - URL to validate
 * @param {Object} options - Validation options
 * @param {string[]} options.allowedProtocols - Allowed protocols (default: ['http:', 'https:'])
 * @param {boolean} options.requireHttps - Require HTTPS protocol
 * @returns {Object} Validation result { isValid: boolean, error: string|null, url: string|null }
 *
 * @example
 * const result = validateUrl('https://example.com');
 * if (result.isValid) {
 *   console.log('Valid URL:', result.url);
 * }
 */
export const validateUrl = (url, options = {}) => {
  const { allowedProtocols = ['http:', 'https:'], requireHttps = false } =
    options;

  if (!url) {
    return { isValid: false, error: 'URL is required', url: null };
  }

  if (typeof url !== 'string') {
    return { isValid: false, error: 'URL must be a string', url: null };
  }

  const sanitizedUrl = url.trim();

  try {
    const urlObj = new URL(sanitizedUrl);

    if (!allowedProtocols.includes(urlObj.protocol)) {
      return {
        isValid: false,
        error: `URL must use one of the following protocols: ${allowedProtocols.join(
          ', '
        )}`,
        url: null,
      };
    }

    if (requireHttps && urlObj.protocol !== 'https:') {
      return {
        isValid: false,
        error: 'URL must use HTTPS protocol',
        url: null,
      };
    }

    return { isValid: true, error: null, url: urlObj.href };
  } catch (error) {
    return { isValid: false, error: 'Invalid URL format', url: null };
  }
};

/**
 * Email validation
 * @param {string} email - Email to validate
 * @returns {Object} Validation result { isValid: boolean, error: string|null, email: string|null }
 *
 * @example
 * const result = validateEmail('user@example.com');
 */
export const validateEmail = (email) => {
  if (!email) {
    return { isValid: false, error: 'Email is required', email: null };
  }

  if (typeof email !== 'string') {
    return { isValid: false, error: 'Email must be a string', email: null };
  }

  const sanitizedEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(sanitizedEmail)) {
    return { isValid: false, error: 'Invalid email format', email: null };
  }

  return { isValid: true, error: null, email: sanitizedEmail };
};

/**
 * String validation with length constraints
 * @param {string} value - String to validate
 * @param {string} fieldName - Field name for error messages
 * @param {Object} options - Validation options
 * @param {number} options.minLength - Minimum length
 * @param {number} options.maxLength - Maximum length
 * @param {RegExp} options.pattern - Pattern to match
 * @returns {Object} Validation result
 *
 * @example
 * const result = validateString(input, 'username', { minLength: 3, maxLength: 20 });
 */
export const validateString = (value, fieldName, options = {}) => {
  const { minLength, maxLength, pattern } = options;

  if (typeof value !== 'string') {
    return {
      isValid: false,
      error: `${fieldName} must be a string`,
      value: null,
    };
  }

  const sanitized = value.trim();

  if (minLength !== undefined && sanitized.length < minLength) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${minLength} characters long`,
      value: null,
    };
  }

  if (maxLength !== undefined && sanitized.length > maxLength) {
    return {
      isValid: false,
      error: `${fieldName} must be at most ${maxLength} characters long`,
      value: null,
    };
  }

  if (pattern && !pattern.test(sanitized)) {
    return {
      isValid: false,
      error: `${fieldName} format is invalid`,
      value: null,
    };
  }

  return { isValid: true, error: null, value: sanitized };
};

/**
 * Number validation with range constraints
 * @param {*} value - Value to validate
 * @param {string} fieldName - Field name for error messages
 * @param {Object} options - Validation options
 * @param {number} options.min - Minimum value
 * @param {number} options.max - Maximum value
 * @param {boolean} options.integer - Require integer
 * @returns {Object} Validation result
 *
 * @example
 * const result = validateNumber(input, 'age', { min: 0, max: 120, integer: true });
 */
export const validateNumber = (value, fieldName, options = {}) => {
  const { min, max, integer = false } = options;

  const num = Number(value);

  if (isNaN(num)) {
    return {
      isValid: false,
      error: `${fieldName} must be a valid number`,
      value: null,
    };
  }

  if (integer && !Number.isInteger(num)) {
    return {
      isValid: false,
      error: `${fieldName} must be an integer`,
      value: null,
    };
  }

  if (min !== undefined && num < min) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${min}`,
      value: null,
    };
  }

  if (max !== undefined && num > max) {
    return {
      isValid: false,
      error: `${fieldName} must be at most ${max}`,
      value: null,
    };
  }

  return { isValid: true, error: null, value: num };
};

/**
 * Required field validation
 * @param {*} value - Value to validate
 * @param {string} fieldName - Field name for error messages
 * @returns {Object} Validation result
 *
 * @example
 * const result = validateRequired(input, 'username');
 */
export const validateRequired = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return {
      isValid: false,
      error: `${fieldName} is required`,
      value: null,
    };
  }
  return { isValid: true, error: null, value };
};

/**
 * Enum validation
 * @param {*} value - Value to validate
 * @param {string} fieldName - Field name for error messages
 * @param {Array} allowedValues - Array of allowed values
 * @returns {Object} Validation result
 *
 * @example
 * const result = validateEnum(input, 'status', ['active', 'inactive', 'pending']);
 */
export const validateEnum = (value, fieldName, allowedValues) => {
  if (!allowedValues.includes(value)) {
    return {
      isValid: false,
      error: `${fieldName} must be one of: ${allowedValues.join(', ')}`,
      value: null,
    };
  }
  return { isValid: true, error: null, value };
};

/**
 * Form validation helper
 * Validates multiple fields at once
 * @param {Object} fields - Object with field values and validation rules
 * @returns {Object} Validation result with errors object
 *
 * @example
 * const result = validateForm({
 *   email: { value: 'test@example.com', validator: validateEmail },
 *   username: { value: 'john', validator: (v) => validateString(v, 'username', { minLength: 3 }) }
 * });
 */
export const validateForm = (fields) => {
  const errors = {};
  const values = {};
  let isValid = true;

  for (const [fieldName, fieldConfig] of Object.entries(fields)) {
    const { value, validator } = fieldConfig;
    const result = validator(value);

    if (!result.isValid) {
      errors[fieldName] = result.error;
      isValid = false;
    } else {
      values[fieldName] = result.value !== null ? result.value : value;
    }
  }

  return { isValid, errors, values };
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

export default {
  validateUrl,
  validateEmail,
  validateString,
  validateNumber,
  validateRequired,
  validateEnum,
  validateForm,
  sanitizeString,
  sanitizeFilename,
};
