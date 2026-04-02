import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "../components/Header";
import { useAnalysis } from "../hooks/useAnalysis";
import LoadingState from "../components/LoadingState";
import ViolationsList from "../components/ViolationsList";
import {
  Search,
  Zap,
  TrendingUp,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Sparkles,
  Camera,
  BarChart3,
  Monitor,
  Smartphone,
  Clock,
  Download,
  Share2,
  ExternalLink,
  ZoomIn,
  Info,
  Github,
  Shield,
} from "lucide-react";

export default function Analyzer() {
  const [url, setUrl] = useState("");
  const [selectedDevice, setSelectedDevice] = useState("desktop");

  const {
    loading,
    results,
    error,
    aiAnalysis,
    aiLoading,
    websiteUrl,
    scanStats,
    runAnalysis,
    clearAnalysis,
  } = useAnalysis();

  const handleAnalyze = async () => {
    if (!url) return;
    await runAnalysis(url);
  };

  const handleNewAnalysis = () => {
    clearAnalysis();
    setUrl("");
  };

  // Transform results to match the display format
  const displayResults = results
    ? {
        url: websiteUrl || url,
        scores: {
          performance: results.performance?.score || 0,
          accessibility: results.accessibility?.score || 0,
          bestPractices: results.bestPractices?.score || 0,
          seo: results.seo?.score || 0,
        },
        aiInsights: aiAnalysis,
        issues: {
          performance: results.performance?.issues?.length || 0,
          accessibility: results.accessibility?.issues?.length || 0,
          seo: results.seo?.issues?.length || 0,
          bestPractices: results.bestPractices?.issues?.length || 0,
        },
      }
    : null;

  const getScoreColor = (score) => {
    if (score >= 90) return "text-success";
    if (score >= 50) return "text-warning";
    return "text-destructive";
  };

  const getScoreBgColor = (score) => {
    if (score >= 90) return "bg-success/10 border-success/20";
    if (score >= 50) return "bg-warning/10 border-warning/20";
    return "bg-destructive/10 border-destructive/20";
  };

  const formatMs = (ms) => {
    if (ms == null) return "N/A";
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getMetricStatus = (score) => {
    if (score == null) return "average";
    if (score >= 90) return "good";
    if (score >= 50) return "average";
    return "poor";
  };

  // Mirror of backend extractWCAGLevel from transformers.js
  const getWCAGLevelFromTags = (tags) => {
    if (!tags?.length) return "Unknown";
    if (tags.some((t) => t.includes("wcag2aaa") || t.includes("wcag21aaa")))
      return "AAA";
    if (tags.some((t) => t.includes("wcag2aa") || t.includes("wcag21aa")))
      return "AA";
    if (tags.some((t) => t === "wcag2a" || t === "wcag21a")) return "A";
    return "Unknown";
  };

  const countPassesByLevel = (passes, level) => {
    if (!passes?.length) return 0;
    return passes.filter((p) => getWCAGLevelFromTags(p.tags) === level).length;
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <LoadingState scanStats={scanStats} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Error State */}
        {error && (
          <div className="max-w-3xl mx-auto mb-6">
            <div className="bg-destructive/10 border-2 border-destructive/20 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <XCircle className="w-6 h-6 text-destructive" />
                <div>
                  <h3 className="font-semibold text-destructive">
                    Analysis Error
                  </h3>
                  <p className="text-sm text-foreground">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        {!displayResults ? (
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Zap className="h-9 w-9 text-primary" />
              </div>
              <h1 className="mb-3 text-4xl font-bold text-balance">
                AI-Powered Website Analysis
              </h1>
              <p className="text-lg text-muted-foreground text-balance">
                Get instant insights on accessibility, performance, SEO, and
                best practices with automated fix suggestions
              </p>
            </div>

            <div className="border-2 rounded-xl bg-card p-6 shadow-sm">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="url"
                    placeholder="Enter website URL (e.g., https://example.com)"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                    className="h-12 w-full pl-10 text-base bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <button
                  onClick={handleAnalyze}
                  disabled={loading || !url}
                  className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? "Analyzing..." : "Analyze"}
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
              <button
                onClick={() => setUrl("demo")}
                className="mt-3 text-sm text-primary hover:underline"
              >
                Try with sample data
              </button>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: TrendingUp,
                  label: "Performance",
                  color: "text-primary",
                },
                { icon: Eye, label: "Accessibility", color: "text-accent" },
                {
                  icon: CheckCircle2,
                  label: "Best Practices",
                  color: "text-success",
                },
                { icon: BarChart3, label: "SEO", color: "text-warning" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="text-center bg-card rounded-xl p-6 border"
                >
                  <item.icon className={`mx-auto mb-3 h-8 w-8 ${item.color}`} />
                  <h3 className="font-semibold text-foreground">
                    {item.label}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Automated analysis
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-bold text-foreground">
                    Analysis Results
                  </h2>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-mono border rounded-lg">
                    <Clock className="h-4 w-4" />
                    {scanStats?.pagesScanned || 1} page
                    {scanStats?.pagesScanned > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-base text-muted-foreground">
                  <span className="truncate max-w-md">
                    {displayResults.url}
                  </span>
                  <ExternalLink className="h-4 w-4" />
                </div>
              </div>
              <div className="flex gap-3">
                <button className="px-5 py-2.5 text-base font-medium border rounded-lg hover:bg-accent flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Share
                </button>
                <button className="px-5 py-2.5 text-base font-medium border rounded-lg hover:bg-accent flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export
                </button>
                <button
                  onClick={handleNewAnalysis}
                  className="px-5 py-2.5 text-base font-medium border rounded-lg hover:bg-accent"
                >
                  New Analysis
                </button>
                <Link
                  to="/ai-fix"
                  className="px-6 py-2.5 text-base font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2"
                >
                  View Fixes
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(displayResults.scores).map(([key, value]) => (
                <div
                  key={key}
                  className={`relative overflow-hidden border-2 rounded-xl ${getScoreBgColor(value)}`}
                >
                  <div className="p-6">
                    <div className="mb-4">
                      <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <div
                          className={`text-6xl font-bold tabular-nums ${getScoreColor(value)}`}
                        >
                          {value}
                        </div>
                        <div className="text-base font-medium text-muted-foreground">
                          /100
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${value >= 90 ? "bg-success" : value >= 50 ? "bg-warning" : "bg-destructive"}`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                  <div
                    className={`absolute top-4 right-4 h-3 w-3 rounded-full ${
                      value >= 90
                        ? "bg-success"
                        : value >= 50
                          ? "bg-warning"
                          : "bg-destructive"
                    }`}
                  />
                </div>
              ))}
            </div>

            {/* Main Content Grid - 2/3 for data, 1/3 for visuals */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left Column - Main Data */}
              <div className="space-y-6 lg:col-span-2">
                {/* AI Insights */}
                {displayResults.aiInsights && (
                  <div className="border-2 border-accent/20 bg-accent/5 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Sparkles className="h-6 w-6 text-accent" />
                      <h3 className="text-2xl font-bold">AI Insights</h3>
                    </div>
                    <p className="text-base leading-relaxed text-foreground">
                      {displayResults.aiInsights}
                    </p>
                  </div>
                )}

                {aiLoading && !displayResults.aiInsights && (
                  <div className="border-2 border-accent/20 bg-accent/5 rounded-xl p-6">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-accent border-t-transparent" />
                      <p className="text-sm text-muted-foreground">
                        Generating AI insights...
                      </p>
                    </div>
                  </div>
                )}

                {/* Issue Distribution & Performance Metrics */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="bg-card rounded-xl border p-6">
                    <h3 className="text-2xl font-bold mb-3">
                      Issue Distribution
                    </h3>
                    <p className="text-base text-muted-foreground mb-6">
                      {Object.values(displayResults.issues).reduce(
                        (a, b) => a + b,
                        0,
                      )}{" "}
                      total issues detected
                    </p>
                    <div className="space-y-4">
                      {Object.entries(displayResults.issues).map(
                        ([key, value]) => {
                          const total = Object.values(
                            displayResults.issues,
                          ).reduce((a, b) => a + b, 0);
                          const percentage =
                            total > 0 ? Math.round((value / total) * 100) : 0;
                          return (
                            <div key={key} className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium capitalize">
                                  {key.replace(/([A-Z])/g, " $1").trim()}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">
                                    {percentage}%
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 text-xs rounded ${value > 20 ? "bg-destructive/10 text-destructive" : value > 10 ? "bg-secondary" : "border"}`}
                                  >
                                    {value}
                                  </span>
                                </div>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className="bg-primary h-2 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>

                  <div className="bg-card rounded-xl border p-6">
                    <h3 className="text-2xl font-bold mb-3">
                      Performance Metrics
                    </h3>
                    <p className="text-base text-muted-foreground mb-6">
                      Key timing measurements
                    </p>
                    <div className="space-y-4">
                      {!results?.performance?.metrics
                        ? Array.from({ length: 4 }).map((_, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <div className="h-4 w-4 rounded-full bg-muted animate-pulse" />
                                <div className="h-3 w-36 rounded bg-muted animate-pulse" />
                              </div>
                              <div className="h-3 w-12 rounded bg-muted animate-pulse" />
                            </div>
                          ))
                        : [
                            {
                              label: "First Contentful Paint",
                              value: formatMs(
                                results.performance.metrics.fcp?.value,
                              ),
                              status: getMetricStatus(
                                results.performance.metrics.fcp?.score,
                              ),
                            },
                            {
                              label: "Speed Index",
                              value: formatMs(
                                results.performance.metrics.si?.value,
                              ),
                              status: getMetricStatus(
                                results.performance.metrics.si?.score,
                              ),
                            },
                            {
                              label: "Time to Interactive",
                              value: formatMs(
                                results.performance.metrics.tti?.value,
                              ),
                              status: getMetricStatus(
                                results.performance.metrics.tti?.score,
                              ),
                            },
                            {
                              label: "Total Blocking Time",
                              value: formatMs(
                                results.performance.metrics.tbt?.value,
                              ),
                              status: getMetricStatus(
                                results.performance.metrics.tbt?.score,
                              ),
                            },
                          ].map((metric) => (
                            <div
                              key={metric.label}
                              className="flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                {metric.status === "good" ? (
                                  <CheckCircle2 className="h-4 w-4 text-success" />
                                ) : (
                                  <AlertTriangle className="h-4 w-4 text-warning" />
                                )}
                                <span className="text-sm">{metric.label}</span>
                              </div>
                              <span className="font-mono text-sm font-semibold">
                                {metric.value}
                              </span>
                            </div>
                          ))}
                    </div>
                  </div>
                </div>

                {/* Accessibility Analysis */}
                <div className="bg-card rounded-xl border p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">
                        Accessibility Analysis
                      </h3>
                      <p className="text-base text-muted-foreground">
                        Comprehensive testing against Web Content Accessibility
                        Guidelines
                      </p>
                    </div>
                    <div className="flex items-center gap-6 text-base">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-destructive" />
                        <span className="font-bold text-lg">
                          {displayResults.issues.accessibility}
                        </span>
                        <span className="text-muted-foreground font-medium">
                          Violations
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success" />
                        <span className="font-bold text-lg">
                          {results?.accessibility?.audits?.passed ?? 0}
                        </span>
                        <span className="text-muted-foreground font-medium">
                          Passed
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* WCAG Compliance Levels */}
                  <div className="mb-6">
                    <h4 className="text-lg font-bold mb-4">
                      WCAG Compliance Levels
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {!results?.accessibility?.wcagCompliance
                        ? Array.from({ length: 3 }).map((_, i) => (
                            <div
                              key={i}
                              className="rounded-lg border bg-card p-4 space-y-3"
                            >
                              <div className="flex items-center gap-2 mb-3">
                                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                                <div className="space-y-1">
                                  <div className="h-3 w-16 rounded bg-muted animate-pulse" />
                                  <div className="h-2 w-24 rounded bg-muted animate-pulse" />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="h-2 w-20 rounded bg-muted animate-pulse" />
                                  <div className="h-2 w-6 rounded bg-muted animate-pulse" />
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="h-2 w-20 rounded bg-muted animate-pulse" />
                                  <div className="h-2 w-6 rounded bg-muted animate-pulse" />
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-muted animate-pulse" />
                              </div>
                            </div>
                          ))
                        : [
                            {
                              level: "A",
                              label: "Level A",
                              description: "Basic accessibility",
                            },
                            {
                              level: "AA",
                              label: "Level AA",
                              description: "Enhanced accessibility",
                            },
                            {
                              level: "AAA",
                              label: "Level AAA",
                              description: "Advanced accessibility",
                            },
                          ].map((item) => {
                            const violations =
                              results.accessibility.wcagCompliance[item.level]
                                ?.violations ?? 0;
                            const passed = countPassesByLevel(
                              results.accessibility.passes,
                              item.level,
                            );
                            const total = passed + violations;
                            const hasViolations = violations > 0;
                            return (
                              <div
                                key={item.level}
                                className="rounded-lg border bg-card p-4"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm ${
                                        hasViolations
                                          ? "bg-destructive/10 text-destructive"
                                          : "bg-success/10 text-success"
                                      }`}
                                    >
                                      {item.level}
                                    </div>
                                    <div>
                                      <div className="font-semibold text-sm">
                                        {item.label}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {item.description}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">
                                      Passed checks
                                    </span>
                                    <span className="font-semibold text-success">
                                      {passed}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">
                                      Failed checks
                                    </span>
                                    <span className="font-semibold text-destructive">
                                      {violations}
                                    </span>
                                  </div>
                                  <div className="w-full bg-muted rounded-full h-1.5">
                                    <div
                                      className="bg-primary h-1.5 rounded-full"
                                      style={{
                                        width: `${total > 0 ? (passed / total) * 100 : 0}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                    </div>
                    <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                      <Info className="h-4 w-4 shrink-0 mt-0.5" />
                      <p>
                        <span className="font-semibold">WCAG Levels:</span>{" "}
                        Level A (minimum), Level AA (recommended for most
                        websites), Level AAA (highest standard for critical
                        applications)
                      </p>
                    </div>
                  </div>

                  {/* Violations List */}
                  <div className="mt-6">
                    <ViolationsList
                      violations={results.accessibility?.violations || []}
                      incomplete={results.accessibility?.incomplete || []}
                    />
                  </div>
                </div>

                {/* Coming Soon Features */}
                <div className="border-dashed border-2 rounded-xl bg-card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Sparkles className="h-6 w-6 text-accent" />
                    <h3 className="text-2xl font-bold">Coming Soon</h3>
                  </div>
                  <p className="text-base text-muted-foreground mb-6">
                    Future capabilities to help you diagnose, optimize, and fix
                    your website
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                      {
                        title: "Automated Testing",
                        description:
                          "Schedule recurring scans and get alerts for new issues",
                        icon: Clock,
                      },
                      {
                        title: "GitHub Integration",
                        description:
                          "Create pull requests with fixes directly from FastFix",
                        icon: Github,
                      },
                      {
                        title: "Performance Optimization",
                        description:
                          "Image optimization, code splitting, and lazy loading suggestions",
                        icon: TrendingUp,
                      },
                      {
                        title: "SEO Recommendations",
                        description:
                          "Advanced meta tag analysis and structured data validation",
                        icon: BarChart3,
                      },
                      {
                        title: "Multi-page Crawling",
                        description:
                          "Analyze entire website architecture and find broken links",
                        icon: Search,
                      },
                      {
                        title: "Custom Rules",
                        description:
                          "Define your own accessibility and performance standards",
                        icon: Shield,
                      },
                    ].map((feature) => (
                      <div
                        key={feature.title}
                        className="flex gap-4 items-start"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <feature.icon className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold mb-2">
                            {feature.title}
                          </h3>
                          <p className="text-base text-muted-foreground">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Visual Check Sidebar */}
              <div className="space-y-6">
                <div className="bg-card rounded-xl border p-6 lg:sticky lg:top-24">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <Camera className="h-5 w-5 text-primary" />
                        <h3 className="text-xl font-bold">Visual Check</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedDevice("desktop")}
                        className={`h-8 w-8 flex items-center justify-center rounded-lg ${
                          selectedDevice === "desktop"
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`}
                      >
                        <Monitor className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setSelectedDevice("mobile")}
                        className={`h-8 w-8 flex items-center justify-center rounded-lg ${
                          selectedDevice === "mobile"
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`}
                      >
                        <Smartphone className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Main Screenshot */}
                    <div className="relative group">
                      <div className="aspect-video rounded-lg border-2 bg-muted overflow-hidden">
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <div className="text-center">
                            <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-xs">Screenshot preview</p>
                            <p className="text-[10px]">
                              {selectedDevice === "desktop"
                                ? "1920×1080"
                                : "375×667"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-1 text-[10px] bg-background/90 backdrop-blur border rounded">
                          {selectedDevice === "desktop"
                            ? "1920×1080"
                            : "375×667"}
                        </span>
                      </div>
                      <button className="absolute bottom-2 right-2 px-2 py-1 text-xs bg-secondary rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <ZoomIn className="h-3 w-3" />
                        Expand
                      </button>
                    </div>

                    {/* Core Web Vitals */}
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Core Web Vitals
                      </h4>
                      <div className="space-y-3">
                        {!results?.performance?.metrics
                          ? Array.from({ length: 3 }).map((_, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between rounded-lg border bg-muted/30 p-3"
                              >
                                <div className="flex flex-col gap-1">
                                  <div className="h-2 w-28 rounded bg-muted animate-pulse" />
                                  <div className="h-4 w-14 rounded bg-muted animate-pulse" />
                                </div>
                                <div className="h-6 w-10 rounded bg-muted animate-pulse" />
                              </div>
                            ))
                          : [
                              {
                                label: "LCP",
                                value: formatMs(
                                  results.performance.metrics.lcp?.value,
                                ),
                                status:
                                  getMetricStatus(
                                    results.performance.metrics.lcp?.score,
                                  ) === "good"
                                    ? "good"
                                    : "poor",
                                description: "Largest Contentful Paint",
                              },
                              {
                                label: "TBT",
                                value: formatMs(
                                  results.performance.metrics.tbt?.value,
                                ),
                                status:
                                  getMetricStatus(
                                    results.performance.metrics.tbt?.score,
                                  ) === "good"
                                    ? "good"
                                    : "poor",
                                description: "Total Blocking Time",
                              },
                              {
                                label: "CLS",
                                value:
                                  results.performance.metrics.cls?.value != null
                                    ? results.performance.metrics.cls.value.toFixed(
                                        3,
                                      )
                                    : "—",
                                status:
                                  getMetricStatus(
                                    results.performance.metrics.cls?.score,
                                  ) === "good"
                                    ? "good"
                                    : "poor",
                                description: "Cumulative Layout Shift",
                              },
                            ].map((metric) => (
                              <div
                                key={metric.label}
                                className="flex items-center justify-between rounded-lg border bg-muted/30 p-3"
                              >
                                <div className="flex flex-col">
                                  <span className="text-xs font-medium text-muted-foreground">
                                    {metric.description}
                                  </span>
                                  <span className="font-bold text-foreground">
                                    {metric.value}
                                  </span>
                                </div>
                                <span
                                  className={`px-2 py-1 text-xs font-semibold rounded ${metric.status === "good" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}
                                >
                                  {metric.label}
                                </span>
                              </div>
                            ))}
                      </div>
                    </div>

                    {/* Loading Timeline */}
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Loading Timeline
                      </h4>
                      <div className="grid grid-cols-5 gap-1">
                        {!results?.performance?.metrics
                          ? Array.from({ length: 5 }).map((_, i) => (
                              <div key={i} className="space-y-1">
                                <div className="aspect-square rounded border bg-muted animate-pulse" />
                                <div className="h-2 w-full rounded bg-muted animate-pulse" />
                              </div>
                            ))
                          : [
                              { time: "0s", label: "Start" },
                              {
                                time: formatMs(
                                  results.performance.metrics.fcp?.value,
                                ),
                                label: "FCP",
                              },
                              {
                                time: formatMs(
                                  results.performance.metrics.lcp?.value,
                                ),
                                label: "LCP",
                              },
                              {
                                time: formatMs(
                                  results.performance.metrics.tti?.value,
                                ),
                                label: "TTI",
                              },
                              {
                                time: formatMs(
                                  results.performance.metrics.si?.value,
                                ),
                                label: "SI",
                              },
                            ].map((frame, i) => (
                              <div key={i} className="space-y-1">
                                <div className="aspect-square rounded border bg-muted overflow-hidden">
                                  <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
                                    {i + 1}
                                  </div>
                                </div>
                                <div className="text-[10px] text-center text-muted-foreground">
                                  {frame.time}
                                </div>
                              </div>
                            ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Close grid */}
          </div>
        )}
        )
      </main>
    </div>
  );
}
