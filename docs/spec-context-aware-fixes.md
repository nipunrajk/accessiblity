# Spec: Context-Aware AI Fixes

## Objective
Enhance the precision of AI-generated fixes by including the actual affected component details (the HTML code snippets and CSS selectors) in the LLM prompts. This allows the AI model to output highly specific, drop-in replacement code tailored to the user's specific page structure, rather than generic recommendations.

## Tech Stack
- **Runtime**: Node.js v18+ (ES modules)
- **Libraries**: Vitest for unit testing.

## Commands
- **Run Unit Tests**: `cd backend && npm test __tests__/services/prompt-builder.test.js`

## Project Structure
- `backend/services/ai/prompt-builder.service.js` — Modifying prompt templates to format and incorporate selector and snippet contexts.
- `backend/__tests__/services/prompt-builder.test.js` — New test suite ensuring correct prompt generation with and without selectors/snippets.

## Code Style
Standard ES module style. Uses clean template literals for prompts.

Example prompt template enhancement:
```javascript
let details = `
${index + 1}. ${issue.title}
   Type: ${issue.type}
   Description: ${issue.description}
   Impact: ${issue.impact}`;

if (issue.recommendations) {
  details += `\n   Affected Components:\n` + issue.recommendations.map(r => `      - Selector: "${r.selector}"\n      - Code Snippet: \`${r.snippet}\``).join('\n');
}
```

## Testing Strategy
- **Framework**: Vitest
- **Scope**:
  - Ensure standard prompts are generated without snippets.
  - Ensure snippets/selectors are formatted and present when provided.
  - Ensure the AI instruction includes directives to look at component code and tailor responses.

## Boundaries
- **Always**:
  - Gracefully fallback if `recommendations`, `selector`, or `snippet` is missing.
  - Keep the prompt structure clean and legible.
- **Never**:
  - Fail execution or throw errors if code context is unavailable.
  - Break the JSON schema expectation for the batch fixes response.
