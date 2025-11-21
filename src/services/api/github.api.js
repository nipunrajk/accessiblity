/**
 * GitHub API Module
 * Handles all GitHub-related API calls
 */

import apiService from './api.service.js';
import logger from '../../utils/logger.js';
import { createGitHubError } from '../../utils/errorHandler.js';

/**
 * @typedef {Object} GitHubConfig
 * @property {string} githubToken - GitHub personal access token
 * @property {string} owner - Repository owner
 * @property {string} repo - Repository name
 */

/**
 * @typedef {Object} GitHubConnectionResult
 * @property {boolean} success - Whether connection was successful
 * @property {string} message - Result message
 * @property {Object} [data] - Additional data
 */

/**
 * @typedef {Object} RepositoryModificationOptions
 * @property {string} githubToken - GitHub token
 * @property {string} owner - Repository owner
 * @property {string} repo - Repository name
 * @property {Array} issues - Issues to fix
 * @property {string} suggestion - Fix suggestion
 */

class GitHubAPI {
  constructor(api = apiService) {
    this.api = api;
  }

  /**
   * Connect to GitHub repository
   * @param {GitHubConfig} config - GitHub configuration
   * @returns {Promise<GitHubConnectionResult>} Connection result
   * @throws {Error} When connection fails
   *
   * @example
   * const result = await githubAPI.connect({
   *   githubToken: 'ghp_...',
   *   owner: 'username',
   *   repo: 'repository'
   * });
   */
  async connect(config) {
    try {
      const { githubToken, owner, repo } = config;

      logger.info('Connecting to GitHub repository', { owner, repo });

      const response = await this.api.post('/api/github/connect', {
        code: githubToken,
        owner,
        repo,
      });

      if (response && response.success) {
        logger.success('GitHub connection successful', { owner, repo });
        return response;
      }

      throw new Error(response?.message || 'Failed to connect to GitHub');
    } catch (error) {
      const githubError = createGitHubError('GitHub connection failed', error, {
        owner: config.owner,
        repo: config.repo,
      });
      logger.error('GitHub connection failed', error, {
        owner: config.owner,
        repo: config.repo,
      });
      throw githubError;
    }
  }

  /**
   * Get GitHub repository configuration
   * @returns {Promise<GitHubConfig|null>} Stored configuration or null
   *
   * @example
   * const config = await githubAPI.getConfig();
   * if (config) {
   *   console.log('Repository:', config.owner, config.repo);
   * }
   */
  async getConfig() {
    try {
      logger.debug('Fetching GitHub configuration');

      const response = await this.api.get('/api/github/config', {
        skipRetry: true,
      });

      if (response && response.config) {
        logger.debug('GitHub configuration retrieved');
        return response.config;
      }

      return null;
    } catch (error) {
      logger.debug('No GitHub configuration found', { error: error.message });
      return null;
    }
  }

  /**
   * Apply fixes to GitHub repository
   * @param {RepositoryModificationOptions} options - Modification options
   * @returns {Promise<Object>} Result of applying fixes
   * @throws {Error} When applying fixes fails
   *
   * @example
   * const result = await githubAPI.applyFixes({
   *   githubToken: 'ghp_...',
   *   owner: 'username',
   *   repo: 'repository',
   *   issues: [...],
   *   suggestion: 'Fix description'
   * });
   */
  async applyFixes(options) {
    try {
      const { githubToken, owner, repo, issues, suggestion } = options;

      logger.info('Applying fixes to GitHub repository', {
        owner,
        repo,
        issueCount: issues?.length || 0,
      });

      const response = await this.api.post('/api/github/apply-fixes', {
        githubToken,
        owner,
        repo,
        issues,
        suggestion,
      });

      if (response && response.success) {
        logger.success('Fixes applied to GitHub repository', {
          owner,
          repo,
        });
        return response;
      }

      throw new Error(response?.message || 'Failed to apply fixes');
    } catch (error) {
      const githubError = createGitHubError('Failed to apply fixes', error, {
        owner: options.owner,
        repo: options.repo,
      });
      logger.error('Failed to apply fixes to GitHub', error, {
        owner: options.owner,
        repo: options.repo,
      });
      throw githubError;
    }
  }

  /**
   * Analyze GitHub repository
   * @param {GitHubConfig} config - GitHub configuration
   * @returns {Promise<Object>} Analysis results
   * @throws {Error} When analysis fails
   *
   * @example
   * const analysis = await githubAPI.analyzeRepository({
   *   githubToken: 'ghp_...',
   *   owner: 'username',
   *   repo: 'repository'
   * });
   */
  async analyzeRepository(config) {
    try {
      const { githubToken, owner, repo } = config;

      logger.info('Analyzing GitHub repository', { owner, repo });

      const response = await this.api.post('/api/github/analyze', {
        githubToken,
        owner,
        repo,
      });

      if (response) {
        logger.success('GitHub repository analysis completed', {
          owner,
          repo,
        });
        return response;
      }

      throw new Error('Failed to analyze repository');
    } catch (error) {
      const githubError = createGitHubError(
        'Repository analysis failed',
        error,
        {
          owner: config.owner,
          repo: config.repo,
        }
      );
      logger.error('GitHub repository analysis failed', error, {
        owner: config.owner,
        repo: config.repo,
      });
      throw githubError;
    }
  }

  /**
   * Validate GitHub token
   * @param {string} token - GitHub token to validate
   * @returns {Promise<boolean>} True if token is valid
   *
   * @example
   * const isValid = await githubAPI.validateToken('ghp_...');
   * if (isValid) {
   *   // Proceed with GitHub operations
   * }
   */
  async validateToken(token) {
    try {
      logger.debug('Validating GitHub token');

      const response = await this.api.post(
        '/api/github/validate-token',
        { token },
        { skipRetry: true }
      );

      return response && response.valid === true;
    } catch (error) {
      logger.debug('GitHub token validation failed', { error: error.message });
      return false;
    }
  }
}

// Export singleton instance
export default new GitHubAPI();

// Export class for testing or custom instances
export { GitHubAPI };
