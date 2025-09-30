import { ValidationError } from '../middleware/errorHandler.js';

// URL validation
export const validateUrl = (url) => {
  if (!url) {
    throw new ValidationError('URL is required');
  }

  if (typeof url !== 'string') {
    throw new ValidationError('URL must be a string');
  }

  try {
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new ValidationError('URL must use HTTP or HTTPS protocol');
    }
    return urlObj.href;
  } catch (error) {
    throw new ValidationError('Invalid URL format');
  }
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
