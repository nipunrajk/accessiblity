import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "../components/Header";
import { useAnalysis } from "../hooks/useAnalysis";
import LoadingState from "../components/LoadingState";
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
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold text-foreground">
                    Analysis Results
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono border rounded">
                    <Clock className="h-3 w-3" />
                    {scanStats?.pagesScanned || 1} page
                    {scanStats?.pagesScanned > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="truncate max-w-md">
                    {displayResults.url}
                  </span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 text-sm border rounded-lg hover:bg-accent flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
                <button className="px-4 py-2 text-sm border rounded-lg hover:bg-accent flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </button>
                <button
                  onClick={handleNewAnalysis}
                  className="px-4 py-2 text-sm border rounded-lg hover:bg-accent"
                >
                  New Analysis
                </button>
                <Link
                  to="/ai-fix"
                  className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2"
                >
                  View Fixes
                  <ArrowRight className="h-4 w-4" />
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
                      <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <div
                          className={`text-5xl font-bold tabular-nums ${getScoreColor(value)}`}
                        >
                          {value}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          /100
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${value >= 90 ? "bg-success" : value >= 50 ? "bg-warning" : "bg-destructive"}`}
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

            {/* Screenshots Section */}
            <div className="bg-card rounded-xl border p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Camera className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Page Screenshots</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Visual analysis of your website
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedDevice("desktop")}
                    className={`px-4 py-2 text-sm rounded-lg flex items-center gap-2 ${
                      selectedDevice === "desktop"
                        ? "bg-primary text-primary-foreground"
                        : "border hover:bg-accent"
                    }`}
                  >
                    <Monitor className="h-4 w-4" />
                    Desktop
                  </button>
                  <button
                    onClick={() => setSelectedDevice("mobile")}
                    className={`px-4 py-2 text-sm rounded-lg flex items-center gap-2 ${
                      selectedDevice === "mobile"
                        ? "bg-primary text-primary-foreground"
                        : "border hover:bg-accent"
                    }`}
                  >
                    <Smartphone className="h-4 w-4" />
                    Mobile
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {/* Main Screenshot */}
                <div className="relative group">
                  <div className="aspect-16/10 rounded-lg border-2 bg-muted overflow-hidden">
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Screenshot preview</p>
                        <p className="text-xs">
                          {selectedDevice === "desktop"
                            ? "1920×1080"
                            : "375×667"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="px-2 py-1 text-xs bg-background/90 backdrop-blur border rounded">
                      {selectedDevice === "desktop" ? "1920×1080" : "375×667"}
                    </span>
                    <span className="px-2 py-1 text-xs bg-background/90 backdrop-blur border rounded">
                      Chrome 131
                    </span>
                  </div>
                  <button className="absolute bottom-3 right-3 px-3 py-2 text-sm bg-secondary rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                    <ZoomIn className="h-4 w-4" />
                    View Full Size
                  </button>
                </div>

                {/* Core Web Vitals */}
                <div>
                  <h4 className="text-sm font-semibold mb-3">
                    Core Web Vitals
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      {
                        label: "LCP",
                        value: "1.2s",
                        status: "good",
                        description: "Largest Contentful Paint",
                      },
                      {
                        label: "FID",
                        value: "8ms",
                        status: "good",
                        description: "First Input Delay",
                      },
                      {
                        label: "CLS",
                        value: "0.05",
                        status: "good",
                        description: "Cumulative Layout Shift",
                      },
                    ].map((metric) => (
                      <div
                        key={metric.label}
                        className="rounded-lg border bg-card p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            {metric.description}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-xs rounded ${metric.status === "good" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}
                          >
                            {metric.status}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold">
                            {metric.value}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {metric.label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Insights */}
            {displayResults.aiInsights && (
              <div className="border-2 border-accent/20 bg-accent/5 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-accent" />
                  <h3 className="text-lg font-semibold">AI Insights</h3>
                </div>
                <p className="leading-relaxed text-foreground">
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
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="bg-card rounded-xl border p-6">
                <h3 className="text-lg font-semibold mb-2">
                  Issue Distribution
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {Object.values(displayResults.issues).reduce(
                    (a, b) => a + b,
                    0,
                  )}{" "}
                  total issues detected
                </p>
                <div className="space-y-4">
                  {Object.entries(displayResults.issues).map(([key, value]) => {
                    const total = Object.values(displayResults.issues).reduce(
                      (a, b) => a + b,
                      0,
                    );
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
                  })}
                </div>
              </div>

              <div className="bg-card rounded-xl border p-6">
                <h3 className="text-lg font-semibold mb-2">
                  Performance Metrics
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Key timing measurements
                </p>
                <div className="space-y-4">
                  {[
                    {
                      label: "First Contentful Paint",
                      value: "0.9s",
                      status: "good",
                    },
                    { label: "Speed Index", value: "1.5s", status: "good" },
                    {
                      label: "Time to Interactive",
                      value: "2.1s",
                      status: "average",
                    },
                    {
                      label: "Total Blocking Time",
                      value: "180ms",
                      status: "average",
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
                  <h3 className="text-lg font-semibold mb-1">
                    Accessibility Analysis
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Comprehensive testing against Web Content Accessibility
                    Guidelines
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span className="font-semibold">
                      {displayResults.issues.accessibility}
                    </span>
                    <span className="text-muted-foreground">Violations</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span className="font-semibold">145</span>
                    <span className="text-muted-foreground">Passed</span>
                  </div>
                </div>
              </div>

              {/* WCAG Compliance Levels */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold mb-3">
                  WCAG Compliance Levels
                </h4>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      level: "A",
                      label: "Level A",
                      description: "Basic accessibility",
                      passed: 42,
                      failed: 3,
                      status: "warning",
                    },
                    {
                      level: "AA",
                      label: "Level AA",
                      description: "Enhanced accessibility",
                      passed: 78,
                      failed: 18,
                      status: "error",
                    },
                    {
                      level: "AAA",
                      label: "Level AAA",
                      description: "Advanced accessibility",
                      passed: 25,
                      failed: 7,
                      status: "error",
                    },
                  ].map((item) => (
                    <div
                      key={item.level}
                      className="rounded-lg border bg-card p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm ${
                              item.status === "error"
                                ? "bg-destructive/10 text-destructive"
                                : "bg-warning/10 text-warning"
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
                            {item.passed}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            Failed checks
                          </span>
                          <span className="font-semibold text-destructive">
                            {item.failed}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div
                            className="bg-primary h-1.5 rounded-full"
                            style={{
                              width: `${(item.passed / (item.passed + item.failed)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>
                    <span className="font-semibold">WCAG Levels:</span> Level A
                    (minimum), Level AA (recommended for most websites), Level
                    AAA (highest standard for critical applications)
                  </p>
                </div>
              </div>
            </div>

            {/* Coming Soon Features */}
            <div className="border-dashed border-2 rounded-xl bg-card p-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-accent" />
                <h3 className="text-lg font-semibold">Coming Soon</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Future capabilities to help you diagnose, optimize, and fix your
                website
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
                  <div key={feature.title} className="flex gap-3 items-start">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <feature.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
