# Spec: GitHub Action & CLI Integration

## Objective
Enable developers to run website quality audits (performance, accessibility, best practices, and SEO) from the command-line and within their CI/CD workflows (such as GitHub Actions) without launching the graphical UI. 
The tool must support configurable quality thresholds and exit with non-zero exit codes to fail CI builds when expectations are not met.

## Tech Stack
- **Runtime**: Node.js v18+ (ES modules)
- **Built-in Parsing**: `util.parseArgs` (native to Node.js)
- **Libraries**: Orchestration leverages existing project dependencies (`puppeteer`, `lighthouse`, `axe-puppeteer`, `pa11y`).

## Commands
- **Run CLI**: `node backend/cli.js --url <url>`
- **Run via npm**: `npm run cli -- --url <url>`
- **Test CLI Logic**: `cd backend && npm test __tests__/cli.test.js`

## Project Structure
- `backend/cli.js` — The main CLI application and execution entry point.
- `action.yml` — GitHub Action metadata detailing action inputs and execution.
- `backend/__tests__/cli.test.js` — Unit tests covering option parsing, validation, and exit behaviors.
- `.github/workflows/fastfix-ci.yml` — Example workflow integration demonstrating pipeline usage.

## Code Style
Standard ES module style. Uses clean async/await, console tables for visual score reporting, and standard error printing.

Example CLI printing logic:
```javascript
console.log(`\nFastFix Audit Results for: ${url}\n`);
console.table([
  { Category: 'Performance', Score: scores.performance },
  { Category: 'Accessibility', Score: scores.accessibility },
  { Category: 'Best Practices', Score: scores.bestPractices },
  { Category: 'SEO', Score: scores.seo }
]);
```

## Testing Strategy
- **Framework**: Vitest (matching the backend testing stack)
- **Coverage**: Option parsing, default values, threshold validation, and stdout reporting helpers.

## Boundaries
- **Always**: 
  - Validate that the URL is formed correctly.
  - Exit with `1` on threshold failure or uncaught audit execution errors.
  - Support headless browser options compatible with CI runners.
- **Ask first**:
  - Modifying existing `AnalysisOrchestratorService` internals.
- **Never**:
  - Require the user interface (Vite dev server) to be running.
  - Commit API keys or default credentials.

## Success Criteria
1. Running `node backend/cli.js --url https://example.com` returns the audit scores in a visual table and exits with `0`.
2. Running the tool with a threshold option (e.g. `--fail-on-a11y 95`) exits with `1` and prints an error message if the actual accessibility score is below 95.
3. Specifying `--output report.json` successfully saves the full analysis output object into the file.
4. A complete `action.yml` is defined at the root of the project to allow native execution in a GitHub Actions pipeline.
