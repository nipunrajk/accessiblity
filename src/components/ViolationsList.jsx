import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  XCircle,
  AlertTriangle,
  Info,
  ArrowRight,
  ExternalLink,
  Code2,
} from "lucide-react";

const SEVERITY_CONFIG = {
  critical: {
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/20",
    label: "Critical",
  },
  serious: {
    color: "text-orange-600",
    bg: "bg-orange-50 dark:bg-orange-950/20",
    border: "border-orange-200 dark:border-orange-900/30",
    label: "Serious",
  },
  moderate: {
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/20",
    label: "Moderate",
  },
  minor: {
    color: "text-muted-foreground",
    bg: "bg-muted",
    border: "border-border",
    label: "Minor",
  },
};

const WCAG_LEVEL_COLORS = {
  A: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  AA: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  AAA: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
};

function ViolationCard({ violation, isExpanded, onToggle }) {
  const severityConfig =
    SEVERITY_CONFIG[violation.impact || violation.severity || "moderate"];
  const wcagLevel = violation.wcagLevel || extractWCAGLevel(violation.tags);

  return (
    <div
      className={`rounded-lg border-2 ${severityConfig.border} ${severityConfig.bg} overflow-hidden`}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full p-6 flex items-start justify-between gap-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex-1 text-left">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <h4 className="text-xl font-bold text-foreground">
              {violation.help || violation.title}
            </h4>
            {wcagLevel && (
              <span
                className={`px-3 py-1.5 text-sm font-semibold rounded-md ${WCAG_LEVEL_COLORS[wcagLevel]}`}
              >
                WCAG {wcagLevel}
              </span>
            )}
            <span
              className={`px-3 py-1.5 text-sm font-semibold rounded-md ${severityConfig.bg} ${severityConfig.color}`}
            >
              {severityConfig.label}
            </span>
          </div>
          <p className="text-base text-muted-foreground mb-4 leading-relaxed">
            {violation.description}
          </p>
          <div className="flex items-center gap-6 text-base text-muted-foreground">
            <span className="font-semibold">
              {violation.nodeCount || violation.nodes?.length || 1} instances
            </span>
            {violation.detectedBy && violation.detectedBy.length > 0 && (
              <div className="flex items-center gap-2">
                <span>Detected by:</span>
                {violation.detectedBy.map((tool) => (
                  <span
                    key={tool}
                    className="px-2.5 py-1 bg-muted rounded-md text-sm font-mono"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t px-6 py-6 space-y-6 bg-background/50">
          {/* WCAG Criteria */}
          {violation.wcagCriteria && (
            <div>
              <h5 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Info className="h-6 w-6" />
                WCAG Success Criteria
              </h5>
              <p className="text-base text-muted-foreground">
                {violation.wcagCriteria} - {wcagLevel} Level
              </p>
            </div>
          )}

          {/* Affected Elements */}
          {violation.nodes && violation.nodes.length > 0 && (
            <div>
              <h5 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Code2 className="h-6 w-6" />
                Affected Elements ({violation.nodes.length})
              </h5>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {violation.nodes.slice(0, 5).map((node, idx) => (
                  <div key={idx} className="p-4 bg-muted rounded-lg text-base">
                    {node.html && (
                      <pre className="font-mono text-sm overflow-x-auto mb-3 text-foreground leading-relaxed">
                        {node.html.substring(0, 200)}
                        {node.html.length > 200 && "..."}
                      </pre>
                    )}
                    {node.target && (
                      <p className="text-muted-foreground text-base">
                        <span className="font-semibold">Selector:</span>{" "}
                        {node.target.join(" > ")}
                      </p>
                    )}
                    {node.failureSummary && (
                      <p className="text-destructive mt-2 text-base">
                        {node.failureSummary}
                      </p>
                    )}
                  </div>
                ))}
                {violation.nodes.length > 5 && (
                  <p className="text-base text-muted-foreground text-center py-3">
                    ... and {violation.nodes.length - 5} more instances
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {violation.recommendations &&
            violation.recommendations.length > 0 && (
              <div>
                <h5 className="text-lg font-bold mb-3">Recommendations</h5>
                <ul className="space-y-3">
                  {violation.recommendations.map((rec, idx) => (
                    <li
                      key={idx}
                      className="text-base text-foreground flex items-start gap-3"
                    >
                      <ArrowRight className="h-6 w-6 mt-0.5 text-primary shrink-0" />
                      <span className="leading-relaxed">
                        {rec.suggestion || rec}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {/* Learn More Link */}
          {violation.helpUrl && (
            <div>
              <a
                href={violation.helpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-base font-medium text-primary hover:underline"
              >
                Learn more about this issue
                <ExternalLink className="h-5 w-5" />
              </a>
            </div>
          )}

          {/* View AI Fixes Button */}
          <div className="pt-4 border-t">
            <Link
              to="/ai-fix"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-lg font-semibold shadow-sm"
            >
              View AI Fixes
              <ArrowRight className="h-6 w-6" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function extractWCAGLevel(tags) {
  if (!tags) return null;
  if (tags.includes("wcag2aaa") || tags.includes("wcag21aaa")) return "AAA";
  if (
    tags.includes("wcag2aa") ||
    tags.includes("wcag21aa") ||
    tags.includes("wcag22aa")
  )
    return "AA";
  if (
    tags.includes("wcag2a") ||
    tags.includes("wcag21a") ||
    tags.includes("wcag22a")
  )
    return "A";
  return null;
}

export default function ViolationsList({ violations = [], incomplete = [] }) {
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [activeTab, setActiveTab] = useState("violations");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [wcagFilter, setWcagFilter] = useState("all");

  const toggleExpanded = (id) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  // Filter violations
  const filteredViolations = violations.filter((v) => {
    if (severityFilter !== "all" && (v.impact || v.severity) !== severityFilter)
      return false;
    if (wcagFilter !== "all") {
      const level = v.wcagLevel || extractWCAGLevel(v.tags);
      if (level !== wcagFilter) return false;
    }
    return true;
  });

  const filteredIncomplete = incomplete.filter((v) => {
    if (severityFilter !== "all" && (v.impact || v.severity) !== severityFilter)
      return false;
    if (wcagFilter !== "all") {
      const level = v.wcagLevel || extractWCAGLevel(v.tags);
      if (level !== wcagFilter) return false;
    }
    return true;
  });

  const displayList =
    activeTab === "violations" ? filteredViolations : filteredIncomplete;

  // Count by severity
  const severityCounts = {
    critical: violations.filter((v) => (v.impact || v.severity) === "critical")
      .length,
    serious: violations.filter((v) => (v.impact || v.severity) === "serious")
      .length,
    moderate: violations.filter((v) => (v.impact || v.severity) === "moderate")
      .length,
    minor: violations.filter((v) => (v.impact || v.severity) === "minor")
      .length,
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-2 border-b">
        <button
          onClick={() => setActiveTab("violations")}
          className={`px-6 py-3 text-base font-semibold border-b-2 transition-colors ${
            activeTab === "violations"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            Violations ({violations.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab("incomplete")}
          className={`px-6 py-3 text-base font-semibold border-b-2 transition-colors ${
            activeTab === "incomplete"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Incomplete ({incomplete.length})
          </div>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold text-muted-foreground">
            Severity:
          </span>
          <div className="flex gap-2">
            {["all", "critical", "serious", "moderate", "minor"].map(
              (severity) => (
                <button
                  key={severity}
                  onClick={() => setSeverityFilter(severity)}
                  className={`px-5 py-2.5 text-base rounded-lg transition-colors font-semibold ${
                    severityFilter === severity
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {severity === "all"
                    ? "All"
                    : severity.charAt(0).toUpperCase() + severity.slice(1)}
                  {severity !== "all" && ` (${severityCounts[severity]})`}
                </button>
              ),
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-base font-semibold text-muted-foreground">
            WCAG Level:
          </span>
          <div className="flex gap-2">
            {["all", "A", "AA", "AAA"].map((level) => (
              <button
                key={level}
                onClick={() => setWcagFilter(level)}
                className={`px-5 py-2.5 text-base rounded-lg transition-colors font-semibold ${
                  wcagFilter === level
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {level === "all" ? "All Levels" : `Level ${level}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-base font-medium text-muted-foreground">
        Showing {displayList.length} of{" "}
        {activeTab === "violations" ? violations.length : incomplete.length}{" "}
        issues
      </div>

      {/* Violations List */}
      {displayList.length > 0 ? (
        <div className="space-y-4">
          {displayList.map((violation) => (
            <ViolationCard
              key={violation.id}
              violation={violation}
              isExpanded={expandedIds.has(violation.id)}
              onToggle={() => toggleExpanded(violation.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Info className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-base">
            No issues found matching the selected filters
          </p>
        </div>
      )}

      {/* Incomplete Tab Info */}
      {activeTab === "incomplete" && incomplete.length > 0 && (
        <div className="mt-6 p-6 bg-warning/10 border border-warning/20 rounded-lg">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-warning shrink-0 mt-1" />
            <div className="text-base">
              <p className="font-semibold text-foreground mb-2">
                Manual Review Required
              </p>
              <p className="text-muted-foreground leading-relaxed">
                These {incomplete.length} checks require manual verification to
                ensure accessibility compliance. They couldn't be automatically
                determined and need human review.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
