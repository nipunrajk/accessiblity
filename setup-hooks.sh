#!/bin/bash

echo "🔧 Setting up pre-commit hooks..."

# Check if we're in the root directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: Run this from project root"
  exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install --save-dev husky lint-staged prettier eslint-config-prettier

cd backend
npm install --save-dev lint-staged prettier
cd ..

# Initialize Husky
echo "🎣 Initializing Husky..."
npx husky init

# Create pre-commit hook
cat > .husky/pre-commit << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

npm run lint:fix || exit 1

cd backend
npm run precommit || exit 1
cd ..

echo "✅ Checks passed!"
EOF

chmod +x .husky/pre-commit

# Create commit-msg hook
cat > .husky/commit-msg << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

commit_msg=$(cat "$1")

if ! echo "$commit_msg" | grep -qE "^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?: .+"; then
  echo "❌ Invalid commit message!"
  echo ""
  echo "Use: <type>: <description>"
  echo "Examples:"
  echo "  feat: add new feature"
  echo "  fix: bug fix"
  echo "  test: add tests"
  exit 1
fi
EOF

chmod +x .husky/commit-msg

# Create Prettier config
cat > .prettierrc << 'EOF'
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
EOF

cat > .prettierignore << 'EOF'
node_modules
dist
build
coverage
.vite
.husky
*.log
package-lock.json
.env
.env.*
screenshots
.unlighthouse
EOF

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Add scripts to package.json (see HOOKS_SETUP.md)"
echo "2. Test: git commit -m 'test: hooks'"
echo ""
