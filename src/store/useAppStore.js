import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Global App Store
 * 
 * Manages application-wide state including pillar scores,
 * onboarding progress, UI state, and global settings.
 * 
 * Uses Zustand with localStorage persistence for cross-session state.
 */

const useAppStore = create(
  persist(
    (set, get) => ({
      // ==================== PILLAR SCORES ====================
      pillarScores: {
        sleep: 0,
        diet: 0,
        exercise: 0,
        physical_health: 0,
        mental_health: 0,
        finances: 0,
        social: 0,
        spirituality: 0,
      },

      // Update a single pillar score
      setPillarScore: (pillarId, score) => 
        set((state) => ({
          pillarScores: {
            ...state.pillarScores,
            [pillarId]: Math.max(0, Math.min(100, score)), // Clamp 0-100
          },
        })),

      // Update multiple pillar scores at once
      setPillarScores: (scores) => 
        set((state) => ({
          pillarScores: {
            ...state.pillarScores,
            ...scores,
          },
        })),

      // Reset all pillar scores to 0
      resetPillarScores: () =>
        set({
          pillarScores: {
            sleep: 0,
            diet: 0,
            exercise: 0,
            physical_health: 0,
            mental_health: 0,
            finances: 0,
            social: 0,
            spirituality: 0,
          },
        }),

      // Get life score (average of all pillars)
      getLifeScore: () => {
        const scores = Object.values(get().pillarScores);
        const total = scores.reduce((sum, score) => sum + score, 0);
        return Math.round(total / scores.length);
      },

      // Get accessible pillars based on subscription
      getAccessiblePillarScores: (allowedPillars) => {
        const allScores = get().pillarScores;
        if (!allowedPillars || allowedPillars.length === 0) {
          return allScores;
        }
        
        return allowedPillars.reduce((acc, pillarId) => {
          acc[pillarId] = allScores[pillarId] || 0;
          return acc;
        }, {});
      },

      // ==================== ONBOARDING PROGRESS ====================
      onboarding: {
        isComplete: false,
        currentStep: 0,
        totalSteps: 8, // One step per pillar
        responses: {}, // Stores user responses by question ID
        pillarBaselines: {}, // Initial scores calculated from onboarding
        startedAt: null,
        completedAt: null,
      },

      // Start onboarding flow
      startOnboarding: () =>
        set((state) => ({
          onboarding: {
            ...state.onboarding,
            currentStep: 0,
            isComplete: false,
            startedAt: new Date().toISOString(),
            completedAt: null,
          },
        })),

      // Move to next onboarding step
      nextOnboardingStep: () =>
        set((state) => ({
          onboarding: {
            ...state.onboarding,
            currentStep: Math.min(
              state.onboarding.currentStep + 1,
              state.onboarding.totalSteps
            ),
          },
        })),

      // Go to previous onboarding step
      prevOnboardingStep: () =>
        set((state) => ({
          onboarding: {
            ...state.onboarding,
            currentStep: Math.max(state.onboarding.currentStep - 1, 0),
          },
        })),

      // Save onboarding response for a question
      setOnboardingResponse: (questionId, value) =>
        set((state) => ({
          onboarding: {
            ...state.onboarding,
            responses: {
              ...state.onboarding.responses,
              [questionId]: value,
            },
          },
        })),

      // Save multiple onboarding responses at once
      setOnboardingResponses: (responses) =>
        set((state) => ({
          onboarding: {
            ...state.onboarding,
            responses: {
              ...state.onboarding.responses,
              ...responses,
            },
          },
        })),

      // Set pillar baseline scores from onboarding
      setPillarBaselines: (baselines) =>
        set((state) => ({
          onboarding: {
            ...state.onboarding,
            pillarBaselines: baselines,
          },
          pillarScores: baselines, // Also update current scores
        })),

      // Complete onboarding
      completeOnboarding: () =>
        set((state) => ({
          onboarding: {
            ...state.onboarding,
            isComplete: true,
            completedAt: new Date().toISOString(),
          },
        })),

      // Reset onboarding (for re-assessment)
      resetOnboarding: () =>
        set({
          onboarding: {
            isComplete: false,
            currentStep: 0,
            totalSteps: 8,
            responses: {},
            pillarBaselines: {},
            startedAt: null,
            completedAt: null,
          },
        }),

      // ==================== UI STATE ====================
      ui: {
        sidebarOpen: true,
        theme: 'dark', // 'light' | 'dark' | 'system'
        notifications: [],
        activeModal: null,
        isLoading: false,
      },

      // Toggle sidebar
      toggleSidebar: () =>
        set((state) => ({
          ui: {
            ...state.ui,
            sidebarOpen: !state.ui.sidebarOpen,
          },
        })),

      // Set sidebar state explicitly
      setSidebarOpen: (isOpen) =>
        set((state) => ({
          ui: {
            ...state.ui,
            sidebarOpen: isOpen,
          },
        })),

      // Set theme
      setTheme: (theme) =>
        set((state) => ({
          ui: {
            ...state.ui,
            theme,
          },
        })),

      // Add notification
      addNotification: (notification) =>
        set((state) => ({
          ui: {
            ...state.ui,
            notifications: [
              ...state.ui.notifications,
              {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                ...notification,
              },
            ],
          },
        })),

      // Remove notification
      removeNotification: (id) =>
        set((state) => ({
          ui: {
            ...state.ui,
            notifications: state.ui.notifications.filter((n) => n.id !== id),
          },
        })),

      // Clear all notifications
      clearNotifications: () =>
        set((state) => ({
          ui: {
            ...state.ui,
            notifications: [],
          },
        })),

      // Set active modal
      setActiveModal: (modalName) =>
        set((state) => ({
          ui: {
            ...state.ui,
            activeModal: modalName,
          },
        })),

      // Close modal
      closeModal: () =>
        set((state) => ({
          ui: {
            ...state.ui,
            activeModal: null,
          },
        })),

      // Set global loading state
      setLoading: (isLoading) =>
        set((state) => ({
          ui: {
            ...state.ui,
            isLoading,
          },
        })),

      // ==================== CACHE & SYNC ====================
      lastSync: null,
      setLastSync: (timestamp) => set({ lastSync: timestamp }),

      // Clear all app data (logout/reset)
      clearAppData: () =>
        set({
          pillarScores: {
            sleep: 0,
            diet: 0,
            exercise: 0,
            physical_health: 0,
            mental_health: 0,
            finances: 0,
            social: 0,
            spirituality: 0,
          },
          onboarding: {
            isComplete: false,
            currentStep: 0,
            totalSteps: 8,
            responses: {},
            pillarBaselines: {},
            startedAt: null,
            completedAt: null,
          },
          ui: {
            sidebarOpen: true,
            theme: 'dark',
            notifications: [],
            activeModal: null,
            isLoading: false,
          },
          lastSync: null,
        }),
    }),
    {
      name: 'northstar-app-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist these parts of the state
        pillarScores: state.pillarScores,
        onboarding: state.onboarding,
        ui: {
          theme: state.ui.theme,
          sidebarOpen: state.ui.sidebarOpen,
        },
        lastSync: state.lastSync,
      }),
    }
  )
);

