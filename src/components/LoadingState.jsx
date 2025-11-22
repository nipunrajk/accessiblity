import { Zap } from "lucide-react";

function LoadingState({ scanStats = {} }) {
  const { pagesScanned = 0, totalPages = 0 } = scanStats;

  // Full-page loading state (when no scan stats)
  if (pagesScanned === 0 && totalPages === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="relative mx-auto mb-8 h-20 w-20">
            {/* Animated pulse ring */}
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
            {/* Rotating gradient border */}
            <div className="absolute inset-0 animate-spin rounded-full bg-gradient-to-tr from-primary via-accent to-primary opacity-75" />
            {/* Inner logo container */}
            <div className="absolute inset-1 flex items-center justify-center rounded-full bg-background">
              <Zap className="h-10 w-10 text-primary animate-pulse" />
            </div>
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            FastFix
          </h2>
          <p className="text-sm text-muted-foreground">
            Loading your workspace...
          </p>
        </div>
      </div>
    );
  }

  // Inline loading state (with scan progress)
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-card border border-border rounded-2xl p-8 text-center shadow-sm">
        <div className="relative mx-auto mb-6 h-16 w-16">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
          <Zap className="absolute inset-0 m-auto h-8 w-8 text-primary animate-pulse" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Analyzing Website
        </h3>
        <p className="text-muted-foreground mb-4">
          Scanning {pagesScanned} of {totalPages || "?"} pages
        </p>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{
              width: `${totalPages ? (pagesScanned / totalPages) * 100 : 0}%`,
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}

export default LoadingState;
