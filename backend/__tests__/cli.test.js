import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { main, optionDefinitions } from '../cli.js';
import analysisOrchestrator from '../services/analysis/analysis-orchestrator.service.js';

// Mock the orchestrator service
vi.mock('../services/analysis/analysis-orchestrator.service.js', () => {
  return {
    default: {
      analyzeWebsite: vi.fn(),
    },
  };
});

describe('FastFix CLI tests', () => {
  let exitMock;
  let logMock;
  let errorMock;
  let originalArgv;

  beforeEach(() => {
    // Mock process.exit
    exitMock = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    // Mock console methods
    logMock = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorMock = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'table').mockImplementation(() => {});

    originalArgv = process.argv;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.argv = originalArgv;
  });

  it('should define all expected options', () => {
    expect(optionDefinitions.url).toBeDefined();
    expect(optionDefinitions['include-ai']).toBeDefined();
    expect(optionDefinitions['no-include-axe']).toBeDefined();
    expect(optionDefinitions['no-include-pa11y']).toBeDefined();
    expect(optionDefinitions['no-include-keyboard']).toBeDefined();
    expect(optionDefinitions['fail-on-perf']).toBeDefined();
    expect(optionDefinitions['fail-on-a11y']).toBeDefined();
    expect(optionDefinitions['fail-on-best-practices']).toBeDefined();
    expect(optionDefinitions['fail-on-seo']).toBeDefined();
    expect(optionDefinitions.output).toBeDefined();
    expect(optionDefinitions.help).toBeDefined();
  });

  it('should print help and exit 0 when --help is passed', async () => {
    process.argv = ['node', 'cli.js', '--help'];

    await expect(main()).rejects.toThrow('process.exit called');
    expect(exitMock).toHaveBeenCalledWith(0);
    expect(logMock).toHaveBeenCalled();
  });

  it('should error and exit 1 when --url is missing', async () => {
    process.argv = ['node', 'cli.js'];

    await expect(main()).rejects.toThrow('process.exit called');
    expect(exitMock).toHaveBeenCalledWith(1);
    expect(errorMock).toHaveBeenCalledWith(expect.stringContaining('Error: The --url parameter is required.'));
  });

  it('should trigger orchestrator and exit 0 when scores satisfy thresholds', async () => {
    process.argv = ['node', 'cli.js', '--url', 'https://example.com', '--fail-on-a11y', '80'];

    analysisOrchestrator.analyzeWebsite.mockResolvedValue({
      performance: { score: 90 },
      accessibility: { score: 85 },
      bestPractices: { score: 95 },
      seo: { score: 100 },
    });

    await expect(main()).rejects.toThrow('process.exit called');

    expect(analysisOrchestrator.analyzeWebsite).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://example.com',
      })
    );
    expect(exitMock).toHaveBeenCalledWith(0);
  });

  it('should exit 1 when audit score is below threshold', async () => {
    process.argv = ['node', 'cli.js', '--url', 'https://example.com', '--fail-on-a11y', '90'];

    analysisOrchestrator.analyzeWebsite.mockResolvedValue({
      performance: { score: 90 },
      accessibility: { score: 85 }, // below 90 threshold
      bestPractices: { score: 95 },
      seo: { score: 100 },
    });

    await expect(main()).rejects.toThrow('process.exit called');
    expect(exitMock).toHaveBeenCalledWith(1);
    expect(errorMock).toHaveBeenCalledWith(expect.stringContaining('Audit threshold check failed'));
  });
});
