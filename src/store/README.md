# Project State Management

This directory contains Zustand stores for global state management.

## Stores

### `useAppStore.js`
Application-wide state including:
- Pillar scores (all 8 pillars: 0-100)
- Onboarding progress and responses
- UI state (sidebar, theme, notifications, modals)
- Computed values (life score, accessible pillars)

### `useUserStore.js`
User authentication and profile state:
- Auth state (isAuthenticated, user data)
- Login/register/logout actions
- Subscription management (tier, allowed pillars)
- Gamification (points, badges, streaks)
- User settings and preferences

## Quick Start

```jsx
import useAppStore from '@/store/useAppStore';
import useUserStore from '@/store/useUserStore';

function MyComponent() {
  // Read state
  const pillarScore = useAppStore((state) => state.pillarScores.sleep);
  const user = useUserStore((state) => state.user);
  
  // Get actions
  const setPillarScore = useAppStore((state) => state.setPillarScore);
  const login = useUserStore((state) => state.login);
  
  // Use them
  return (
    <div>
      <p>Sleep score: {pillarScore}</p>
      <p>Welcome, {user?.name}</p>
    </div>
  );
}
```

## Persistence

Both stores use localStorage persistence:
- `useAppStore`: Saves pillar scores, onboarding progress, UI theme
- `useUserStore`: Saves user profile and auth state

Data persists across page refreshes and browser sessions.

## Best Practices

1. **Select only what you need** to avoid unnecessary re-renders:
   ```jsx
   // ❌ Bad: Component re-renders on any state change
   const state = useAppStore();
   
   // ✅ Good: Only re-renders when pillarScores changes
   const pillarScores = useAppStore((state) => state.pillarScores);
   ```

2. **Use actions for updates**:
   ```jsx
   // ❌ Bad: Direct state mutation (won't work)
   state.pillarScores.sleep = 75;
   
   // ✅ Good: Use provided actions
   setPillarScore('sleep', 75);
   ```

3. **Combine stores when needed**:
   ```jsx
   const accessiblePillars = useUserStore((state) => state.getAccessiblePillars());
   const scores = useAppStore((state) => state.pillarScores);
   
   const myScores = accessiblePillars.reduce((acc, pillarId) => {
     acc[pillarId] = scores[pillarId];
     return acc;
   }, {});
   ```

See individual store files for detailed usage examples.
