import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Menu, Zap } from "lucide-react";
import { Flex, Heading, Link, Badge, IconButton, Box } from "@radix-ui/themes";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Flex asChild align="center" justify="between" p="4" className="sticky top-0 z-50 w-full backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <header>
        <Flex align="center" gap="8">
          <RouterLink to="/analyzer" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <Heading size="4" weight="bold" color="teal">FastFix</Heading>
          </RouterLink>

          <Flex asChild align="center" gap="6" className="hidden md:flex">
            <nav>
              <Link asChild color="gray" weight="medium">
                <RouterLink to="/analyzer">Analyzer</RouterLink>
              </Link>
              <Link asChild color="gray" weight="medium">
                <RouterLink to="/github-config">GitHub Config</RouterLink>
              </Link>
            </nav>
          </Flex>
        </Flex>

        <Flex align="center" gap="4">
          <Badge color="teal" variant="surface" className="hidden sm:inline-flex">Dark</Badge>

          <Box className="relative">
            <IconButton
              variant="ghost"
              color="gray"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Menu className="h-5 w-5" />
            </IconButton>

            {menuOpen && (
              <Box className="absolute right-0 mt-2 w-48 rounded-md bg-popover p-1 shadow-md">
                <Link asChild color="gray">
                  <RouterLink
                    to="/login"
                    className="block px-3 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground"
                    onClick={() => setMenuOpen(false)}
                  >
                    Login
                  </RouterLink>
                </Link>
                <Link asChild color="gray">
                  <RouterLink
                    to="/"
                    className="block px-3 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground"
                    onClick={() => setMenuOpen(false)}
                  >
                    Sign Up
                  </RouterLink>
                </Link>
                <div className="sm:hidden w-full text-left px-3 py-2 text-sm">
                  <Badge color="teal" variant="surface">Dark</Badge>
                </div>
              </Box>
            )}
          </Box>
        </Flex>
      </header>
    </Flex>
  );
}
