import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * User Store
 *
 * Manages authenticated user state, profile data, subscription info,
 * and authentication flow.
 *
 * Uses Zustand with localStorage persistence for maintaining
 * user session across page refreshes.
 */

const useUserStore = create(
  persist(
    (set, get) => ({
      // ==================== AUTH STATE ====================
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // User profile data
      user: null,
      /*
      Example user structure:
      {
        id: "user_123",
        email: "user@example.com",
        name: "John Doe",
        full_name: "John Doe",
        username: "johndoe",
        emailVerified: true,
        avatar: "https://...",
        createdAt: "2024-01-01T00:00:00Z",
        lastLoginAt: "2024-12-02T00:00:00Z",
        
        // Subscription
        subscriptionTier: "premium", // "free" | "basic" | "premium" | "nhs_referred"
        allowedPillars: ["sleep", "diet", ...], // Array of accessible pillars
        subscriptionStatus: "active", // "active" | "trial" | "expired"
        trialEndDate: "2024-12-15T00:00:00Z",
        
        // Gamification
        points: 1250,
        level: 5,
        badges: ["early_bird", "7_day_streak", "all_pillars"],
        current_streak: 14,
        longest_streak: 30,
        total_check_ins: 120,
        
        // Preferences
        settings: {
          notifications: {
            email: true,
            push: false,
            sms: false,
            frequency: "daily",
            quietHours: { start: "22:00", end: "08:00" }
          },
          privacy: {
            profileVisibility: "private",
            activitySharing: false,
            allowFriendRequests: true
          },
          preferences: {
            theme: "dark",
            language: "en",
            timezone: "America/New_York",
            measurementSystem: "metric"
          },
          aiCoaching: {
            enabled: true,
            frequency: "daily",
            focusAreas: ["sleep", "mental_health"]
          }
        },
        
        // Onboarding
        onboarding_completed: true,
        tour_completed: true,
        selected_pillars: ["sleep", "diet", "exercise"],
        
        // Streak management
        streak_freezes_available: 3,
        freeze_reset_month: 11,
        last_celebrated_milestone: 7,
        streak_milestones_awarded: {
          "pillar_sleep_2024-12-01": true
        }
      }
      */

      // ==================== AUTH ACTIONS ====================

      // Set user and mark as authenticated
      setUser: (userData) =>
        set({
          user: userData,
          isAuthenticated: true,
          error: null,
        }),

      // Update user profile fields
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      // Update specific user settings
      updateUserSettings: (settingPath, value) =>
        set((state) => {
          if (!state.user) return state;

          const pathParts = settingPath.split(".");
          const newSettings = { ...state.user.settings };

          let current = newSettings;
          for (let i = 0; i < pathParts.length - 1; i++) {
            current[pathParts[i]] = { ...current[pathParts[i]] };
            current = current[pathParts[i]];
          }
          current[pathParts[pathParts.length - 1]] = value;

          return {
            user: {
              ...state.user,
              settings: newSettings,
            },
          };
        }),

      // Login action
      login: async (credentials) => {
        set({ isLoading: true, error: null });

        try {
          // Call your API here
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credentials),
            credentials: "include", // Include cookies
          });

          if (!response.ok) {
            throw new Error("Login failed");
          }

          const data = await response.json();

          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return { success: true };
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
            isAuthenticated: false,
          });
          return { success: false, error: error.message };
        }
      },

      // Register action
      register: async (userData) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
            credentials: "include",
          });

          if (!response.ok) {
            throw new Error("Registration failed");
          }

          const data = await response.json();

          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return { success: true };
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
          });
          return { success: false, error: error.message };
        }
      },

      // Logout action
      logout: async () => {
        set({ isLoading: true });

        try {
          await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "include",
          });

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });

          return { success: true };
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
          });
          return { success: false, error: error.message };
        }
      },

      // Refresh user data
      refreshUser: async () => {
        set({ isLoading: true });

        try {
          const response = await fetch("/api/users/me", {
            credentials: "include",
          });

          if (!response.ok) {
            throw new Error("Failed to fetch user");
          }

          const data = await response.json();

          set({
            user: data.user || data,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return { success: true };
        } catch (error) {
          set({
            isLoading: false,
            error: error.message,
          });
          return { success: false, error: error.message };
        }
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Clear user session (logout without API call)
      clearSession: () =>
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        }),

      // ==================== SUBSCRIPTION HELPERS ====================

      // Check if user has premium access
      isPremium: () => {
        const user = get().user;
        return (
          user?.subscriptionTier === "premium" &&
          user?.subscriptionStatus === "active"
        );
      },

      // Check if user is on trial
      isTrial: () => {
        const user = get().user;
        return (
          user?.subscriptionTier === "trial" &&
          user?.subscriptionStatus === "trial"
        );
      },

      // Check if user has access to a specific pillar
      hasAccessToPillar: (pillarId) => {
        const user = get().user;
        if (!user) return false;

        // Premium/trial users have access to all pillars
        if (get().isPremium() || get().isTrial()) return true;

        // Otherwise check allowedPillars array
        return user.allowedPillars?.includes(pillarId) || false;
      },

      // Get accessible pillars
      getAccessiblePillars: () => {
        const user = get().user;
        if (!user) return [];

        if (get().isPremium() || get().isTrial()) {
          return [
            "sleep",
            "diet",
            "exercise",
            "physical_health",
            "mental_health",
            "finances",
            "social",
            "spirituality",
          ];
        }

        return user.allowedPillars || user.selected_pillars || [];
      },

      // ==================== GAMIFICATION HELPERS ====================

      // Add points
      addPoints: (points) =>
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                points: (state.user.points || 0) + points,
              }
            : null,
        })),

      // Add badge
      addBadge: (badgeId) =>
        set((state) => {
          if (!state.user) return state;

          const currentBadges = state.user.badges || [];
          if (currentBadges.includes(badgeId)) return state;

          return {
            user: {
              ...state.user,
              badges: [...currentBadges, badgeId],
            },
          };
        }),

      // Update streak
      updateStreak: (currentStreak, longestStreak) =>
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                current_streak: currentStreak,
                longest_streak: Math.max(longestStreak || 0, currentStreak),
              }
            : null,
        })),

      // Increment total check-ins
      incrementCheckIns: () =>
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                total_check_ins: (state.user.total_check_ins || 0) + 1,
              }
            : null,
        })),

      // ==================== PERSISTENCE ====================

      // Check if user session is expired
      isSessionExpired: () => {
        const user = get().user;
        if (!user?.lastLoginAt) return false;

        const lastLogin = new Date(user.lastLoginAt);
        const now = new Date();
        const daysSinceLogin = (now - lastLogin) / (1000 * 60 * 60 * 24);

        return daysSinceLogin > 30; // 30-day session expiry
      },
    }),
    {
      name: "northstar-user-storage", // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist these parts
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // Don't persist loading or error states
      }),
    }
  )
);

