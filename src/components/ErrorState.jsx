import { AlertTriangle, RefreshCw, Settings } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Shared error state component used by every async call that can fail.
 *
 * @param {string}   message        - Human-readable error description shown to the user.
 * @param {Function} [onRetry]      - When provided, renders a Retry button that calls this fn.
 * @param {string}   [settingsLink] - Router path. When provided, renders a "Go to settings" link.
 *                                    Use this for permanent errors that require user action.
 */
export default function ErrorState({ message, onRetry, settingsLink }) {
  return (
    <div className="rounded-xl border-2 border-destructive/20 bg-destructive/5 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground">{message}</p>
          {(onRetry || settingsLink) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-background px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retry
                </button>
              )}
              {settingsLink && (
                <Link
                  to={settingsLink}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-background px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Go to settings
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
