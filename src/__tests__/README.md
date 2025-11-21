# Frontend Tests

This directory contains test files for the FastFix frontend.

## Directory Structure

```
__tests__/
├── utils/            # Tests for utility functions
├── hooks/            # Tests for custom React hooks
├── components/       # Tests for React components
└── README.md         # This file
```

## Running Tests

Tests use Vitest, which is already configured with Vite. To run tests:

```bash
# Install testing dependencies
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

Add test scripts to `package.json`:

```json
{
  "scripts": {
    "test": "vitest --run",
    "test:watch": "vitest",
    "test:coverage": "vitest --coverage"
  }
}
```

## Vitest Configuration

Create or update `vite.config.js`:

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/__tests__/setup.js',
  },
});
```

Create `src/__tests__/setup.js`:

```javascript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
```

## Writing Tests

### Utility Tests

Test pure functions that don't depend on React:

```javascript
import { describe, it, expect } from 'vitest';
import { myUtil } from '../../utils/myUtil.js';

describe('myUtil', () => {
  it('should return expected result', () => {
    const result = myUtil('input');
    expect(result).toBe('expected');
  });
});
```

### Hook Tests

Test custom React hooks using `renderHook`:

```javascript
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useMyHook from '../../hooks/useMyHook.js';

describe('useMyHook', () => {
  it('should return initial state', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current.value).toBe('initial');
  });

  it('should update state', () => {
    const { result } = renderHook(() => useMyHook());

    act(() => {
      result.current.setValue('new');
    });

    expect(result.current.value).toBe('new');
  });
});
```

### Component Tests

Test React components using `render`:

```javascript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComponent from '../../components/MyComponent.jsx';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);

    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

## Test Guidelines

1. **Focus on Core Functionality**: Test the main logic, not edge cases
2. **Keep Tests Simple**: Avoid complex setup and mocking
3. **Test Real Behavior**: Use actual implementations when possible
4. **Clear Test Names**: Use descriptive test names that explain what is being tested
5. **Minimal Assertions**: Each test should verify one specific behavior
6. **User-Centric**: Test from the user's perspective (what they see and do)

## Example Tests

- `utils/scoreUtils.test.js` - Example unit test for score utility functions
- `hooks/useLocalStorage.test.js` - Example hook test for localStorage hook

## Common Testing Patterns

### Testing Async Operations

```javascript
it('should handle async data', async () => {
  render(<MyComponent />);

  // Wait for element to appear
  const element = await screen.findByText('Loaded');
  expect(element).toBeInTheDocument();
});
```

### Testing User Events

```javascript
it('should handle form submission', async () => {
  const user = userEvent.setup();
  render(<MyForm />);

  await user.type(screen.getByLabelText('Name'), 'John');
  await user.click(screen.getByRole('button', { name: 'Submit' }));

  expect(screen.getByText('Success')).toBeInTheDocument();
});
```

### Testing Context

```javascript
it('should use context value', () => {
  render(
    <MyContext.Provider value={{ data: 'test' }}>
      <MyComponent />
    </MyContext.Provider>
  );

  expect(screen.getByText('test')).toBeInTheDocument();
});
```