export default useAppStore;

// ==================== USAGE EXAMPLES ====================

/**
 * Example 1: Reading and updating pillar scores
 * 
 * import useAppStore from '@/store/useAppStore';
 * 
 * function PillarCard({ pillarId }) {
 *   const score = useAppStore((state) => state.pillarScores[pillarId]);
 *   const setPillarScore = useAppStore((state) => state.setPillarScore);
 * 
 *   return (
 *     <div>
 *       <h3>Score: {score}</h3>
 *       <button onClick={() => setPillarScore(pillarId, score + 10)}>
 *         Increase Score
 *       </button>
 *     </div>
 *   );
 * }
 */

/**
 * Example 2: Managing onboarding flow
 * 
 * import useAppStore from '@/store/useAppStore';
 * 
 * function OnboardingWizard() {
 *   const { currentStep, isComplete } = useAppStore((state) => state.onboarding);
 *   const nextStep = useAppStore((state) => state.nextOnboardingStep);
 *   const setResponse = useAppStore((state) => state.setOnboardingResponse);
 * 
 *   const handleAnswer = (questionId, value) => {
 *     setResponse(questionId, value);
 *     nextStep();
 *   };
 * 
 *   if (isComplete) {
 *     return <div>Onboarding complete!</div>;
 *   }
 * 
 *   return <div>Step {currentStep + 1} of 8</div>;
 * }
 */

/**
 * Example 3: Using computed values
 * 
 * import useAppStore from '@/store/useAppStore';
 * 
 * function LifeScoreDisplay() {
 *   const getLifeScore = useAppStore((state) => state.getLifeScore);
 *   const lifeScore = getLifeScore();
 * 
 *   return <h1>Life Score: {lifeScore}/100</h1>;
 * }
 */

/**
 * Example 4: Managing UI state
 * 
 * import useAppStore from '@/store/useAppStore';
 * 
 * function Sidebar() {
 *   const { sidebarOpen, theme } = useAppStore((state) => state.ui);
 *   const toggleSidebar = useAppStore((state) => state.toggleSidebar);
 * 
 *   return (
 *     <aside className={`sidebar ${theme} ${sidebarOpen ? 'open' : 'closed'}`}>
 *       <button onClick={toggleSidebar}>Toggle</button>
 *     </aside>
 *   );
 * }
 */

/**
 * Example 5: Notifications
 * 
 * import useAppStore from '@/store/useAppStore';
 * 
 * function NotificationTrigger() {
 *   const addNotification = useAppStore((state) => state.addNotification);
 * 
 *   const notify = () => {
 *     addNotification({
 *       type: 'success',
 *       message: 'Pillar score updated!',
 *       duration: 3000,
 *     });
 *   };
 * 
 *   return <button onClick={notify}>Show Notification</button>;
 * }
 */
