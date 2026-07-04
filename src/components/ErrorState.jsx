import { Link } from "react-router-dom";
import { Callout, Button } from "@radix-ui/themes";
import { CrossCircledIcon } from "@radix-ui/react-icons";
import { RefreshCw, Settings } from "lucide-react";

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
    <Callout.Root color="tomato">
      <Callout.Icon>
        <CrossCircledIcon />
      </Callout.Icon>
      <Callout.Text>
        {message}
      </Callout.Text>
      {(onRetry || settingsLink) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {onRetry && (
            <Button variant="outline" color="gray" onClick={onRetry}>
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </Button>
          )}
          {settingsLink && (
            <Button variant="outline" color="gray" asChild>
              <Link to={settingsLink}>
                <Settings className="h-3.5 w-3.5" />
                Go to settings
              </Link>
            </Button>
          )}
        </div>
      )}
    </Callout.Root>
  );
}
