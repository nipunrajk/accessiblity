import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingState from './components/LoadingState';

// Lazy load pages for better performance
const SignUp = lazy(() => import('./pages/SignUp'));
const Analyzer = lazy(() => import('./pages/Analyzer'));
const AIFix = lazy(() => import('./pages/AIFix'));
const GitHubConfig = lazy(() => import('./pages/GitHubConfig'));

function App() {
  return (
    <ErrorBoundary fallbackMessage='The application encountered an unexpected error. Please refresh the page to continue.'>
      <Suspense fallback={<LoadingState />}>
        <Routes>
          <Route path='/' element={<SignUp />} />
          <Route path='/analyzer' element={<Analyzer />} />
          <Route path='/analyze/:id' element={<Analyzer />} />
          <Route path='/ai-fix' element={<AIFix />} />
          <Route path='/github-config' element={<GitHubConfig />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
