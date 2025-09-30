import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { STORAGE_KEYS } from '../constants';

function GitHubConfig() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    githubToken: '',
    owner: '',
    repo: '',
    defaultBranch: 'main',
  });

  // Load existing analysis data on component mount
  useEffect(() => {
    const loadExistingData = () => {
      try {
        const savedResults = localStorage.getItem(
          STORAGE_KEYS.ANALYSIS_RESULTS
        );
        const savedAiFixes = localStorage.getItem(STORAGE_KEYS.AI_FIXES);
        const savedElementIssues = localStorage.getItem(
          STORAGE_KEYS.ELEMENT_ISSUES
        );
        const savedWebsiteUrl = localStorage.getItem(STORAGE_KEYS.WEBSITE_URL);

        if (savedWebsiteUrl) {
          setWebsiteUrl(savedWebsiteUrl);
        }

        // Collect all issues from different sources
        const allIssues = [];

        if (savedResults) {
          const results = JSON.parse(savedResults);
          allIssues.push(...(results?.performance?.issues || []));
          allIssues.push(...(results?.accessibility?.issues || []));
          allIssues.push(...(results?.bestPractices?.issues || []));
          allIssues.push(...(results?.seo?.issues || []));
        }

        if (savedElementIssues) {
          const elementIssues = JSON.parse(savedElementIssues);
          if (Array.isArray(elementIssues)) {
            allIssues.push(...elementIssues);
          }
        }

        setExistingIssues(allIssues);
      } catch (error) {
        console.error('Error loading existing analysis data:', error);
      }
    };

    loadExistingData();
  }, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [repositories, setRepositories] = useState([]);
  const [existingIssues, setExistingIssues] = useState([]);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [applyingFixes, setApplyingFixes] = useState(false);

  const applyFixesToRepository = async (user, config) => {
    setApplyingFixes(true);
    try {
      // Get AI fixes from localStorage
      const savedAiFixes = localStorage.getItem(STORAGE_KEYS.AI_FIXES);
      let aiFixes = {};

      if (savedAiFixes) {
        aiFixes = JSON.parse(savedAiFixes);
      } else {
        // Generate AI fixes if not cached
        const response = await fetch('/api/ai-fixes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ issues: existingIssues }),
        });

        if (response.ok) {
          const { suggestions } = await response.json();
          aiFixes = suggestions;
        }
      }

      // Apply fixes to repository using the specialized endpoint
      const fixResponse = await fetch('/api/apply-accessibility-fixes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          issues: existingIssues,
          aiSuggestions: aiFixes,
        }),
      });

      const fixData = await fixResponse.json();

      if (!fixResponse.ok) {
        throw new Error(fixData.error || 'Failed to apply fixes to repository');
      }

      // Show success with pull request details
      setSuccessData({
        user,
        config,
        message: 'Fixes applied successfully to your repository!',
        pullRequest: fixData.pullRequest,
        changes: fixData.changes || [],
        appliedFixes: true,
      });
    } catch (error) {
      console.error('Error applying fixes:', error);
      setError(`Failed to apply fixes: ${error.message}`);
      // Still show the basic success message
      setSuccessData({
        user,
        config,
        message:
          'GitHub configuration saved, but failed to apply fixes automatically.',
      });
    } finally {
      setApplyingFixes(false);
    }
  };

  const analyzeRepositoryAndApplyFixes = async (user, config) => {
    setApplyingFixes(true);
    try {
      // First, analyze the repository
      setError(null);

      const response = await fetch('/api/analyze-repo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to analyze repository');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let analysisResults = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.error) {
                throw new Error(data.error);
              }

              if (data.done) {
                analysisResults = data;
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }

      if (!analysisResults) {
        throw new Error('No analysis results received');
      }

      // Extract all issues from the analysis
      const allIssues = [
        ...(analysisResults.performance?.issues || []),
        ...(analysisResults.accessibility?.issues || []),
        ...(analysisResults.bestPractices?.issues || []),
        ...(analysisResults.seo?.issues || []),
      ];

      if (allIssues.length === 0) {
        setSuccessData({
          user,
          config,
          message: 'Repository analyzed successfully! No issues found.',
          repository: analysisResults.repository,
        });
        return;
      }

      // Generate AI fixes for the found issues
      const aiResponse = await fetch('/api/ai-fixes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ issues: allIssues }),
      });

      let aiFixes = {};
      if (aiResponse.ok) {
        const { suggestions } = await aiResponse.json();
        aiFixes = suggestions;
      }

      if (allIssues.length === 0) {
        setSuccessData({
          user,
          config,
          message: 'Repository analyzed successfully! No issues found.',
          repository: analysisResults.repository,
        });
        return;
      }

      // Apply accessibility fixes to repository using the specialized endpoint
      const fixResponse = await fetch('/api/apply-accessibility-fixes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          issues: allIssues,
          aiSuggestions: aiFixes,
        }),
      });

      const fixData = await fixResponse.json();

      if (!fixResponse.ok) {
        throw new Error(fixData.error || 'Failed to apply fixes to repository');
      }

      // Show success with pull request details
      setSuccessData({
        user,
        config,
        message: `Repository analyzed and fixes applied! Found ${allIssues.length} issues in ${analysisResults.scanStats.filesAnalyzed} HTML files.`,
        pullRequest: fixData.pullRequest,
        changes: fixData.changes || [],
        appliedFixes: true,
        repository: analysisResults.repository,
        analysisResults,
      });
    } catch (error) {
      console.error('Error analyzing repository:', error);
      setError(`Failed to analyze repository: ${error.message}`);
      // Still show the basic success message
      setSuccessData({
        user,
        config,
        message:
          'GitHub configuration saved, but failed to analyze repository automatically.',
      });
    } finally {
      setApplyingFixes(false);
    }
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'speed':
        return 'text-blue-600';
      case 'seo':
        return 'text-purple-600';
      case 'ux':
        return 'text-green-600';
      case 'security':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessData(null);

    try {
      const response = await fetch('/api/github/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: formData.githubToken,
          owner: formData.owner,
          repo: formData.repo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to connect to GitHub');
      }

      setIsConnected(true);
      setRepositories(data.repositories || []);

      // If there are existing issues, automatically apply fixes
      if (existingIssues.length > 0) {
        await applyFixesToRepository(data.data.user, data.data.config);
      } else {
        // No existing issues, analyze repository directly
        await analyzeRepositoryAndApplyFixes(data.data.user, data.data.config);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (successData) {
    return (
      <div className='min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-4xl mx-auto'>
          <div className='bg-white rounded-lg shadow-lg p-8'>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-2xl font-bold text-gray-900'>
                {successData.appliedFixes
                  ? 'Fixes Applied Successfully!'
                  : 'GitHub Configuration Complete'}
              </h2>
              <div className='flex gap-3'>
                {successData.pullRequest && (
                  <>
                    <a
                      href={successData.pullRequest.html_url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors'
                    >
                      View Pull Request
                    </a>
                    <a
                      href={successData.pullRequest.diff_url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors'
                    >
                      View Changes
                    </a>
                  </>
                )}
                {!successData.appliedFixes && (
                  <button
                    onClick={() =>
                      navigate('/ai-fix', {
                        state: {
                          issues: existingIssues,
                          websiteUrl: websiteUrl,
                          scanStats: JSON.parse(
                            localStorage.getItem(STORAGE_KEYS.SCAN_STATS) ||
                              '{"pagesScanned": 0, "totalPages": 0, "scannedUrls": []}'
                          ),
                          scannedElements: JSON.parse(
                            localStorage.getItem(
                              STORAGE_KEYS.SCANNED_ELEMENTS
                            ) || '[]'
                          ),
                          cachedAiFixes: JSON.parse(
                            localStorage.getItem(STORAGE_KEYS.AI_FIXES) || '{}'
                          ),
                        },
                      })
                    }
                    className='px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors'
                  >
                    Continue to AI Fix
                  </button>
                )}
              </div>
            </div>

            <div className='space-y-6'>
              <div className='bg-green-50 border border-green-200 rounded-lg p-6'>
                <div className='flex items-center gap-3 mb-4'>
                  <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center'>
                    <svg
                      className='w-5 h-5 text-green-600'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M5 13l4 4L19 7'
                      />
                    </svg>
                  </div>
                  <h3 className='text-lg font-semibold text-green-900'>
                    {successData.message}
                  </h3>
                </div>

                <div className='grid md:grid-cols-2 gap-4'>
                  <div>
                    <h4 className='font-medium text-gray-900 mb-2'>
                      GitHub User
                    </h4>
                    <div className='flex items-center gap-3'>
                      {successData.user?.avatar_url && (
                        <img
                          src={successData.user.avatar_url}
                          alt={successData.user.name || successData.user.login}
                          className='w-10 h-10 rounded-full'
                        />
                      )}
                      <div>
                        <p className='font-medium'>
                          {successData.user?.name || successData.user?.login}
                        </p>
                        <p className='text-sm text-gray-600'>
                          @{successData.user?.login}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className='font-medium text-gray-900 mb-2'>
                      Repository Configuration
                    </h4>
                    <p className='text-gray-700'>
                      <span className='font-medium'>Owner:</span>{' '}
                      {successData.config?.owner}
                    </p>
                    <p className='text-gray-700'>
                      <span className='font-medium'>Repository:</span>{' '}
                      {successData.config?.repo || 'Not specified'}
                    </p>
                    {successData.repository && (
                      <>
                        <p className='text-gray-700'>
                          <span className='font-medium'>Files Analyzed:</span>{' '}
                          {successData.repository.filesAnalyzed}
                        </p>
                        <p className='text-gray-700'>
                          <span className='font-medium'>Total Issues:</span>{' '}
                          {successData.repository.totalIssues}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {successData.appliedFixes &&
                successData.changes &&
                successData.changes.length > 0 && (
                  <div className='bg-blue-50 border border-blue-200 rounded-lg p-6'>
                    <h4 className='font-medium text-blue-900 mb-3'>
                      Applied Changes
                    </h4>
                    <div className='space-y-3'>
                      {successData.changes.slice(0, 5).map((change, index) => (
                        <div
                          key={index}
                          className='bg-white p-4 rounded border'
                        >
                          <div className='flex items-center justify-between mb-2'>
                            <span className='font-medium text-gray-900'>
                              {change.filePath || change.file}
                            </span>
                            <span className='text-sm text-gray-500'>
                              {change.status}
                            </span>
                          </div>
                          {change.reason && (
                            <p className='text-sm text-gray-600 mb-2'>
                              {change.reason}
                            </p>
                          )}
                          {change.category && (
                            <span
                              className={`text-xs px-2 py-1 rounded ${getCategoryColor(
                                change.category
                              )}`}
                            >
                              {change.category}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {repositories.length > 0 && !successData.appliedFixes && (
                <div className='bg-blue-50 border border-blue-200 rounded-lg p-6'>
                  <h4 className='font-medium text-blue-900 mb-3'>
                    Your Recent Repositories
                  </h4>
                  <div className='space-y-2'>
                    {repositories.slice(0, 5).map((repo, index) => (
                      <div
                        key={index}
                        className='flex items-center justify-between py-2 px-3 bg-white rounded border'
                      >
                        <div>
                          <p className='font-medium text-gray-900'>
                            {repo.name}
                          </p>
                          <p className='text-sm text-gray-600'>
                            {repo.full_name}
                          </p>
                        </div>
                        <div className='flex items-center gap-2'>
                          {repo.private && (
                            <span className='text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded'>
                              Private
                            </span>
                          )}
                          <span className='text-xs text-gray-500'>
                            Updated{' '}
                            {new Date(repo.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='absolute top-8 left-8'>
        <img src='/logo.svg' alt='Logo' className='h-12 w-auto' />
      </div>
      <div className='max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 mt-16'>
        <div className='flex items-center justify-between mb-6'>
          <h2 className='text-2xl font-bold text-gray-900'>
            GitHub Configuration
          </h2>
          <button
            onClick={() => navigate(-1)}
            className='p-2 bg-transparent border border-black hover:bg-gray-100 rounded-full'
          >
            <svg
              className='w-6 h-6 text-gray-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>

        {error && (
          <div className='mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700'>
            {error}
          </div>
        )}

        {existingIssues.length > 0 && (
          <div className='mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 text-blue-700'>
            <p className='font-medium'>Ready to apply fixes!</p>
            <p className='text-sm'>
              Found {existingIssues.length} issues from your analysis of{' '}
              <strong>{websiteUrl}</strong>. After connecting to GitHub, we'll
              automatically apply AI-generated fixes to your repository.
            </p>
          </div>
        )}

        {existingIssues.length === 0 && (
          <div className='mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700'>
            <p className='font-medium'>No website analysis found</p>
            <p className='text-sm'>
              You can either analyze a website first, or we can analyze HTML
              files directly from your repository after connecting.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-6'>
          <div>
            <label
              htmlFor='githubToken'
              className='block text-sm font-medium text-gray-700'
            >
              GitHub Token
            </label>
            <input
              type='password'
              name='githubToken'
              id='githubToken'
              value={formData.githubToken}
              onChange={handleChange}
              required
              className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              placeholder='Enter your GitHub token'
            />
          </div>

          <div>
            <label
              htmlFor='owner'
              className='block text-sm font-medium text-gray-700'
            >
              Repository Owner
            </label>
            <input
              type='text'
              name='owner'
              id='owner'
              value={formData.owner}
              onChange={handleChange}
              required
              className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              placeholder='e.g., username or organization'
            />
          </div>

          <div>
            <label
              htmlFor='repo'
              className='block text-sm font-medium text-gray-700'
            >
              Repository Name
            </label>
            <input
              type='text'
              name='repo'
              id='repo'
              value={formData.repo}
              onChange={handleChange}
              required
              className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              placeholder='e.g., my-project'
            />
          </div>

          <div className='flex justify-end'>
            <button
              type='submit'
              disabled={loading || applyingFixes}
              className='px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
            >
              {loading || applyingFixes ? (
                <>
                  <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>
                  {applyingFixes ? 'Applying fixes...' : 'Connecting...'}
                </>
              ) : (
                'Connect Repository'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default GitHubConfig;
