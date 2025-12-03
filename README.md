# NorthStar - Holistic Wellness & Personal Growth Platform

<div align="center">

![NorthStar Badge](https://img.shields.io/badge/NorthStar-v1.0-brightgreen)
![React](https://img.shields.io/badge/Frontend-React%2018-blue)
![Node.js](https://img.shields.io/badge/Backend-Node.js%20+%20Express-green)
![AI](https://img.shields.io/badge/AI-OpenAI%20%2B%20Claude-orange)
![License](https://img.shields.io/badge/License-MIT-yellow)

*An intelligent, AI-powered wellness platform that helps users build better habits, track their progress across 8 life pillars, and achieve meaningful personal growth.*

[Features](#features) • [Quick Start](#quick-start) • [Architecture](#architecture) • [API Docs](#api-documentation) • [Contributing](#contributing)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Development](#development)
- [Testing](#testing)
- [CI/CD Pipeline](#cicd-pipeline)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Support](#support)

---

## 🎯 Overview

**NorthStar** is a comprehensive wellness platform combining habit tracking, AI-powered coaching, and personal growth metrics across 8 interconnected life pillars:

- 😴 **Sleep & Recovery** - Sleep quality, rest optimization, circadian rhythm
- 🥗 **Nutrition & Diet** - Dietary tracking, meal planning, nutritional insights
- 💪 **Exercise & Fitness** - Workout tracking, fitness goals, performance metrics
- 🏥 **Physical Health** - Health metrics, medical tracking, wellness assessments
- 🧠 **Mental & Emotional Health** - Mood tracking, stress management, emotional wellness
- 💰 **Financial Wellness** - Budget tracking, financial goals, spending analysis
- 👥 **Social Connections** - Relationship tracking, social goals, community engagement
- ✨ **Spirituality & Purpose** - Meaning exploration, values alignment, purpose tracking

### Key Capabilities

✨ **AI-Powered Coaching** - Personalized guidance from specialized AI agents
📊 **Progress Tracking** - Real-time analytics across all life pillars
🎯 **Habit Formation** - Evidence-based habit building with streak tracking
📝 **Guided Journaling** - AI-generated reflection prompts and guided journaling
🧘 **Meditation** - Library of guided meditations with AI generation
🎮 **Gamification** - Achievements, streaks, leaderboards, challenges
📱 **Mobile-First** - Progressive web app with offline functionality
🔐 **Privacy-First** - End-to-end encryption, local data processing

---

## ✨ Features

### Phase 12: Enterprise Production Features (Latest)

- **🌐 Progressive Web App (PWA)** - Install as native app, offline support, background sync
- **🔗 Deep Linking** - iOS/Android app store links with analytics
- **🌍 Internationalization** - Support for 5 languages (EN, ES, FR, DE, ZH)
- **♿ Accessibility** - WCAG 2.1 AA compliance, keyboard navigation, screen reader support
- **🔒 Legal Consent** - Multi-step consent modal for AI features with privacy/terms
- **⚡ Loading States** - Animated skeleton screens for optimal UX
- **🌙 Theme Support** - Dark/light mode with system detection
- **📲 Push Notifications** - Smart notification scheduling, OneSignal/Firebase integration
- **📧 Email Reports** - Weekly progress reports via SendGrid
- **💾 Cloud Backups** - Encrypted AWS S3 backups with 90-day retention

### Phase 11: Personalization & Engagement

- **🤖 AI Tone Profiler** - Learns user communication preferences
- **🎤 Voice Input** - Speech-to-text for quick habit logging
- **🧘 Guided Meditations** - AI-generated meditation sessions
- **💪 Exercise Library** - AI-generated workout recommendations
- **🍲 Recipe Generator** - Personalized meal suggestions
- **💳 Spending Tracker** - AI-powered financial insights
- **🏆 Leaderboards** - Competitive rankings with friend challenges
- **👥 Relationship Tracking** - Social connection insights

### Phase 10: Advanced Intelligence

- **🧠 Advanced AI Agents** - Specialized coaches for each life pillar
- **📈 Predictive Analytics** - Forecast progress and identify patterns
- **🔍 Deep Context Awareness** - Multi-agent orchestration with memory
- **💬 Conversational AI** - Natural language understanding and generation

### Phase 9: Core Features

- **📊 Habit Tracking** - Daily habit logging with visual progress
- **📝 Journal Entries** - Reflective journaling with AI analysis
- **🎯 Goal Setting** - SMART goal framework with progress tracking
- **👥 Community Features** - Friend challenges, social sharing
- **🔐 Authentication** - Secure sign-up, login, password management

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 + React Router 7
- **Styling**: Tailwind CSS 3 + Radix UI components
- **State Management**: Zustand
- **HTTP Client**: Axios + React Query
- **Forms**: React Hook Form + Zod validation
- **Internationalization**: react-i18next
- **Animations**: Framer Motion
- **Charts**: ApexCharts + Recharts
- **Build Tool**: Vite 6

### Backend
- **Runtime**: Node.js
- **Framework**: Express 4
- **Database**: MongoDB 7
- **Authentication**: JWT + bcryptjs
- **AI Models**: OpenAI GPT-4 + Anthropic Claude
- **Logging**: Winston with daily rotation
- **Validation**: Zod
- **Rate Limiting**: express-rate-limit

### DevOps & Testing
- **Testing**: Jest + Vitest
- **CI/CD**: GitHub Actions
- **Load Testing**: k6
- **Container**: Docker (ready)
- **Hosting**: Fly.io compatible

---

## 📁 Project Structure

```
NorthStar-BETA/
├── src/                          # Frontend React application
│   ├── components/               # React components
│   │   ├── Layout/              # Layout components
│   │   ├── shared/              # Shared components (GoalCreator, etc)
│   │   ├── skeletons/           # Loading skeleton screens
│   │   ├── ai/                  # AI-specific components
│   │   └── ...
│   ├── pages/                    # Page components
│   ├── ai/                       # AI prompt management
│   │   └── prompts/             # Organized prompt templates
│   ├── hooks/                    # Custom React hooks
│   ├── services/                 # API services
│   ├── store/                    # Zustand state management
│   ├── utils/                    # Utility functions
│   ├── config/                   # Configuration files
│   ├── theme/                    # Theme management
│   ├── i18n/                     # Internationalization
│   ├── notifications/            # Notification system
│   ├── pwa/                      # PWA configuration
│   ├── App.jsx                   # Root component
│   ├── main.jsx                  # Entry point
│   └── index.css                 # Global styles
│
├── backend/                      # Node.js Express backend
│   ├── server.js                 # Express server entry
│   ├── src/                      # Backend source code
│   │   ├── ai/                   # AI agents and orchestration
│   │   │   ├── agents/          # Specialized AI coaches
│   │   │   ├── modelRouter.js   # AI model routing
│   │   │   └── prompts.js       # Backend prompt management
│   │   ├── models/              # Mongoose schemas
│   │   ├── controllers/         # Route controllers
│   │   ├── routes/              # API routes
│   │   ├── middleware/          # Express middleware
│   │   ├── services/            # Business logic
│   │   └── utils/               # Utility functions
│   ├── config/                  # Configuration
│   ├── tests/                   # Backend tests
│   └── package.json
│
├── .github/
│   └── workflows/               # CI/CD pipelines
│       ├── frontend-tests.yml
│       ├── backend-tests.yml
│       └── deploy.yml
│
├── vite.config.js              # Vite configuration
├── tailwind.config.js          # Tailwind CSS config
├── eslint.config.js            # ESLint configuration
├── vitest.config.js            # Frontend test config
├── package.json                # Frontend dependencies
└── README.md                   # This file
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- MongoDB 5+ (local or cloud)
- OpenAI API key
- Anthropic API key (optional)

### 1. Clone & Setup

```bash
git clone https://github.com/dave20101020-maker/NorthStar-BETA.git
cd NorthStar-BETA

# Install dependencies
npm install
cd backend && npm install && cd ..
```

### 2. Environment Configuration

```bash
# Frontend: Create .env (if needed for API endpoints)
cp .env.example .env.local

# Backend: Configure environment
cp backend/.env.example backend/.env
```

**Backend `.env` variables:**
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/northstar

# AI Services
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# JWT
JWT_SECRET=your-secret-key-change-in-production

# Email (for reports)
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@northstar.app

# AWS (for backups)
AWS_S3_BUCKET=northstar-backups
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# OneSignal (for push)
ONESIGNAL_APP_ID=...
ONESIGNAL_REST_API_KEY=...
```

### 3. Run Locally

```bash
# Development mode (frontend + backend)
npm start

# Or separately:
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd backend && npm run dev
```

**Access Points:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- API Docs: http://localhost:5000/api/docs

### 4. First Steps

1. Create account and set up profile
2. Select wellness pillars to track
3. Create your first habit
4. Log daily check-ins
5. View AI insights and recommendations

---

## 💻 Development

### Frontend Development

```bash
# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Backend Development

```bash
cd backend

# Start with auto-reload
npm run dev

# Run tests
npm test
```

### Code Organization

**AI Prompts:**
All prompts are centralized in `src/ai/prompts/`:
```
src/ai/prompts/
├── index.js             # Re-exports
├── reflectionPrompts.js # Journaling prompts
├── insightPrompts.js    # Analytics prompts
├── goalPrompts.js       # Goal-setting prompts
├── journalPrompts.js    # Journal guidance
└── meditationPrompts.js # Meditation scripts
```

Use prompts in components:
```javascript
import { reflectionPrompts } from '@/ai/prompts';

const prompt = reflectionPrompts.generate('daily');
```

---

## 🧪 Testing

### Frontend Tests

```bash
# Run all frontend tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

### Stress Testing AI Endpoints

```bash
cd backend

# Run AI endpoint stress tests with k6
k6 run tests/load/ai-endpoints.js

# Or with options
k6 run -u 100 -d 60s tests/load/ai-endpoints.js
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflows

**Frontend Tests** (`.github/workflows/frontend-tests.yml`)
- Runs on every PR and push to main
- ESLint, unit tests, build verification
- Coverage reports

**Backend Tests** (`.github/workflows/backend-tests.yml`)
- Unit tests for API endpoints
- AI agent functionality tests
- Database integration tests
- Stress tests for AI endpoints (k6)

**Deployment** (`.github/workflows/deploy.yml`)
- Automatic deployment to production on merge to main
- Docker build and push
- Health checks
- Rollback on failure

### Running Locally

```bash
# Simulate GitHub Actions locally
act -j frontend-tests
act -j backend-tests
```

---

## 📊 API Documentation

### Base URL
```
Development: http://localhost:5000/api
Production: https://api.northstar.app/api
```

### Authentication
All endpoints (except `/auth/signup`, `/auth/login`) require JWT:
```
Authorization: Bearer {token}
```

### Key Endpoints

#### Habits
```
GET    /api/habits              # List user habits
POST   /api/habits              # Create habit
PUT    /api/habits/:id          # Update habit
DELETE /api/habits/:id          # Delete habit
POST   /api/habits/:id/complete # Log completion
```

#### AI Coaching
```
POST   /api/ai/insights         # Get personalized insights
POST   /api/ai/coach/message    # Get coach message
POST   /api/ai/meditation       # Generate meditation
POST   /api/ai/journal          # Generate journal prompt
```

#### Pillars
```
GET    /api/pillars             # Get pillar scores
POST   /api/pillars/:name/checkin # Daily check-in
GET    /api/pillars/:name/history # Pillar history
```

#### Community
```
GET    /api/friends             # List friends
POST   /api/friends/:userId     # Add friend
POST   /api/challenges          # Create challenge
GET    /api/leaderboard         # Get rankings
```

---

## 🚢 Deployment

### Deploy to Fly.io

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
flyctl auth login

# Deploy
flyctl deploy

# View logs
flyctl logs
```

### Environment Variables

Set in Fly dashboard:
```bash
flyctl secrets set MONGODB_URI=...
flyctl secrets set OPENAI_API_KEY=...
flyctl secrets set JWT_SECRET=...
# ... other secrets
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

### 1. Create a Branch
```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes
- Follow existing code style
- Add tests for new features
- Update documentation

### 3. Run Tests
```bash
npm test
npm run lint
npm run build
```

### 4. Submit PR
- Clear description of changes
- Link to related issues
- Screenshots for UI changes

---

## 📚 Documentation

- [Architecture Guide](./docs/ARCHITECTURE.md)
- [AI System Overview](./backend/AI_INTEGRATION_GUIDE.md)
- [Testing Guide](./docs/TESTING.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Security Guide](./backend/SECURITY_README.md)

---

## 🐛 Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Find process on port 5000
lsof -i :5000
# Kill it
kill -9 <PID>
```

**MongoDB connection failed:**
```bash
# Check MongoDB is running
mongod --version

# Start MongoDB (macOS)
brew services start mongodb-community

# Or use MongoDB Atlas cloud
```

**AI API rate limit:**
- Check quota in OpenAI/Anthropic dashboard
- Implement exponential backoff (already done)
- Consider batching requests

**Build failing:**
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📈 Performance Targets

- **Frontend**: Lighthouse score >95
- **Backend**: API response <200ms
- **Database**: Query avg <50ms
- **AI**: Response time <5s (with streaming)

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

---

## 📞 Support

- **Issues**: GitHub Issues for bugs
- **Discussions**: GitHub Discussions for questions
- **Email**: support@northstar.app

---

<div align="center">

**Made with ❤️ by the NorthStar Team**

[GitHub](https://github.com/dave20101020-maker/NorthStar-BETA) • [Twitter](https://twitter.com/northstar_app)

</div>