export default useUserStore;

// ==================== USAGE EXAMPLES ====================

/**
 * Example 1: Login flow
 *
 * import useUserStore from '@/store/useUserStore';
 *
 * function LoginForm() {
 *   const { login, isLoading, error } = useUserStore();
 *
 *   const handleSubmit = async (e) => {
 *     e.preventDefault();
 *     const result = await login({
 *       email: e.target.email.value,
 *       password: e.target.password.value
 *     });
 *
 *     if (result.success) {
 *       navigate('/dashboard');
 *     }
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <input name="email" type="email" />
 *       <input name="password" type="password" />
 *       <button disabled={isLoading}>
 *         {isLoading ? 'Logging in...' : 'Login'}
 *       </button>
 *       {error && <div className="error">{error}</div>}
 *     </form>
 *   );
 * }
 */

/**
 * Example 2: Protected route
 *
 * import useUserStore from '@/store/useUserStore';
 * import { Navigate } from 'react-router-dom';
 *
 * function ProtectedRoute({ children }) {
 *   const isAuthenticated = useUserStore((state) => state.isAuthenticated);
 *
 *   if (!isAuthenticated) {
 *     return <Navigate to="/sign-in" />;
 *   }
 *
 *   return children;
 * }
 */

/**
 * Example 3: User profile display
 *
 * import useUserStore from '@/store/useUserStore';
 *
 * function UserProfile() {
 *   const user = useUserStore((state) => state.user);
 *   const updateUser = useUserStore((state) => state.updateUser);
 *
 *   if (!user) return null;
 *
 *   return (
 *     <div>
 *       <h2>{user.name}</h2>
 *       <p>Level: {user.level}</p>
 *       <p>Points: {user.points}</p>
 *       <p>Streak: {user.current_streak} days 🔥</p>
 *       <div>
 *         Badges: {user.badges?.map(badge => (
 *           <span key={badge}>{badge}</span>
 *         ))}
 *       </div>
 *     </div>
 *   );
 * }
 */

