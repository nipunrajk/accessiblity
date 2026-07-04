import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getFixSuggestions } from "../services/aiFix";
import { isAIAvailable } from "../config/aiConfig";
import { STORAGE_KEYS } from "../constants";
import jsPDF from "jspdf";
import IssueScreenshot from "../components/IssueScreenshot";
import BeforeAfterComparison from "../components/BeforeAfterComparison";
import ErrorState from "../components/ErrorState";
import logger from "../utils/logger";
import { Box, Flex, Heading, Text, Badge, Card, Button, Dialog, Callout, Spinner } from '@radix-ui/themes';
import { CopyIcon } from '@radix-ui/react-icons';

// Error codes the backend returns in { error: "<CODE>" } on non-200 responses.
// These indicate a configuration problem that the user must fix before retrying.
const PERMANENT_ERROR_CODES = ["AI_KEY_NOT_CONFIGURED", "INVALID_TOKEN"];
const GITHUB_PERMANENT_CODES = ["INVALID_TOKEN", "REPO_NOT_FOUND"];

function AIFix() {
  const location = useLocation();
  const navigate = useNavigate();
  // Get data from location.state or fallback to localStorage
  const getInitialData = () => {
    if (location.state) {
      return location.state;
    }

    // Fallback to localStorage if no state passed
    try {
      const savedResults = localStorage.getItem(STORAGE_KEYS.ANALYSIS_RESULTS);
      const savedAiFixes = localStorage.getItem(STORAGE_KEYS.AI_FIXES);
      const savedScanStats = localStorage.getItem(STORAGE_KEYS.SCAN_STATS);
      const savedScannedElements = localStorage.getItem(
        STORAGE_KEYS.SCANNED_ELEMENTS,
      );
      const savedElementIssues = localStorage.getItem(
        STORAGE_KEYS.ELEMENT_ISSUES,
      );
      const savedWebsiteUrl = localStorage.getItem(STORAGE_KEYS.WEBSITE_URL);

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

      return {
        issues: allIssues,
        websiteUrl: savedWebsiteUrl || "",
        scanStats: savedScanStats
          ? JSON.parse(savedScanStats)
          : { pagesScanned: 0, totalPages: 0, scannedUrls: [] },
        scannedElements: savedScannedElements
          ? JSON.parse(savedScannedElements)
          : [],
        cachedAiFixes: savedAiFixes ? JSON.parse(savedAiFixes) : null,
      };
    } catch (error) {
      console.error("Error loading data from localStorage:", error);
      return {
        issues: [],
        websiteUrl: "",
        scanStats: { pagesScanned: 0, totalPages: 0, scannedUrls: [] },
        scannedElements: [],
        cachedAiFixes: null,
      };
    }
  };

  const { issues, websiteUrl, scanStats, scannedElements, cachedAiFixes } =
    getInitialData();

  const hasAIAvailable = isAIAvailable();

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [fixSuggestions, setFixSuggestions] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  // Call 5: error message + whether it is a permanent or transient failure.
  const [error, setError] = useState(null);
  const [errorType, setErrorType] = useState(null); // 'permanent' | 'transient' | null
  // Call 5: tracks whether the user has ever triggered a regenerate so we can
  // distinguish "not yet generated" from "generated but got no results".
  const [hasAttemptedRegenerate, setHasAttemptedRegenerate] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [githubDetails, setGithubDetails] = useState({
    token: "",
    owner: "",
    repo: "",
  });
  const [currentSuggestion, setCurrentSuggestion] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  // Call 6: separate error state kept inside the GitHub modal so it stays open.
  const [modalError, setModalError] = useState(null);
  const [screenshotStates, setScreenshotStates] = useState({});
  const [comparisonStates, setComparisonStates] = useState({});

  // Step 1: Use cached AI fixes (no duplicate API calls)
  useEffect(() => {
    if (!hasAIAvailable) {
      return; // Skip AI suggestions if not available
    }

    // Use cached AI fixes if available
    if (cachedAiFixes) {
      logger.success("Using cached AI fixes", {
        issueCount: Object.keys(cachedAiFixes).length,
      });
      setFixSuggestions(cachedAiFixes);
      setSuccessMessage("Using cached AI analysis results");
      setTimeout(() => setSuccessMessage(""), 3000);
    } else {
      logger.debug("No cached AI fixes available");
    }
  }, [hasAIAvailable, cachedAiFixes]);

  // Call 5 — manual regenerate with permanent/transient error classification.
  const handleRegenerateFixes = async () => {
    if (!hasAIAvailable) {
      setError(
        "AI is not configured. Add your API key in settings to enable fix generation.",
      );
      setErrorType("permanent");
      return;
    }

    try {
      setError(null);
      setErrorType(null);
      setLoadingStates((prev) => ({ ...prev, suggestions: true }));
      logger.info("Regenerating AI fixes", { issueCount: issues.length });

      const suggestions = await getFixSuggestions(issues);
      setFixSuggestions(suggestions);
      setHasAttemptedRegenerate(true);
      setSuccessMessage("Generated fresh AI recommendations");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      logger.error("Failed to regenerate AI fixes", err);

      if (PERMANENT_ERROR_CODES.includes(err.code)) {
        // Permanent: configuration error, no point retrying until user acts.
        setError(
          err.code === "AI_KEY_NOT_CONFIGURED"
            ? "AI provider is not configured. Add your API key in settings to enable fix generation."
            : "Invalid credentials. Update your API key in settings.",
        );
        setErrorType("permanent");
      } else if (!err.status) {
        // No HTTP status → fetch itself failed (offline / DNS / CORS).
        setError("Couldn't reach the server — check your connection.");
        setErrorType("transient");
      } else {
        // 500, 503, or any other server-side failure → worth retrying.
        setError("The server encountered an error. Please try again.");
        setErrorType("transient");
      }
    } finally {
      setLoadingStates((prev) => ({ ...prev, suggestions: false }));
    }
  };

  // Group issues by DOM element
  const groupedIssues = issues.reduce((acc, issue) => {
    const selectors = [];
    if (issue.selector) selectors.push(issue.selector);
    if (issue.recommendations) {
      issue.recommendations.forEach((rec) => {
        if (rec.selector && !selectors.includes(rec.selector)) {
          selectors.push(rec.selector);
        }
      });
    }

    selectors.forEach((selector) => {
      if (!acc[selector]) {
        acc[selector] = [];
      }
      acc[selector].push(issue);
    });
    return acc;
  }, {});

  const getTypeColor = (type) => {
    switch (type) {
      case "performance":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "accessibility":
        return "bg-green-100 text-green-800 border-green-200";
      case "best-practices":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "seo":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    let yPos = 20;

    // Add title
    doc.setFontSize(16);
    doc.text("Website Analysis Report", 20, yPos);
    yPos += 20;

    // Add scan statistics
    doc.setFontSize(12);
    doc.text(`Website URL: ${websiteUrl}`, 20, yPos);
    yPos += 10;
    doc.text(`Pages Scanned: ${scanStats.pagesScanned}`, 20, yPos);
    yPos += 10;
    doc.text(`Total Issues Found: ${issues.length}`, 20, yPos);
    yPos += 20;

    // Add issues and fixes
    doc.setFontSize(14);
    doc.text("Issues and AI Fixes:", 20, yPos);
    yPos += 10;

    issues.forEach((issue, index) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      // Use title or description if available, fallback to a default message
      const issueTitle =
        issue.title || issue.description || "Issue details not available";
      doc.text(`${index + 1}. Issue: ${issueTitle}`, 20, yPos);
      yPos += 10;

      // Add issue type and impact if available
      if (issue.type || issue.impact) {
        doc.setFontSize(10);
        const typeText = issue.type ? `Type: ${issue.type}` : "";
        const impactText = issue.impact
          ? `Impact: ${Math.round(issue.impact)}%`
          : "";
        const infoText = [typeText, impactText].filter(Boolean).join(" | ");
        if (infoText) {
          doc.text(infoText, 30, yPos);
          yPos += 10;
        }
      }

      // Add fix suggestions
      if (fixSuggestions[issue.title]) {
        const suggestion = fixSuggestions[issue.title];
        doc.setFontSize(10);
        const suggestionText =
          typeof suggestion === "string"
            ? suggestion
            : Array.isArray(suggestion)
              ? suggestion[0]?.description || "Fix suggestion available"
              : suggestion.description || "Fix suggestion available";
        doc.text(`AI Fix Suggestion: ${suggestionText}`, 30, yPos);
        yPos += 10;
      }

      // Add some spacing between issues
      yPos += 5;
    });

    // Save the PDF
    doc.save("website-analysis-report.pdf");
  };

  const handleApplyFix = (suggestion) => {
    setCurrentSuggestion(suggestion);
    setModalError(null);
    setShowModal(true);
  };

  // Call 6 — submit GitHub fix. Reads response body on non-200, surfaces
  // data.success === false, and keeps the modal open on any error.
  const handleSubmitGithubDetails = async () => {
    if (!currentSuggestion) {
      setModalError("No suggestion selected");
      return;
    }

    try {
      setModalError(null);
      setLoadingStates((prev) => ({ ...prev, submitting: true }));

      // Find the current issue and get all its suggestions
      const currentIssue = issues.find((issue) =>
        fixSuggestions[issue.title]?.includes(currentSuggestion),
      );
      const allSuggestionsForIssue = currentIssue
        ? fixSuggestions[currentIssue.title]
        : [];

      // Get all descriptions from the suggestions and join them with commas
      const suggestionsString = allSuggestionsForIssue
        .map((sug) => sug.description)
        .join(", ");

      const response = await fetch("/api/repo/ai-optimize-specific", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          githubToken: githubDetails.token,
          owner: githubDetails.owner,
          repo: githubDetails.repo,
          suggestion: suggestionsString,
        }),
      });

      // Always parse the body — we need it for both success data and error messages.
      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error("Server returned an unreadable response.");
      }

      if (!response.ok) {
        const code = data?.error;
        if (GITHUB_PERMANENT_CODES.includes(code)) {
          throw new Error(
            code === "INVALID_TOKEN"
              ? "GitHub token is invalid or expired. Update your token and try again."
              : `Repository not found. Check that "${githubDetails.owner}/${githubDetails.repo}" exists and your token has access.`,
          );
        }
        // Surface the actual backend message instead of the generic fallback.
        throw new Error(
          data?.message ||
            data?.error ||
            `Request failed (${response.status}).`,
        );
      }

      // Call 6 — handle logical failure: response was 200 but success is false.
      if (!data.success) {
        throw new Error(
          data.message ||
            data.error ||
            "The fix could not be applied. Check your repository settings and try again.",
        );
      }

      setSuccessMessage("Fix applied successfully!");

      // Open PR URL in a new tab if available
      if (data.data?.pullRequest?.url) {
        window.open(data.data.pullRequest.url, "_blank").focus();
      }

      // Only close modal on genuine success
      setShowModal(false);
      setCurrentSuggestion(null);
    } catch (err) {
      // Keep modal open and show error inside it — do not call setShowModal(false).
      setModalError(err.message);
    } finally {
      setLoadingStates((prev) => ({ ...prev, submitting: false }));
    }
  };

  // Add this function near your other utility functions
  const getUniqueIssues = (issues) => {
    const uniqueIssues = new Map();

    issues.forEach((issue) => {
      const key = `${issue.type}-${issue.title}`; // Create unique key using type and title
      if (!uniqueIssues.has(key)) {
        uniqueIssues.set(key, issue);
      }
    });

    return Array.from(uniqueIssues.values());
  };

  return (
    <Box p="6" style={{ backgroundColor: 'var(--gray-1)', minHeight: '100vh' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header with back button */}
        <Flex justify="between" align="center" mb="4">
          <Flex align="center" gap="4">
            <button
              onClick={() => navigate("/analyzer")}
              className="p-2 rounded-lg"
            >
              <svg
                className="w-6 h-6 text-gray-800"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <div>
              <Heading size="6" weight="bold">AI Remediation</Heading>
              <Text color="gray" as="p" size="2">
                {hasAIAvailable
                  ? `AI analysis and fixes for ${websiteUrl || "website"}`
                  : `Manual review required for ${websiteUrl || "website"}`}
              </Text>
              {cachedAiFixes && (
                <Text size="1" color="jade" as="p" mt="1">
                  ✅ Using cached analysis results
                </Text>
              )}
            </div>
          </Flex>

          <Flex gap="4" align="center">
            <Badge color="teal" variant="surface">
              {loadingStates.submitting ? "Applying" : successMessage ? "Applied" : "Pending Review"}
            </Badge>
            {hasAIAvailable && (
              <Button
                color="blue"
                variant="solid"
                disabled={loadingStates.suggestions}
                onClick={handleRegenerateFixes}
              >
                {loadingStates.suggestions ? (
                  <>
                    <Spinner size="2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-1"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Regenerate Fixes
                  </>
                )}
              </Button>
            )}
            <Button color="gray" variant="solid" onClick={generatePDF}>
              Download Report
            </Button>
          </Flex>
        </Flex>

        {/* GitHub Details Modal */}
        <Dialog.Root open={showModal} onOpenChange={(open) => {
          setShowModal(open);
          if (!open) setModalError(null);
        }}>
          <Dialog.Content maxWidth="450px">
            <Dialog.Title>Confirm Pull Request</Dialog.Title>
            <Dialog.Description size="2">
              This will create a new branch and open a PR against {githubDetails.repo || "your repository"}. Are you sure?
            </Dialog.Description>
            <Flex direction="column" gap="3" mt="4">
              <label>
                <Text as="div" size="2" mb="1" weight="bold">GitHub Token</Text>
                <input
                  type="password"
                  value={githubDetails.token}
                  onChange={(e) => setGithubDetails({ ...githubDetails, token: e.target.value })}
                  className="w-full p-2 border rounded-sm"
                  placeholder="Enter GitHub token"
                />
              </label>
              <label>
                <Text as="div" size="2" mb="1" weight="bold">Repository Owner</Text>
                <input
                  type="text"
                  value={githubDetails.owner}
                  onChange={(e) => setGithubDetails({ ...githubDetails, owner: e.target.value })}
                  className="w-full p-2 border rounded-sm"
                  placeholder="Enter repository owner"
                />
              </label>
              <label>
                <Text as="div" size="2" mb="1" weight="bold">Repository Name</Text>
                <input
                  type="text"
                  value={githubDetails.repo}
                  onChange={(e) => setGithubDetails({ ...githubDetails, repo: e.target.value })}
                  className="w-full p-2 border rounded-sm"
                  placeholder="Enter repository name"
                />
              </label>

              {modalError && (
                <Callout.Root color="tomato" mt="2">
                  <Callout.Text>{modalError}</Callout.Text>
                </Callout.Root>
              )}
            </Flex>
            <Flex gap="3" justify="end" mt="4">
              <Dialog.Close>
                <Button variant="surface" color="gray">Cancel</Button>
              </Dialog.Close>
              <Button color="teal" variant="solid" onClick={handleSubmitGithubDetails} disabled={loadingStates.submitting}>
                {loadingStates.submitting && <Spinner size="2" />}
                Create PR
              </Button>
            </Flex>
          </Dialog.Content>
        </Dialog.Root>

        {/* Call 5 — page-level error with retry or settings link based on error type */}
        {error && (
          <Box mb="6">
            <ErrorState
              message={error}
              onRetry={
                errorType === "transient" ? handleRegenerateFixes : undefined
              }
              settingsLink={
                errorType === "permanent" ? "/github-config" : undefined
              }
            />
          </Box>
        )}

        {successMessage && (
          <Box mb="6">
            <Callout.Root color="jade">
              <Callout.Text>{successMessage}</Callout.Text>
            </Callout.Root>
          </Box>
        )}

        {loadingStates.suggestions && (
          <Box mb="6">
            <Callout.Root color="blue">
              <Flex gap="3" align="center">
                <Spinner size="2" />
                <Callout.Text>Analyzing issues and generating fix suggestions...</Callout.Text>
              </Flex>
            </Callout.Root>
          </Box>
        )}

        {/* Call 5 — empty result: distinguish "not yet tried" from "tried and got nothing" */}
        {hasAIAvailable &&
          !error &&
          !loadingStates.suggestions &&
          Object.keys(fixSuggestions).length === 0 && (
            <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-sm">
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  {hasAttemptedRegenerate ? (
                    <>
                      <p className="text-yellow-700 font-medium">
                        No fix suggestions found
                      </p>
                      <p className="text-yellow-600 text-sm">
                        AI analysis ran successfully but returned no suggestions
                        for these issues.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-yellow-700 font-medium">
                        No AI fixes available yet
                      </p>
                      <p className="text-yellow-600 text-sm">
                        Click "Regenerate Fixes" to generate AI-powered
                        suggestions for these issues.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            {/* Scan Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Scan Statistics
              </h2>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-600">Pages Scanned:</span>
                  <span className="text-black font-medium ml-2">
                    {scanStats?.pagesScanned || 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Elements with Issues:</span>
                  <span className="text-black font-medium ml-2">
                    {Object.keys(groupedIssues).length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Total Issues:</span>
                  <span className="text-black font-medium ml-2">
                    {issues.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Category Filter */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Filter by Category
              </h2>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors text-left focus:outline-hidden ${
                    selectedCategory === "all"
                      ? "bg-gray-800 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  All Categories
                </button>
                {["performance", "accessibility", "seo"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedCategory(type)}
                    className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors text-left focus:outline-hidden ${
                      selectedCategory === type
                        ? "bg-gray-800 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats Summary */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Issue Summary
              </h2>
              <div className="space-y-3">
                {["performance", "accessibility", "seo", "best-practices"].map(
                  (category) => {
                    const uniqueIssues = getUniqueIssues(issues);
                    const count = uniqueIssues.filter(
                      (issue) => issue.type === category,
                    ).length;

                    return (
                      <div
                        key={category}
                        className={`p-3 rounded-lg ${getTypeColor(category)}`}
                      >
                        <div className="text-lg font-bold">{count}</div>
                        <div className="text-sm">
                          {category.charAt(0).toUpperCase() + category.slice(1)}{" "}
                          Issues
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="col-span-12 lg:col-span-9 space-y-6">
            {/* Original Issues Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                DOM Elements with Issues
              </h2>

              {/* Elements List */}
              <div className="space-y-6">
                {/* Meta Description Section */}
                {scannedElements.filter(
                  (element) =>
                    element.tag === "meta" &&
                    element.attributes.find(
                      (attr) =>
                        attr.name === "name" && attr.value === "description",
                    ),
                ).length === 0 && (
                  <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                    {/* Element Header */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          Missing Meta Description
                        </h3>
                        <div className="flex gap-2">
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 border-orange-200">
                            SEO
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm">
                        Your page is missing a meta description tag which is
                        important for SEO.
                      </p>
                    </div>

                    {/* Meta Description Fix */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-2">
                        Suggested Fix:
                      </h4>
                      <code className="block text-black text-sm font-mono bg-gray-100 p-3 rounded-sm">
                        {
                          '<meta name="description" content="Add your website description here">'
                        }
                      </code>
                      <p className="mt-2 text-sm text-gray-600">
                        Add this tag inside your {"<head>"} section with a
                        descriptive content that summarizes your page.
                      </p>
                    </div>
                  </div>
                )}

                {/* Missing Alt Attributes Section */}
                {scannedElements.filter(
                  (element) =>
                    element.tag === "img" &&
                    (!element.attributes.find((attr) => attr.name === "alt") ||
                      element.attributes.find(
                        (attr) => attr.name === "alt" && attr.value === "",
                      )),
                ).length > 0 && (
                  <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                    {/* Element Header */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          Images Missing Alt Attributes
                        </h3>
                        <div className="flex gap-2">
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border-green-200">
                            Accessibility
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Images List */}
                    <div className="space-y-4">
                      {scannedElements
                        .filter(
                          (element) =>
                            element.tag === "img" &&
                            (!element.attributes.find(
                              (attr) => attr.name === "alt",
                            ) ||
                              element.attributes.find(
                                (attr) =>
                                  attr.name === "alt" && attr.value === "",
                              )),
                        )
                        .map((element, index) => (
                          <div
                            key={index}
                            className="border-t border-gray-100 pt-4"
                          >
                            <code className="block text-black text-sm font-mono bg-gray-100 p-3 rounded-sm">
                              {`<img ${element.attributes
                                .map((attr) => `${attr.name}="${attr.value}"`)
                                .join(" ")}>`}
                            </code>
                            <div className="mt-2 text-sm text-gray-600">
                              Found at: {element.location || "Unknown location"}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* All Issues with AI Fixes */}
                {hasAIAvailable && Object.keys(fixSuggestions).length > 0 && (
                  <div className="bg-white rounded-lg shadow-xs border border-gray-200 p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                      🤖 AI-Generated Fixes
                    </h2>
                    <div className="space-y-6">
                      {Object.entries(fixSuggestions).map(
                        ([issueTitle, suggestions]) => (
                          <div
                            key={issueTitle}
                            className="border-b border-gray-100 pb-6 last:border-b-0"
                          >
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                              {issueTitle}
                            </h3>

                            {/* Find the original issue for context */}
                            {(() => {
                              const originalIssue = issues.find(
                                (issue) => issue.title === issueTitle,
                              );
                              return originalIssue ? (
                                <div className="mb-4">
                                  <p className="text-gray-600 mb-2">
                                    {originalIssue.description}
                                  </p>
                                  {originalIssue.type && (
                                    <span
                                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                        originalIssue.type === "performance"
                                          ? "bg-blue-100 text-blue-800"
                                          : originalIssue.type ===
                                              "accessibility"
                                            ? "bg-green-100 text-green-800"
                                            : originalIssue.type === "seo"
                                              ? "bg-purple-100 text-purple-800"
                                              : "bg-gray-100 text-gray-800"
                                      }`}
                                    >
                                      {originalIssue.type}
                                    </span>
                                  )}
                                </div>
                              ) : null;
                            })()}

                            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                              <h4 className="font-medium text-gray-800 flex items-center gap-2">
                                <svg
                                  className="w-5 h-5 text-blue-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                  />
                                </svg>
                                AI Recommendations ({suggestions.length})
                              </h4>

                              {suggestions.map((suggestion, sugIndex) => {
                                const suggestionKey = `${issueTitle}-${sugIndex}`;
                                const showScreenshot =
                                  screenshotStates[suggestionKey] || false;
                                const showComparison =
                                  comparisonStates[suggestionKey] || false;

                                return (
                                  <Card key={sugIndex} variant="surface" size="2" mb="4">
                                    <Flex direction="column" gap="2">
                                      <Heading size="3" weight="medium" color={originalIssue?.type === 'accessibility' ? 'tomato' : 'amber'}>
                                        {suggestion.description}
                                      </Heading>
                                      {suggestion.implementation && (
                                        <Text size="2" color="gray">
                                          {suggestion.implementation}
                                        </Text>
                                      )}

                                      {/* Action Buttons */}
                                      <Flex wrap="wrap" gap="2" mt="2">
                                        <Button
                                          variant="surface"
                                          color="gray"
                                          size="1"
                                          onClick={() =>
                                            setScreenshotStates((prev) => ({
                                              ...prev,
                                              [suggestionKey]: !showScreenshot,
                                            }))
                                          }
                                        >
                                          {showScreenshot ? "Hide Screenshot" : "Show Screenshot"}
                                        </Button>

                                        <Button
                                          variant="surface"
                                          color="blue"
                                          size="1"
                                          onClick={() =>
                                            setComparisonStates((prev) => ({
                                              ...prev,
                                              [suggestionKey]: !showComparison,
                                            }))
                                          }
                                        >
                                          {showComparison ? "Hide Comparison" : "Before/After"}
                                        </Button>

                                        <Button
                                          color="teal"
                                          variant="solid"
                                          size="1"
                                          onClick={() => handleApplyFix(suggestion)}
                                          disabled={loadingStates.submitting}
                                        >
                                          {loadingStates.submitting && currentSuggestion === suggestion ? <Spinner size="2" /> : null}
                                          Apply Fix to GitHub
                                        </Button>
                                      </Flex>

                                      {(suggestion.code || suggestion.codeExample) && (
                                        <Box mt="2" position="relative">
                                          <Text size="2" weight="bold" mb="1" as="div">Code Example:</Text>
                                          <Box p="3" style={{ background: 'var(--gray-3)', borderRadius: 'var(--radius-2)', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'pre-wrap' }}>
                                            {suggestion.code || suggestion.codeExample}
                                          </Box>
                                          <Box position="absolute" top="6" right="2">
                                            <Button variant="ghost" size="1" color="gray" onClick={() => navigator.clipboard.writeText(suggestion.code || suggestion.codeExample)}>
                                              <CopyIcon />
                                            </Button>
                                          </Box>
                                        </Box>
                                      )}

                                      {(suggestion.impact || suggestion.expectedImpact) && (
                                        <Text size="2" color="jade" mt="2">
                                          <strong>Expected Impact:</strong> {suggestion.impact || suggestion.expectedImpact}
                                        </Text>
                                      )}

                                    {/* Screenshot Section */}
                                    {showScreenshot && (
                                      <div className="mt-4 pt-4 border-t border-gray-200">
                                        <IssueScreenshot
                                          issue={{
                                            title: issueTitle,
                                            type:
                                              issues.find(
                                                (i) => i.title === issueTitle,
                                              )?.type || "accessibility",
                                            selector: issues.find(
                                              (i) => i.title === issueTitle,
                                            )?.selector,
                                          }}
                                          websiteUrl={websiteUrl}
                                          className="max-w-2xl mx-auto"
                                        />
                                      </div>
                                    )}

                                    {/* Before/After Comparison Section */}
                                    {showComparison && (
                                      <div className="mt-4 pt-4 border-t border-gray-200">
                                        <BeforeAfterComparison
                                          title={`Fix: ${issueTitle}`}
                                          className="max-w-2xl mx-auto"
                                        />
                                      </div>
                                    )}
                                    </Flex>
                                  </Card>
                                );
                              })}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {/* Original Elements with Issues */}
                {Object.keys(groupedIssues)
                  .filter((selector) =>
                    selectedCategory === "all"
                      ? true
                      : groupedIssues[selector].some(
                          (issue) => issue.type === selectedCategory,
                        ),
                  )
                  .map((selector, index) => {
                    const elementIssues = groupedIssues[selector].filter(
                      (issue) =>
                        selectedCategory === "all" ||
                        issue.type === selectedCategory,
                    );

                    return (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                      >
                        {/* Element Header */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <code className="text-black bg-gray-100 px-3 py-1.5 rounded-lg text-sm font-mono whitespace-pre">
                              {(() => {
                                const parts = selector
                                  .split(" > ")
                                  .map((part) => {
                                    // Split by both . and # but keep the delimiters
                                    const segments = part.split(/([.#[])/);
                                    const tag = segments[0];

                                    // Process segments to collect classes, ids, and other attributes
                                    let classes = [];
                                    let id = null;
                                    let otherAttributes = {};

                                    for (
                                      let i = 1;
                                      i < segments.length;
                                      i += 2
                                    ) {
                                      const delimiter = segments[i];
                                      const value = segments[i + 1];

                                      if (delimiter === ".") {
                                        classes.push(value);
                                      } else if (delimiter === "#") {
                                        id = value;
                                      } else if (delimiter === "[") {
                                        // Handle attribute selectors [attr="value"]
                                        const attrMatch = value.match(
                                          /([^=\]]+)(?:="([^"]*)")?\]/,
                                        );
                                        if (attrMatch) {
                                          const [, attrName, attrValue] =
                                            attrMatch;
                                          otherAttributes[attrName] =
                                            attrValue || "";
                                        }
                                      }
                                    }

                                    // Get element's actual attributes from the issues
                                    const elementIssue = elementIssues.find(
                                      (issue) =>
                                        issue.element?.attributes?.some(
                                          (attr) =>
                                            (attr.name === "class" &&
                                              attr.value ===
                                                classes.join(" ")) ||
                                            (attr.name === "id" &&
                                              attr.value === id),
                                        ),
                                    );

                                    if (elementIssue?.element?.attributes) {
                                      elementIssue.element.attributes.forEach(
                                        (attr) => {
                                          if (
                                            attr.name !== "class" &&
                                            attr.name !== "id"
                                          ) {
                                            otherAttributes[attr.name] =
                                              attr.value;
                                          }
                                        },
                                      );
                                    }

                                    return {
                                      tag,
                                      classes: classes.length
                                        ? classes.join(" ")
                                        : null,
                                      id,
                                      attributes: otherAttributes,
                                    };
                                  });

                                let output = "";
                                // Add opening tags with indentation
                                parts.forEach((part, index) => {
                                  const indent = " ".repeat(index * 2);
                                  const attrs = [];

                                  if (part.id) attrs.push(`id="${part.id}"`);
                                  if (part.classes)
                                    attrs.push(`class="${part.classes}"`);

                                  // Add other attributes
                                  Object.entries(part.attributes || {}).forEach(
                                    ([key, value]) => {
                                      attrs.push(`${key}="${value}"`);
                                    },
                                  );

                                  const attributes = attrs.length
                                    ? " " + attrs.join(" ")
                                    : "";
                                  output += `${indent}<${part.tag}${attributes}>\n`;
                                });

                                // Add closing tags with proper indentation
                                [...parts].reverse().forEach((part, index) => {
                                  const indent = " ".repeat(
                                    (parts.length - 1 - index) * 2,
                                  );
                                  output += `${indent}</${part.tag}>\n`;
                                });

                                return output.trim();
                              })()}
                            </code>
                            <div className="flex gap-2">
                              {Array.from(
                                new Set(
                                  elementIssues.map((issue) => issue.type),
                                ),
                              ).map((type) => (
                                <span
                                  key={type}
                                  className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(
                                    type,
                                  )}`}
                                >
                                  {type.charAt(0).toUpperCase() + type.slice(1)}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Issues for this element */}
                        <div className="space-y-4">
                          {elementIssues.map((issue, issueIndex) => {
                            const suggestions =
                              fixSuggestions[issue.title] || [];

                            return (
                              <div
                                key={issueIndex}
                                className="border-t border-gray-100 pt-4"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <h3 className="text-lg font-semibold text-gray-800">
                                    {issue.title}
                                  </h3>
                                  <div className="flex items-center gap-2">
                                    {issue.impact && (
                                      <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                                        Impact: {Math.round(issue.impact)}%
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <p className="text-gray-600 mb-3">
                                  {issue.description}
                                </p>

                                {/* Fix Suggestions */}
                                {hasAIAvailable ? (
                                  suggestions.length > 0 ? (
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-3 mt-4">
                                      <div className="flex items-center justify-between">
                                        <h4 className="font-medium text-gray-800">
                                          AI Fix Suggestions:
                                        </h4>
                                        <button
                                          onClick={() =>
                                            handleApplyFix(suggestions[0])
                                          }
                                          className="bg-green-600 text-white px-3 py-1 rounded-sm hover:bg-green-700 text-sm"
                                        >
                                          Apply Fix
                                        </button>
                                      </div>
                                      {suggestions.map(
                                        (suggestion, sugIndex) => (
                                          <Card key={sugIndex} variant="surface" size="2" mb="3">
                                            <Flex direction="column" gap="2">
                                              <Heading size="3" weight="medium" color={issue.impact > 50 ? 'tomato' : 'amber'}>
                                                {suggestion.description}
                                              </Heading>
                                              
                                              {(suggestion.code || suggestion.codeExample) && (
                                                <Box mt="2" position="relative">
                                                  <Text size="2" weight="bold" mb="1" as="div">Code Example:</Text>
                                                  <Box p="3" style={{ background: 'var(--gray-3)', borderRadius: 'var(--radius-2)', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'pre-wrap' }}>
                                                    {suggestion.code || suggestion.codeExample}
                                                  </Box>
                                                  <Box position="absolute" top="6" right="2">
                                                    <Button variant="ghost" size="1" color="gray" onClick={() => navigator.clipboard.writeText(suggestion.code || suggestion.codeExample)}>
                                                      <CopyIcon />
                                                    </Button>
                                                  </Box>
                                                </Box>
                                              )}

                                              {suggestion.impact && (
                                                <Text size="2" color="jade">
                                                  Expected Impact: {suggestion.impact}
                                                </Text>
                                              )}
                                              <Flex gap="2" mt="2">
                                                <Button color="teal" variant="solid" onClick={() => handleApplyFix(suggestion)} disabled={loadingStates.submitting}>
                                                  {loadingStates.submitting && currentSuggestion === suggestion ? <Spinner size="2" /> : null}
                                                  Apply Fix to GitHub
                                                </Button>
                                              </Flex>
                                            </Flex>
                                          </Card>
                                        ),
                                      )}
                                    </div>
                                  ) : (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                                      <div className="flex items-center gap-3">
                                        <svg
                                          className="w-5 h-5 text-blue-600"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                          />
                                        </svg>
                                        <div>
                                          <h4 className="font-medium text-blue-900">
                                            AI Suggestions Loading...
                                          </h4>
                                          <p className="text-sm text-blue-700">
                                            Configure AI in development mode to
                                            get automated fix suggestions
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                ) : (
                                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
                                    <div className="flex items-center gap-3">
                                      <svg
                                        className="w-5 h-5 text-gray-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                      </svg>
                                      <div>
                                        <h4 className="font-medium text-gray-900">
                                          Manual Fix Required
                                        </h4>
                                        <p className="text-sm text-gray-600">
                                          AI suggestions not available. Please
                                          review the issue description and
                                          implement fixes manually.
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                {Object.keys(groupedIssues).filter((selector) =>
                  selectedCategory === "all"
                    ? true
                    : groupedIssues[selector].some(
                        (issue) => issue.type === selectedCategory,
                      ),
                ).length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-600">
                      No DOM elements found with issues in the selected
                      category.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Box>
  );
}

export default AIFix;
