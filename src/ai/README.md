# AI Components Directory

## Purpose

This directory contains all AI-powered React components for the Project internal application. These components provide intelligent, personalized interactions powered by OpenAI's GPT-4-turbo model.

## What Belongs Here

**✅ Components that should live in `/src/ai`:**
- Components that make direct calls to AI endpoints (`/api/ai/*`)
- Components that display AI-generated content (insights, recommendations, coaching messages)
- Components that provide AI-driven user interactions (guided journals, tours, prompts)
- Loading states and overlays specific to AI processing
- Interactive AI coaching interfaces

**❌ What does NOT belong here:**
- General UI components (use `/src/components`)
- API client functions (use `/src/api`)
- Utility functions for data processing (use `/src/utils`)
- Non-AI features (analytics, forms, navigation)

## Architecture Expectations

### 1. Component Structure

Each AI component should follow this pattern:

```jsx
import { useState } from 'react';
import { api } from '@/api/client';
import AIThinkingOverlay from './AIThinkingOverlay';

export default function AIComponentName({ moduleId, userId, onComplete }) {
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [error, setError] = useState(null);

  const fetchAIData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/api/ai/endpoint', {
        moduleId,
        userId,
        // ... other context
      });
      
      setAiResponse(response.data);
    } catch (err) {
      setError(err.message);
      console.error('AI request failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <AIThinkingOverlay isVisible={loading} />
      {error && <div className="error">{error}</div>}
      {aiResponse && <div>{/* Render AI content */}</div>}
    </div>
  );
}
```

### 2. Error Handling

All AI components **must** handle:
- Network failures (API down, timeout)
- Rate limiting (20 requests per 15 minutes)
- Invalid responses (malformed JSON, unexpected structure)
- User context missing (unauthenticated users)

### 3. Loading States

Always show visual feedback during AI processing:
- Use `<AIThinkingOverlay />` for full-screen operations
- Use local spinners for inline AI content
- Show progress indicators for multi-step AI processes
- Display "Thinking..." or similar messaging

### 4. Caching Strategy

AI responses should be cached when appropriate:
- Use React Query for automatic caching (5 min default)
- Cache insights/recommendations by module ID + date
- Invalidate cache when user data changes significantly
- Consider localStorage for expensive AI computations

## Current Components

### `AIContentButtons.jsx`
**Purpose:** Interactive buttons for triggering AI content generation  
**Usage:** Place near content areas where users can request AI assistance  
**Props:**
- `moduleId` - Target module for AI context
- `onGenerate` - Callback when AI content is ready
- `loading` - External loading state
- `variant` - Button style ('primary', 'secondary', 'ghost')

**Example:**
```jsx
import AIContentButtons from '@/ai/AIContentButtons';

function ModulePage({ moduleId }) {
  const handleGenerate = async (type) => {
    // type: 'insights' | 'plan' | 'recommendations'
    console.log(`Generating ${type} for ${moduleId}`);
  };

  return (
    <div>
      <h1>Mental Health</h1>
      <AIContentButtons 
        moduleId={moduleId}
        onGenerate={handleGenerate}
      />
    </div>
  );
}
```

### `AIInsights.jsx`
**Purpose:** Displays AI-generated insights and recommendations  
**Usage:** Dashboard, module pages, analytics views  
**Props:**
- `moduleName` - Name of the module
- `score` - Current module score (0-100)
- `insights` - Pre-fetched insights object
- `loading` - Loading state

**Data Source:** `GET /api/ai/insights/:moduleId`

**Example:**
```jsx
import AIInsights from '@/ai/AIInsights';
import { useQuery } from '@tanstack/react-query';

function Dashboard({ user }) {
  const { data: insights, isLoading } = useQuery({
    queryKey: ['aiInsights', user.id],
    queryFn: () => api.get(`/api/ai/insights/mental_health`),
    staleTime: 5 * 60 * 1000 // 5 min cache
  });

  return (
    <AIInsights 
      moduleName="Mental Health"
      score={75}
      insights={insights}
      loading={isLoading}
    />
  );
}
```

### `AIThinkingOverlay.jsx`
**Purpose:** Full-screen loading overlay for AI processing  
**Usage:** Wrap AI-dependent components or show during async operations  
**Props:**
- `isVisible` - Boolean to control visibility
- `message` - Custom message (default: "Analyzing your data...")
- `progress` - Optional progress percentage (0-100)

**Example:**
```jsx
import AIThinkingOverlay from '@/ai/AIThinkingOverlay';

function MyComponent() {
  const [processing, setProcessing] = useState(false);

  return (
    <>
      <AIThinkingOverlay 
        isVisible={processing}
        message="Generating personalized plan..."
        progress={45}
      />
      <button onClick={async () => {
        setProcessing(true);
        await generateAIPlan();
        setProcessing(false);
      }}>
        Generate Plan
      </button>
    </>
  );
}
```

### `GuidedJournal.jsx`
**Purpose:** AI-powered journaling with dynamic prompts  
**Usage:** Mental health module, daily check-ins  
**Props:**
- `moduleId` - Context for prompt generation
- `onSave` - Callback when entry is saved
- `initialEntry` - Pre-populated entry (for editing)

**Features:**
- CBT-based reflective questions
- Dynamic prompts based on user's current state
- Auto-save drafts to localStorage
- Integration with `/api/entries`

**Example:**
```jsx
import GuidedJournal from '@/ai/GuidedJournal';

function JournalPage() {
  const handleSave = async (entry) => {
    await api.post('/api/entries', {
      module: 'mental_health',
      content: entry.text,
      mood: entry.mood
    });
  };

  return (
    <GuidedJournal 
      moduleId="mental_health"
      onSave={handleSave}
    />
  );
}
```