/**
 * Example 4: Subscription check
 *
 * import useUserStore from '@/store/useUserStore';
 *
 * function PillarCard({ pillarId }) {
 *   const hasAccess = useUserStore((state) => state.hasAccessToPillar(pillarId));
 *   const isPremium = useUserStore((state) => state.isPremium());
 *
 *   if (!hasAccess) {
 *     return (
 *       <div className="locked">
 *         <h3>Upgrade to unlock this pillar</h3>
 *         <Link to="/pricing">View Plans</Link>
 *       </div>
 *     );
 *   }
 *
 *   return <div>Access granted!</div>;
 * }
 */

/**
 * Example 5: User settings
 *
 * import useUserStore from '@/store/useUserStore';
 *
 * function SettingsPage() {
 *   const user = useUserStore((state) => state.user);
 *   const updateUserSettings = useUserStore((state) => state.updateUserSettings);
 *
 *   const handleToggleNotifications = () => {
 *     updateUserSettings('notifications.email', !user.settings.notifications.email);
 *   };
 *
 *   return (
 *     <div>
 *       <label>
 *         <input
 *           type="checkbox"
 *           checked={user?.settings?.notifications?.email}
 *           onChange={handleToggleNotifications}
 *         />
 *         Email Notifications
 *       </label>
 *     </div>
 *   );
 * }
 */

/**
 * Example 6: Gamification
 *
 * import useUserStore from '@/store/useUserStore';
 *
 * function CompleteTaskButton() {
 *   const addPoints = useUserStore((state) => state.addPoints);
 *   const addBadge = useUserStore((state) => state.addBadge);
 *   const incrementCheckIns = useUserStore((state) => state.incrementCheckIns);
 *
 *   const handleComplete = () => {
 *     addPoints(50);
 *     incrementCheckIns();
 *
 *     // Award badge if milestone reached
 *     const user = useUserStore.getState().user;
 *     if (user.total_check_ins === 7) {
 *       addBadge('7_day_streak');
 *     }
 *   };
 *
 *   return <button onClick={handleComplete}>Complete Check-in</button>;
 * }
 */

/**
 * Example 7: Combining stores
 *
 * import useUserStore from '@/store/useUserStore';
 * import useAppStore from '@/store/useAppStore';
 *
 * function Dashboard() {
 *   const user = useUserStore((state) => state.user);
 *   const accessiblePillars = useUserStore((state) => state.getAccessiblePillars());
 *   const pillarScores = useAppStore((state) => state.pillarScores);
 *
 *   const accessibleScores = accessiblePillars.reduce((acc, pillarId) => {
 *     acc[pillarId] = pillarScores[pillarId];
 *     return acc;
 *   }, {});
 *
 *   return (
 *     <div>
 *       <h1>Welcome, {user?.name}!</h1>
 *       {Object.entries(accessibleScores).map(([pillarId, score]) => (
 *         <div key={pillarId}>{pillarId}: {score}</div>
 *       ))}
 *     </div>
 *   );
 * }
 */
