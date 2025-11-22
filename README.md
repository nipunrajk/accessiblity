# 🚀 FastFix - AI-Powered Website Analysis & Optimization

> Intelligent code analysis and automated fix suggestions combining AI with performance analysis to help developers improve their websites.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)

## ✨ Features

### 🔍 **Comprehensive Analysis**

- **Lighthouse Integration** - Core web vitals and performance metrics
- **DOM Element Scanning** - Deep analysis of website structure
- **Multi-page Discovery** - Automatic sitemap generation and analysis
- **Real-time Progress** - Live updates during analysis

### 🤖 **AI-Powered Insights**

- **Multiple AI Providers** - OpenAI, Anthropic, Groq, OpenRouter, Ollama
- **Smart Recommendations** - Context-aware fix suggestions
- **Code Examples** - Ready-to-use code snippets
- **Impact Analysis** - Prioritized improvements by impact

### 🛠️ **Automated Fixes**

- **GitHub Integration** - Direct repository modifications
- **Pull Request Creation** - Automated PR generation with fixes
- **Code Validation** - Syntax checking and best practices
- **Batch Processing** - Multiple fixes in single operation

### 📊 **Advanced Reporting**

- **PDF Export** - Comprehensive analysis reports
- **Visual Dashboards** - Interactive score displays
- **Issue Categorization** - Performance, Accessibility, SEO, Best Practices
- **Progress Tracking** - Historical improvement tracking

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+**
- **npm** or **yarn**
- **AI Provider API Key** (recommended for enhanced features)

### 1-Minute Setup

```bash
# Clone and install
git clone <repository-url>
cd fastfix
npm install
cd backend && npm install && cd ..

# Configure environment (copy and edit)
cp .env.example .env
cp backend/.env.example backend/.env

# Start development servers
npm run dev          # Frontend → http://localhost:5176
cd backend && npm start  # Backend → http://localhost:3001
```

### First Analysis

1. Open http://localhost:5176
2. Enter any website URL (e.g., https://example.com)
3. Click "Analyze" to see Lighthouse results
4. Configure AI for enhanced insights (optional)

## ⚙️ Configuration

### Environment Files

#### Frontend (`.env`)

```env
# API Configuration
VITE_API_URL=http://localhost:3001

# AI Configuration (Optional)
VITE_OPENAI_API_KEY=your_openai_key
VITE_ANTHROPIC_API_KEY=your_anthropic_key
VITE_GROQ_API_KEY=your_groq_key
VITE_OPENROUTER_API_KEY=your_openrouter_key

# Supabase (Optional - for authentication)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Backend (`backend/.env`)

```env
# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:5176

# AI Provider Selection
AI_PROVIDER=openrouter  # openai, anthropic, groq, openrouter, ollama

# AI API Keys
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GROQ_API_KEY=your_groq_key
OPENROUTER_API_KEY=your_openrouter_key

# Model Configuration (Optional)
OPENAI_MODEL=gpt-3.5-turbo
ANTHROPIC_MODEL=claude-3-haiku-20240307
GROQ_MODEL=mixtral-8x7b-32768
OPENROUTER_MODEL=x-ai/grok-4-fast:free

# GitHub Integration (Optional)
GITHUB_TOKEN=your_github_personal_access_token
```

## 🤖 AI Configuration (Optional)

Choose any AI provider in `backend/.env`:

```env
# OpenRouter (Free Grok model recommended)
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your_key
OPENROUTER_MODEL=x-ai/grok-4-fast:free

# Or use: openai, anthropic, groq, ollama
```

Get API keys: [OpenRouter](https://openrouter.ai/keys) | [OpenAI](https://platform.openai.com) | [Anthropic](https://console.anthropic.com) | [Groq](https://console.groq.com)

## 🏗️ Tech Stack

**Frontend:** React 18, Vite, Tailwind CSS, React Router  
**Backend:** Node.js, Express, Lighthouse, Puppeteer  
**AI:** OpenAI, Anthropic, Groq, OpenRouter, Ollama

## 🔌 Key API Endpoints

- `POST /analyze` - Run website analysis
- `POST /api/ai-analysis` - Get AI insights
- `POST /api/ai-fixes` - Generate fix suggestions
- `POST /api/repo/ai-optimize` - AI-assisted optimization

## 🧪 Development

### Development Commands

```bash
# Start development environment
npm run dev              # Frontend development server
cd backend && npm start  # Backend development server

# Code quality
npm run lint            # Check code quality
npm run lint:fix        # Auto-fix linting issues

# Testing
cd backend && npm test           # Run all tests (681 tests)
cd backend && npm run test:watch # Watch mode
cd backend && npm run test:coverage # Coverage report

# Building
npm run build           # Build for production
npm run preview         # Preview production build

# Performance testing
npm run unlighthouse    # Batch performance analysis
```

### Pre-Commit Hooks (Optional)

Auto-lint, format, and test before commits:

```bash
./setup-hooks.sh
```

Bypass if needed: `git commit --no-verify -m "fix: emergency"`

## 🚀 Deployment

```bash
# Frontend
npm run build  # Deploy dist/ folder

# Backend
npm ci --only=production
NODE_ENV=production node server.js
```

**Platforms:** Vercel, Netlify, Railway, Heroku, AWS

## 🤝 Contributing

1. Fork and clone the repository
2. Create feature branch: `git checkout -b feature/name`
3. Make changes following ESLint standards
4. Test thoroughly
5. Submit pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Made with ❤️ by developers, for developers**
