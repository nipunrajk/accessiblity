import { promises as fs } from 'fs';
import path from 'path';
import { Octokit } from '@octokit/rest';
import logger from '../utils/logger.js';

const CONFIG_PATH = path.join(process.cwd(), 'config.json');

export const connectGitHub = async (req, res) => {
  try {
    const { code: githubToken, owner, repo } = req.body;

    if (!githubToken) {
      return res.status(400).json({
        success: false,
        message: 'GitHub token is required',
      });
    }

    // Test the GitHub token by making a simple API call
    const octokit = new Octokit({
      auth: githubToken,
    });

    try {
      // Test the token by getting user info
      const { data: user } = await octokit.users.getAuthenticated();

      // If owner and repo are provided, validate them
      if (owner && repo) {
        try {
          await octokit.repos.get({ owner, repo });
        } catch (error) {
          return res.status(400).json({
            success: false,
            message: `Repository ${owner}/${repo} not found or not accessible with this token`,
          });
        }
      }

      // Update the config.json file
      const config = {
        githubToken,
        owner: owner || user.login,
        repo: repo || '',
      };

      await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));

      // Get user's repositories if no specific repo was provided
      let repositories = [];
      if (!repo) {
        try {
          const { data: repos } = await octokit.repos.listForAuthenticatedUser({
            sort: 'updated',
            per_page: 10,
          });
          repositories = repos.map((r) => ({
            name: r.name,
            full_name: r.full_name,
            private: r.private,
            updated_at: r.updated_at,
          }));
        } catch (error) {
          logger.warn('Could not fetch repositories', error);
        }
      }

      res.json({
        success: true,
        message: 'GitHub connection successful',
        data: {
          user: {
            login: user.login,
            name: user.name,
            avatar_url: user.avatar_url,
          },
          config: {
            owner: config.owner,
            repo: config.repo,
          },
        },
        repositories,
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid GitHub token or insufficient permissions',
      });
    }
  } catch (error) {
    logger.error('GitHub connection error', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect to GitHub: ' + error.message,
    });
  }
};

export const getGitHubConfig = async (req, res) => {
  try {
    const configData = await fs.readFile(CONFIG_PATH, 'utf8');
    const config = JSON.parse(configData);

    // Don't return the actual token, just indicate if it's configured
    res.json({
      success: true,
      configured: !!config.githubToken,
      owner: config.owner,
      repo: config.repo,
    });
  } catch (error) {
    res.json({
      success: true,
      configured: false,
      owner: '',
      repo: '',
    });
  }
};
