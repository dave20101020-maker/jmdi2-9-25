import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement, ReactNode } from "react";
import {
  PlanChecklistSchema,
  PlanSchema,
  SmartGoalSchema,
  UserSchema,
  type PlanChecklist,
  type PlanProps,
  type SmartGoalProps,
  type UserProps,
  type PillarIdentifier,
} from "@/models";
import { parseAs } from "@/models/runtime";

const ISO_STRING = "2024-01-01T00:00:00.000Z";
const DATE_ONLY = "2024-01-01";

export const ALL_PILLARS: readonly PillarIdentifier[] = [
  "sleep",
  "diet",
  "exercise",
  "physical_health",
  "mental_health",
  "finances",
  "social",
  "spirituality",
] as const;

type PillarProgress = {
  score: number;
  lastUpdated: string;
  isActive: boolean;
};

const basePillars = ALL_PILLARS.reduce<
  Record<PillarIdentifier, PillarProgress>
>((acc, pillar) => {
  acc[pillar] = {
    score: 80,
    lastUpdated: ISO_STRING,
    isActive: true,
  };
  return acc;
}, {} as Record<PillarIdentifier, PillarProgress>);

const baseSettings = {
  notifications: { email: true, push: false, sms: false },
  privacy: {
    profileVisibility: "friends",
    showActivity: true,
    showStats: true,
  },
  preferences: {
    theme: "dark" as const,
    language: "en",
    timezone: "UTC",
    startOfWeek: "monday" as const,
  },
  coaching: {
    aiCoachEnabled: true,
    coachingFrequency: "weekly" as const,
    focusAreas: [...ALL_PILLARS],
  },
};

const baseUserPayload = {
  id: "user-1",
  name: "Traveler",
  username: "traveler",
  email: "traveler@example.com",
  role: "user" as const,
  subscriptionTier: "premium" as const,
  entitlements: { plan: "premium", features: ["all-pillars"] },
  allowedPillars: [...ALL_PILLARS],
  selectedPillars: ["sleep", "diet"],
  pillars: basePillars,
  settings: baseSettings,
  bio: {
    age: 30,
    activityLevel: "moderate",
    focusAreas: ["sleep", "diet"],
  },
  comb: {
    physicalCapability: { capability: 4, opportunity: 4, motivation: 4 },
    motivation: { capability: 4, opportunity: 4, motivation: 4 },
    opportunity: { capability: 4, opportunity: 4, motivation: 4 },
  },
  currentStreak: 5,
  longestStreak: 10,
  badges: ["day_one"],
  aiConsent: true,
  consentTimestamp: ISO_STRING,
  consentVersion: "v1",
  linkedProviders: [],
  refreshTokens: [],
  isActive: true,
  lastLoginAt: ISO_STRING,
  lastFailedLoginAt: null,
  lastFailedOtpAt: null,
  failedLoginAttempts: 0,
  failedOtpAttempts: 0,
  createdAt: ISO_STRING,
  updatedAt: ISO_STRING,
} as const;

const basePlanChecklistPayload = {
  planTitle: "Restful Nights",
  planDescription: "Improve sleep quality with consistent routines.",
  dailyActions: ["Log bedtime", "Avoid screens after 10pm"],
  weeklyActions: ["Review sleep journal"],
  successMetrics: ["Sleep 8 hours", "Wake refreshed"],
} as const;

const basePlanPayload = {
  id: "plan-1",
  userId: "user-1",
  pillar: "sleep" as PillarIdentifier,
  planTitle: "Rest Better",
  planDescription: "Sleep-focused improvement plan",
  smartGoalIds: [],
  goals: [],
  dailyActions: ["Wind down"],
  weeklyActions: ["Reflect on progress"],
  successMetrics: ["Track energy"],
  linkedGoalsCount: 0,
  completionProgress: 0,
  startDate: DATE_ONLY,
  endDate: undefined,
  isActive: true,
  checklist: basePlanChecklistPayload,
  linkedHabits: [],
  createdAt: ISO_STRING,
  updatedAt: ISO_STRING,
} as const;

const baseSmartGoalPayload = {
  id: "goal-1",
  pillar: "sleep" as PillarIdentifier,
  goalStatement: "Improve sleep quality",
  specific: "Lights out by 10pm",
  measurable: "Track with app",
  achievable: "Yes",
  relevant: "Health",
  timeBound: "30 days",
  linkedPlanId: undefined,
  progress: 20,
  created_by: "traveler@example.com",
  created_date: ISO_STRING,
  updated_date: ISO_STRING,
  checklist: undefined,
} as const;

export function createMockUser(overrides: Partial<UserProps> = {}): UserProps {
  const payload = {
    ...baseUserPayload,
    ...overrides,
    pillars: {
      ...baseUserPayload.pillars,
      ...(overrides.pillars ?? {}),
    },
    settings: {
      ...baseSettings,
      ...(overrides.settings ?? {}),
    },
  };
  return parseAs(UserSchema, payload);
}

export function createMockPlan(overrides: Partial<PlanProps> = {}): PlanProps {
  const payload = {
    ...basePlanPayload,
    ...overrides,
    checklist: overrides.checklist ?? basePlanPayload.checklist,
  };
  return parseAs(PlanSchema, payload);
}

export function createMockPlanChecklist(
  overrides: Partial<PlanChecklist> = {}
): PlanChecklist {
  const payload = {
    ...basePlanChecklistPayload,
    ...overrides,
  };
  return parseAs(PlanChecklistSchema, payload);
}

export function createMockSmartGoal(
  overrides: Partial<SmartGoalProps> = {}
): SmartGoalProps {
  const payload = {
    ...baseSmartGoalPayload,
    ...overrides,
  };
  return parseAs(SmartGoalSchema, payload);
}

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
    },
  });
}

type RenderOptions = {
  route?: string;
  queryClient?: QueryClient;
};

export function renderWithProviders(
  ui: ReactElement,
  options: RenderOptions = {}
) {
  const queryClient = options.queryClient ?? createTestQueryClient();

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[options.route ?? "/"]}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </MemoryRouter>
    );
  }

  return {
    queryClient,
    ...render(ui, { wrapper: Wrapper }),
  };
}

export function createDeferred<T>() {
  let resolve: (value: T | PromiseLike<T>) => void = () => undefined;
  let reject: (reason?: unknown) => void = () => undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