### `GuidedTour.jsx`
**Purpose:** Interactive onboarding with AI explanations  
**Usage:** First-time user experience, feature announcements  
**Props:**
- `steps` - Array of tour steps
- `onComplete` - Callback when tour finishes
- `skipEnabled` - Allow users to skip (default: true)

**Features:**
- Step-by-step walkthrough
- Contextual AI explanations
- Progress tracking
- Skip/restart options

**Example:**
```jsx
import GuidedTour from '@/ai/GuidedTour';

function App() {
  const [showTour, setShowTour] = useState(!user.tour_completed);

  const handleComplete = async () => {
    await api.patch('/api/users/me', { tour_completed: true });
    setShowTour(false);
  };

  return (
    <>
      {showTour && (
        <GuidedTour 
          onComplete={handleComplete}
          onSkip={() => setShowTour(false)}
        />
      )}
      {/* App content */}
    </>
  );
}
```

## How to Call AI Modules

### Method 1: Direct Import (Recommended)

```jsx
import AIInsights from '@/ai/AIInsights';

function MyPage() {
  return <AIInsights moduleName="Sleep" score={80} />;
}
```

### Method 2: Through API Client

For custom AI interactions, use the API client:

```jsx
import { api } from '@/api/client';

async function getCustomAIRecommendation(moduleId, userContext) {
  try {
    const response = await api.post('/api/ai/coach', {
      prompt: 'Recommend 3 specific actions for improving sleep',
      moduleId,
      userContext: {
        score: userContext.score,
        recentEntries: userContext.recentEntries
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('AI request failed:', error);
    throw error;
  }
}
```

### Method 3: With React Query (Best for Caching)

```jsx
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';

function useAIInsights(moduleId) {
  return useQuery({
    queryKey: ['aiInsights', moduleId],
    queryFn: () => api.get(`/api/ai/insights/${moduleId}`),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    onError: (error) => {
      console.error('Failed to fetch AI insights:', error);
    }
  });
}

// Usage in component
function MyComponent() {
  const { data, isLoading, error } = useAIInsights('mental_health');
  
  if (isLoading) return <AIThinkingOverlay isVisible={true} />;
  if (error) return <div>Failed to load insights</div>;
  
  return <AIInsights insights={data} />;
}
```

## Backend Integration

All AI components communicate with:

- **Base Route:** `/api/ai/*`
- **Controller:** `backend/controllers/aiController.js`
- **AI Provider:** OpenAI GPT-4-turbo (configured in `backend/server.js`)
- **Response Format:** JSON with structured coaching messages

### Available Endpoints

```
POST /api/ai/coach
POST /api/ai/insights/:moduleId
POST /api/ai/journal-prompt
POST /api/ai/action-plan
GET  /api/ai/quick-tip/:moduleId
```

### Rate Limiting

- **Limit:** 20 requests per 15 minutes per user
- **Scope:** Applied at user level (via JWT token)
- **Response on exceed:** `429 Too Many Requests`

### Authentication

All AI endpoints require authentication:
- JWT token in httpOnly cookie (`ns_token`)
- Or `Authorization: Bearer <token>` header

## Best Practices

### 1. User Experience
- Always show loading states during AI processing
- Provide fallback content if AI fails
- Allow users to retry failed AI requests
- Cache responses to reduce API calls

### 2. Error Messages
```jsx
// ❌ Bad: Generic error
setError('Something went wrong');

// ✅ Good: Actionable error
setError('Our AI is temporarily unavailable. Please try again in a moment.');
```

### 3. Context Passing
Always pass relevant user context to AI:
```jsx
const aiContext = {
  userId: user.id,
  moduleId: 'mental_health',
  currentScore: 75,
  recentEntries: entries.slice(0, 7), // Last 7 days
  timeOfDay: new Date().getHours() < 12 ? 'morning' : 'evening'
};
```

### 4. Performance
- Debounce AI requests triggered by user input
- Use React Query for automatic caching
- Prefetch AI insights for likely next pages
- Monitor OpenAI token usage in production

## Testing AI Components

```jsx
// Mock AI responses in tests
import { vi } from 'vitest';

vi.mock('@/api/client', () => ({
  api: {
    post: vi.fn().mockResolvedValue({
      data: { insights: ['Get 7-8 hours of sleep'], confidence: 0.9 }
    })
  }
}));

test('AIInsights renders AI response', async () => {
  render(<AIInsights moduleId="sleep" />);
  await waitFor(() => {
    expect(screen.getByText(/Get 7-8 hours/)).toBeInTheDocument();
  });
});
```

## Future Enhancements

- [ ] Voice input for journal entries
- [ ] Real-time AI chat interface
- [ ] Sentiment analysis for mood tracking
- [ ] Wearable device integration for context
- [ ] Multi-language support
- [ ] Offline AI caching for core features

## Troubleshooting

### "AI request failed with 429"
**Cause:** Rate limit exceeded (20 req/15 min)  
**Solution:** Implement caching or reduce request frequency

### "Timeout waiting for AI response"
**Cause:** OpenAI API slow or network issues  
**Solution:** Increase timeout, show retry button

### "Invalid AI response format"
**Cause:** Unexpected JSON structure from backend  
**Solution:** Check backend controller, validate response schema

---

**Questions?** Check the main project docs in `/ARCHITECTURE.md` or ask in the team chat.
