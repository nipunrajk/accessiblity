import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { STORAGE_KEYS } from '../constants';
import { Box, Flex, Heading, Text, Button, Callout, Spinner, TextField } from '@radix-ui/themes';

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
    if (error) setError(null);
  };

  if (successData) {
    return (
      <Box p="6" style={{ backgroundColor: 'var(--gray-1)', minHeight: '100vh' }}>
        <Box maxWidth="800px" mx="auto">
          <Box p="6" style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-3)', boxShadow: 'var(--shadow-3)' }}>
            <Flex align="center" justify="between" mb="6" wrap="wrap" gap="4">
              <Heading size="6" weight="bold">
                {successData.appliedFixes ? 'Fixes Applied Successfully!' : 'GitHub Configuration Complete'}
              </Heading>
              <Flex gap="3">
                {successData.pullRequest && (
                  <>
                    <Button asChild color="gray" variant="solid">
                      <a href={successData.pullRequest.html_url} target="_blank" rel="noopener noreferrer">View Pull Request</a>
                    </Button>
                    <Button asChild color="gray" variant="surface">
                      <a href={successData.pullRequest.diff_url} target="_blank" rel="noopener noreferrer">View Changes</a>
                    </Button>
                  </>
                )}
                {!successData.appliedFixes && (
                  <Button
                    color="teal"
                    variant="solid"
                    onClick={() => navigate('/ai-fix', {
                      state: {
                        issues: existingIssues,
                        websiteUrl: websiteUrl,
                        scanStats: JSON.parse(localStorage.getItem(STORAGE_KEYS.SCAN_STATS) || '{"pagesScanned": 0, "totalPages": 0, "scannedUrls": []}'),
                        scannedElements: JSON.parse(localStorage.getItem(STORAGE_KEYS.SCANNED_ELEMENTS) || '[]'),
                        cachedAiFixes: JSON.parse(localStorage.getItem(STORAGE_KEYS.AI_FIXES) || '{}'),
                      },
                    })}
                  >
                    Continue to AI Fix
                  </Button>
                )}
              </Flex>
            </Flex>

            <Flex direction="column" gap="6">
              <Callout.Root color="jade" size="2">
                <Callout.Icon>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </Callout.Icon>
                <Callout.Text weight="bold">{successData.message}</Callout.Text>
              </Callout.Root>

              <Flex gap="6" wrap="wrap">
                <Box>
                  <Text size="3" weight="bold" mb="2" as="div">GitHub User</Text>
                  <Flex gap="3" align="center">
                    {successData.user?.avatar_url && (
                      <img src={successData.user.avatar_url} alt={successData.user.name || successData.user.login} className="w-10 h-10 rounded-full" />
                    )}
                    <Box>
                      <Text size="2" weight="medium" as="div">{successData.user?.name || successData.user?.login}</Text>
                      <Text size="1" color="gray" as="div">@{successData.user?.login}</Text>
                    </Box>
                  </Flex>
                </Box>

                <Box>
                  <Text size="3" weight="bold" mb="2" as="div">Repository Configuration</Text>
                  <Text size="2" as="div"><Text weight="bold">Owner:</Text> {successData.config?.owner}</Text>
                  <Text size="2" as="div"><Text weight="bold">Repository:</Text> {successData.config?.repo || 'Not specified'}</Text>
                  {successData.repository && (
                    <>
                      <Text size="2" as="div"><Text weight="bold">Files Analyzed:</Text> {successData.repository.filesAnalyzed}</Text>
                      <Text size="2" as="div"><Text weight="bold">Total Issues:</Text> {successData.repository.totalIssues}</Text>
                    </>
                  )}
                </Box>
              </Flex>

              {successData.appliedFixes && successData.changes && successData.changes.length > 0 && (
                <Box>
                  <Heading size="4" mb="3">Applied Changes</Heading>
                  <Flex direction="column" gap="3">
                    {successData.changes.slice(0, 5).map((change, index) => (
                      <Box key={index} p="4" style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-2)', border: '1px solid var(--gray-5)' }}>
                        <Flex justify="between" mb="2">
                          <Text weight="medium">{change.filePath || change.file}</Text>
                          <Text size="1" color="gray">{change.status}</Text>
                        </Flex>
                        {change.reason && <Text size="2" color="gray" mb="2" as="div">{change.reason}</Text>}
                        {change.category && <Text size="1" as="span" style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--gray-3)' }}>{change.category}</Text>}
                      </Box>
                    ))}
                  </Flex>
                </Box>
              )}

              {repositories.length > 0 && !successData.appliedFixes && (
                <Box>
                  <Heading size="4" mb="3">Your Recent Repositories</Heading>
                  <Flex direction="column" gap="2">
                    {repositories.slice(0, 5).map((repo, index) => (
                      <Flex key={index} justify="between" align="center" p="3" style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-2)', border: '1px solid var(--gray-5)' }}>
                        <Box>
                          <Text weight="medium" as="div">{repo.name}</Text>
                          <Text size="1" color="gray" as="div">{repo.full_name}</Text>
                        </Box>
                        <Flex gap="2" align="center">
                          {repo.private && <Text size="1" style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--amber-3)', color: 'var(--amber-11)' }}>Private</Text>}
                          <Text size="1" color="gray">Updated {new Date(repo.updated_at).toLocaleDateString()}</Text>
                        </Flex>
                      </Flex>
                    ))}
                  </Flex>
                </Box>
              )}
            </Flex>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box p="6" style={{ backgroundColor: 'var(--gray-1)', minHeight: '100vh' }}>
      <Box className='absolute top-8 left-8'>
        <img src='/logo.svg' alt='Logo' className='h-12 w-auto' />
      </Box>
      <Box maxWidth="600px" mx="auto" mt="6" p="6" style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-3)', boxShadow: 'var(--shadow-3)' }}>
        <Flex justify="between" align="center" mb="4">
          <Heading size="5" weight="bold">GitHub Configuration</Heading>
          <Button variant="ghost" color="gray" onClick={() => navigate(-1)}>
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
            </svg>
          </Button>
        </Flex>

        <Text size="2" color="gray" as="p" mb="6">
          Configure your GitHub credentials to enable auto-remediation.
        </Text>

        {error && (
          <Callout.Root color="tomato" mb="4">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        {existingIssues.length > 0 && (
          <Callout.Root color="blue" mb="4">
            <Callout.Text>
              <strong>Ready to apply fixes!</strong><br />
              Found {existingIssues.length} issues from your analysis of <strong>{websiteUrl}</strong>. After connecting to GitHub, we'll automatically apply AI-generated fixes to your repository.
            </Callout.Text>
          </Callout.Root>
        )}

        {existingIssues.length === 0 && (
          <Callout.Root color="amber" mb="4">
            <Callout.Text>
              <strong>No website analysis found</strong><br />
              You can either analyze a website first, or we can analyze HTML files directly from your repository after connecting.
            </Callout.Text>
          </Callout.Root>
        )}

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="4">
            <Box>
              <Text as="label" htmlFor="githubToken" size="2" weight="medium" mb="1" style={{ display: 'block' }}>
                GitHub Personal Access Token
              </Text>
              <TextField.Root
                id="githubToken"
                name="githubToken"
                type="password"
                placeholder="ghp_..."
                value={formData.githubToken}
                onChange={handleChange}
                required
              />
            </Box>

            <Box>
              <Text as="label" htmlFor="owner" size="2" weight="medium" mb="1" style={{ display: 'block' }}>
                Repository Owner
              </Text>
              <TextField.Root
                id="owner"
                name="owner"
                placeholder="e.g., username or organization"
                value={formData.owner}
                onChange={handleChange}
                required
              />
            </Box>

            <Box>
              <Text as="label" htmlFor="repo" size="2" weight="medium" mb="1" style={{ display: 'block' }}>
                Repository Name
              </Text>
              <TextField.Root
                id="repo"
                name="repo"
                placeholder="e.g., my-project"
                value={formData.repo}
                onChange={handleChange}
                required
              />
            </Box>

            <Flex justify="end" mt="4">
              <Button type="submit" color="teal" variant="solid" disabled={loading || applyingFixes}>
                {(loading || applyingFixes) && <Spinner size="2" />}
                {applyingFixes ? 'Applying fixes...' : loading ? 'Connecting...' : 'Connect Repository'}
              </Button>
            </Flex>
          </Flex>
        </form>
      </Box>
    </Box>
  );
}

export default GitHubConfig;
