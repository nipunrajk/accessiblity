# 🚀 FastFix - AI-Powered Website Analysis & Optimization

> **Intelligent code analysis and automated fix suggestions that combine AI capabilities with performance analysis to help developers improve their websites.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)

## 📊 Code Quality Status

### ✅ **Well Structured**

- **Component Architecture**: Clean separation with reusable components
- **Service Layer**: Proper API abstraction and error handling
- **Custom Hooks**: Logic separation with `useAnalysis` hook
- **Utility Functions**: Centralized helper functions for scores and colors
- **Modular Design**: Components broken into logical sub-components

### ✅ **Recent Improvements Made**

- **Error Boundaries**: Added comprehensive error boundary with fallback UI
- **PropTypes**: Added proper prop validation to key components
- **Constants**: Centralized configuration and constants to reduce duplication
- **API Service**: Created unified API service layer for better error handling
- **Backend Validation**: Added input validation and error handling middleware
- **Code Organization**: Improved imports and reduced code duplication
- **Lazy Loading**: Added code splitting for better performance

### ⚠️ **Still Needs Improvement**

- **TypeScript**: Add TypeScript for better development experience
- **Testing**: Comprehensive unit and integration tests
- **Caching**: Add response caching for better performance
- **Monitoring**: Add error tracking and performance monitoring

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

1. **Open** http://localhost:5176
2. **Enter** any website URL (e.g., https://example.com)
3. **Click** "Analyze" to see Lighthouse results
4. **Configure AI** for enhanced insights (see [AI Setup](#-ai-configuration))

### 🤖 Quick AI Setup (Optional but Recommended)

```bash
# Production-ready setup - provider + API key + model:
npm run ai:setup openrouter sk-or-v1-your-key x-ai/grok-4-fast:free  # Free Grok
npm run ai:setup openai sk-your-openai-key gpt-3.5-turbo             # OpenAI
npm run ai:setup ollama                                               # Local (no key)

# Check status:
npm run ai:status
```

📖 **Detailed AI setup guide**: [AI_SETUP.md](AI_SETUP.md)

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

## 🤖 AI Configuration

### Quick Setup (Recommended)

**OpenRouter with xAI Grok** - Free and fast AI analysis:

1. **Get API Key**: Visit [OpenRouter](https://openrouter.ai/keys)
2. **Add to Backend**: Set `OPENROUTER_API_KEY` in `backend/.env`
3. **Enable**: Set `AI_PROVIDER=openrouter` in `backend/.env`

```env
# backend/.env
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_MODEL=x-ai/grok-4-fast:free
```

### Alternative Providers

#### OpenAI (GPT Models)

```env
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-3.5-turbo
```

#### Anthropic (Claude Models)

```env
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=your_anthropic_key
ANTHROPIC_MODEL=claude-3-haiku-20240307
```

#### Groq (Fast Inference)

```env
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_key
GROQ_MODEL=mixtral-8x7b-32768
```

#### Ollama (Local Models)

```env
AI_PROVIDER=ollama
OLLAMA_MODEL=llama2
OLLAMA_BASE_URL=http://localhost:11434
```

## 🏗️ Architecture

### Technology Stack

#### Frontend

- **React 18** - Modern UI framework
- **Vite** - Lightning-fast build tool
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **Axios** - HTTP client

#### Backend

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Lighthouse** - Performance analysis engine
- **Puppeteer** - Browser automation
- **Multiple AI SDKs** - AI provider integration

#### Development Tools

- **ESLint** - Code linting and quality
- **Prettier** - Code formatting
- **Unlighthouse** - Batch performance testing

### Project Structure

```
FastFix/
├── 📁 Frontend (React + Vite)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route-level components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API communication
│   │   ├── config/         # Configuration files
│   │   └── utils/          # Helper functions
│   └── public/             # Static assets
│
├── 📁 Backend (Node.js + Express)
│   ├── controllers/        # Request handlers
│   ├── services/           # Business logic
│   ├── routes/             # API routes
│   └── server.js           # Express app
│
└── 📁 Documentation
    ├── PROJECT_STRUCTURE.md    # Architecture overview
    ├── CODE_ORGANIZATION.md    # Code standards
    ├── API_DOCUMENTATION.md    # API reference
    ├── DEVELOPMENT_GUIDE.md    # Development setup
    └── AI_SETUP.md            # AI configuration
```

## 🔌 API Endpoints

### Analysis

- `POST /analyze` - Run website analysis
- `POST /api/scan-elements` - Scan DOM elements

### AI Services

- `POST /api/ai-analysis` - Get AI insights
- `POST /api/ai-fixes` - Generate fix suggestions

### Repository Management

- `POST /api/repo/modify` - Direct file modifications
- `POST /api/repo/ai-modify` - AI-assisted modifications
- `POST /api/repo/ai-optimize` - Comprehensive optimization

## 🧪 Development

### Development Commands

```bash
# Start development environment
npm run dev              # Frontend development server
cd backend && npm start  # Backend development server

# Code quality
npm run lint            # Check code quality
npm run lint:fix        # Auto-fix linting issues

# Building
npm run build           # Build for production
npm run preview         # Preview production build

# Performance testing
npm run unlighthouse    # Batch performance analysis
```

### Code Quality Standards

- **ESLint** configuration for consistent code style
- **Component-based** architecture with single responsibility
- **Custom hooks** for shared logic
- **PropTypes** validation for components
- **Error boundaries** for graceful error handling

## 📚 Documentation

### Comprehensive Guides

- **[Project Structure](PROJECT_STRUCTURE.md)** - Complete architecture overview
- **[Code Organization](CODE_ORGANIZATION.md)** - Development standards and best practices
- **[API Documentation](API_DOCUMENTATION.md)** - Complete API reference
- **[Development Guide](DEVELOPMENT_GUIDE.md)** - Setup and development workflow
- **[AI Setup Guide](AI_SETUP.md)** - AI provider configuration

### Quick References

- **[AI Providers Setup](AI_PROVIDERS_SETUP.md)** - Detailed AI configuration
- **[Grok Setup](SETUP_GROK.md)** - xAI Grok specific setup
- **[Debug Models](DEBUG_MODELS.md)** - AI model debugging

## 🚀 Deployment

### Production Build

```bash
# Frontend
npm run build
# Deploy dist/ folder to your hosting service

# Backend
npm ci --only=production
NODE_ENV=production node server.js
```

### Deployment Platforms

- **Frontend**: Vercel, Netlify, GitHub Pages
- **Backend**: Railway, Heroku, DigitalOcean, AWS
- **Docker**: Full containerization support

## 🤝 Contributing

### Development Setup

1. **Fork** the repository
2. **Clone** your fork locally
3. **Install** dependencies: `npm install`
4. **Create** feature branch: `git checkout -b feature/amazing-feature`
5. **Make** your changes following our code standards
6. **Test** your changes thoroughly
7. **Submit** a pull request

### Code Standards

- Follow ESLint configuration
- Use meaningful component and variable names
- Add PropTypes for React components
- Write clear commit messages
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Lighthouse** team for the amazing performance analysis engine
- **OpenAI, Anthropic, Groq** for AI capabilities
- **React** and **Vite** teams for excellent development tools
- **Open source community** for inspiration and contributions

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Documentation**: Check our comprehensive guides above

---

**Made with ❤️ by developers, for developers**

_FastFix helps you build faster, more accessible, and better-performing websites with the power of AI._
