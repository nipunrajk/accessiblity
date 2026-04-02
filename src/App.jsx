import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense, lazy, useState, useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingState from "./components/LoadingState";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AnalysisProvider } from "./contexts/AnalysisContext";
import { useAuthStore } from "./stores/authStore";
import { supabase } from "./lib/supabase";

// Lazy load pages for better performance
const SignUp = lazy(() => import("./pages/SignUp"));
const Login = lazy(() => import("./pages/Login"));
const Analyzer = lazy(() => import("./pages/Analyzer"));
const AIFix = lazy(() => import("./pages/AIFix"));
const GitHubConfig = lazy(() => import("./pages/GitHubConfig"));

/**
 * Wraps a route so only authenticated users can access it.
 * - Shows <LoadingState /> while the Supabase session is being verified on first render.
 * - Redirects unauthenticated users to /login, preserving the originally requested
 *   location in `state.from` so Login can redirect back after a successful sign-in.
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  // Start in the "checking" state so we never flash a redirect before the
  // initial Supabase session round-trip completes.
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // supabase.auth.getSession() resolves from the SDK's local cache on the
    // next microtask tick, so this adds at most one render cycle of delay.
    supabase.auth.getSession().then(() => setIsChecking(false));
  }, []);

  if (isChecking) {
    return <LoadingState />;
  }

  if (!isAuthenticated) {
    // Pass the current location so Login can redirect the user back after sign-in.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <ThemeProvider>
      <AnalysisProvider>
        <ErrorBoundary fallbackMessage="The application encountered an unexpected error. Please refresh the page to continue.">
          <Suspense fallback={<LoadingState />}>
            <Routes>
              {/* Root redirects to the main analyzer */}
              <Route path="/" element={<Navigate to="/analyzer" replace />} />

              {/* Public routes */}
              <Route path="/signup" element={<SignUp />} />
              <Route path="/login" element={<Login />} />

              {/* Protected routes — require authentication */}
              <Route
                path="/analyzer"
                element={
                  <ProtectedRoute>
                    <Analyzer />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analyze/:id"
                element={
                  <ProtectedRoute>
                    <Analyzer />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ai-fix"
                element={
                  <ProtectedRoute>
                    <AIFix />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/github-config"
                element={
                  <ProtectedRoute>
                    <GitHubConfig />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </AnalysisProvider>
    </ThemeProvider>
  );
}

export default App;
