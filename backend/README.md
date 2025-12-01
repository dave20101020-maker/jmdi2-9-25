# NorthStar Backend - AI Agent Endpoints

A Node.js/Express backend for the NorthStar wellness app featuring AI-powered agents using OpenAI's API.

## Features

- **Coach Agent** - Personalized wellness coaching
- **Daily Plan Agent** - Structured daily planning and task management
- **Pillar Analysis Agent** - Holistic wellness analysis across 8 life pillars
- **Weekly Reflection Agent** - Reflective insights and goal setting

## Installation

### Prerequisites

- Node.js 16+ 
- npm or yarn
- OpenAI API key

### Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```

3. **Add your OpenAI API key:**
   ```
   OPENAI_API_KEY=sk-...your-key-here...
   ```

4. **Start the server:**
   ```bash
   # Development with auto-reload
   npm run dev

   # Production
   npm start
   ```

The backend will start on `http://localhost:5000`

## API Endpoints

### Health Check
- `GET /health` - Server status

### AI Agents

#### 1. Coach Agent
```
POST /api/ai/coach
```
Provides personalized coaching and motivation.

**Request Body:**
```json
{
  "prompt": "I'm struggling with my morning routine",
  "userContext": {
    "sleepScore": 65,
    "currentGoals": ["improve sleep", "build habits"]
  },
  "pillarFocus": "sleep"
}
```

**Response:**
```json
{
  "success": true,
  "agent": "coach",
  "timestamp": "2024-12-01T10:30:00.000Z",
  "data": {
    "coaching": "...",
    "encouragement": "...",
    "actionItems": [...],
    "nextSteps": "..."
  }
}
```

---

#### 2. Daily Plan Agent
```
POST /api/ai/daily-plan
```
Creates structured daily plans with task prioritization.

**Request Body:**
```json
{
  "prompt": "I want to focus on sleep, diet, and exercise today",
  "userGoals": ["8 hours sleep", "3 meals", "30 min workout"],
  "timeAvailable": 16
}
```

**Response:**
```json
{
  "success": true,
  "agent": "dailyPlan",
  "timestamp": "2024-12-01T10:30:00.000Z",
  "data": {
    "morningRoutine": [...],
    "mainTasks": [...],
    "eveningRoutine": [...],
    "estimatedTime": 16,
    "energyManagement": "..."
  }
}
```

---

#### 3. Pillar Analysis Agent
```
POST /api/ai/pillar-analysis
```
Analyzes wellness across the 8 life pillars.

**Request Body:**
```json
{
  "prompt": "I want to improve my overall wellness",
  "currentScores": {
    "sleep": 65,
    "diet": 70,
    "exercise": 55,
    "physical_health": 60,
    "mental_health": 75,
    "finances": 80,
    "social": 70,
    "spirituality": 65
  },
  "focusAreas": ["exercise", "physical_health"]
}
```

**Response:**
```json
{
  "success": true,
  "agent": "pillarAnalysis",
  "timestamp": "2024-12-01T10:30:00.000Z",
  "data": {
    "pillarAnalysis": {
      "sleep": "...",
      "diet": "...",
      // ... 8 pillars total
    },
    "recommendations": [...],
    "strengths": [...],
    "improvements": [...]
  }
}
```

---

#### 4. Weekly Reflection Agent
```
POST /api/ai/weekly-reflection
```
Generates comprehensive weekly reflections and insights.

**Request Body:**
```json
{
  "prompt": "Reflect on my week and help me plan next week",
  "weeklyData": {
    "daysActive": 6,
    "totalWorkouts": 4,
    "moodAverage": 7.5
  },
  "pillarScores": {
    "sleep": 70,
    "diet": 75,
    "exercise": 65,
    "physical_health": 70,
    "mental_health": 80,
    "finances": 75,
    "social": 70,
    "spirituality": 68
  }
}
```

**Response:**
```json
{
  "success": true,
  "agent": "weeklyReflection",
  "timestamp": "2024-12-01T10:30:00.000Z",
  "data": {
    "weeklyInsights": "...",
    "keyAccomplishments": [...],
    "lessonsLearned": [...],
    "nextWeekGoals": [...],
    "motivationalMessage": "..."
  }
}
```

## Project Structure

```
backend/
├── controllers/
│   └── aiController.js      # AI agent implementations
├── routes/
│   └── ai.js                # AI endpoint routes
├── server.js                # Main Express app
├── package.json             # Dependencies
├── .env.example             # Environment variable template
└── README.md                # This file
```

## Environment Variables

```env
PORT=5000                           # Server port
NODE_ENV=development               # Environment
OPENAI_API_KEY=sk-...             # OpenAI API key
CORS_ORIGIN=http://localhost:5173  # CORS origin for frontend
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

## Development

### Running with nodemon (auto-reload):
```bash
npm run dev
```

### Testing endpoints locally:
```bash
# Coach endpoint
curl -X POST http://localhost:5000/api/ai/coach \
  -H "Content-Type: application/json" \
  -d '{"prompt":"I need coaching on my sleep habits"}'

# Daily plan endpoint
curl -X POST http://localhost:5000/api/ai/daily-plan \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Create a productive day plan"}'
```

## Deployment

### Docker (optional)
Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Environment Setup for Production
- Set `NODE_ENV=production`
- Use a secure method to store `OPENAI_API_KEY` (env vars, secrets manager)
- Configure `CORS_ORIGIN` for your production domain
- Use a process manager (PM2) or container orchestration (Docker, Kubernetes)

## Dependencies

- **express** - Web framework
- **cors** - Cross-Origin Resource Sharing
- **dotenv** - Environment variable management
- **openai** - OpenAI API client
- **morgan** - HTTP request logger

## License

MIT

## Support

For issues or questions, refer to the main NorthStar project documentation.
