import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Moon, Sun, Menu, Zap } from "lucide-react";

export function Header() {
  const [theme, setTheme] = useState("light");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link to="/analyzer" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">FastFix</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link
              to="/analyzer"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Analyzer
            </Link>
            <Link
              to="/github-config"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              GitHub Config
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
          >
            {theme === "light" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </button>

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
            >
              <Menu className="h-5 w-5" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md border bg-popover p-1 shadow-md">
                <Link
                  to="/login"
                  className="block px-3 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/"
                  className="block px-3 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign Up
                </Link>
                <button
                  onClick={() => {
                    toggleTheme();
                    setMenuOpen(false);
                  }}
                  className="sm:hidden w-full text-left px-3 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground"
                >
                  {theme === "light" ? "Dark Mode" : "Light Mode"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
