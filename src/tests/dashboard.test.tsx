import React from "react";
import { screen, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Dashboard from "@/pages/Dashboard";
import { api } from "@/utils/apiClient";
import {
  createMockPlan,
  createMockUser,
  renderWithProviders,
  createDeferred,
} from "@/tests/testUtils";

const stubComponent = (testId: string) => () =>
  <div data-testid={testId}></div>;

vi.mock("@/components/ai/CoachPanel", () => ({
  __esModule: true,
  default: ({ label }: { label: string }) => (
    <div data-testid={`coach-panel-${label}`}>{label}</div>
  ),
}));
vi.mock("@/components/shared/ScoreOrb", () => ({
  __esModule: true,
  default: stubComponent("score-orb"),
}));
vi.mock("@/components/shared/DailySummary", () => ({
  __esModule: true,
  default: stubComponent("daily-summary"),
}));
vi.mock("@/components/shared/ActiveItemsWidget", () => ({
  __esModule: true,
  default: stubComponent("active-items"),
}));
vi.mock("@/components/shared/StreakDisplay", () => ({
  __esModule: true,
  default: stubComponent("streak-display"),
}));
vi.mock("@/components/shared/MilestoneCelebration", () => ({
  __esModule: true,
  default: () => null,
}));
vi.mock("@/components/visuals/LifeOrbitVisualizer", () => ({
  __esModule: true,
  LifeOrbitVisualizer: stubComponent("life-orbit"),
}));
vi.mock("@/ai/GuidedTour", () => ({
  __esModule: true,
  default: () => null,
}));
vi.mock("@/hooks/useStreak", () => ({
  useStreak: () => ({
    currentStreak: 7,
    longestStreak: 21,
    pillarStreaks: { sleep: 3 },
  }),
}));

let shouldThrowAIInsights = false;
vi.mock("@/ai/AIInsights", () => ({
  __esModule: true,
  default: () => {
    if (shouldThrowAIInsights) {
      throw new Error("API failure");
    }
    return <div data-testid="ai-insights"></div>;
  },
}));

describe("Dashboard", () => {
  const user = createMockUser({ full_name: "Test User" });
  const plan = createMockPlan({ planTitle: "Sleep Mastery" });
  const today = new Date().toISOString().slice(0, 10);

  beforeEach(() => {
    shouldThrowAIInsights = false;
    vi.clearAllMocks();
    api.authMe.mockResolvedValue(user);
    api.getEntries.mockResolvedValue([
      { id: "entry-1", pillar: "sleep", date: today, score: 85 },
    ]);
    api.getPlans.mockResolvedValue([plan]);
    api.getSubscription.mockResolvedValue([
      { tier: "Premium", status: "active" },
    ]);
    api.getPillars.mockResolvedValue({
      data: [{ pillar: "sleep", score: 90, trend: "improving" }],
    });
    api.getGoals.mockResolvedValue([
      { id: "goal-1", goalStatement: "Write journal", progress: 50 },
    ]);
    api.getHabits.mockResolvedValue([{ id: "habit-1", habitText: "Stretch" }]);
    api.getMoods.mockResolvedValue([
      {
        moodScore: 76,
        timestamp: new Date().toISOString(),
        emotions: ["Calm"],
      },
    ]);
    api.ai.mockResolvedValue({
      data: { chosen: { primaryPillars: ["sleep"], reason: "Rest today" } },
    });
    api.authUpdateMe.mockResolvedValue({});
  });

  afterEach(() => {
    shouldThrowAIInsights = false;
  });

  it("shows the loading indicator while life data is loading", async () => {
    const entriesDeferred = createDeferred<unknown[]>();
    api.getEntries
      .mockReturnValueOnce(entriesDeferred.promise)
      .mockReturnValueOnce(Promise.resolve([]));

    const { unmount } = renderWithProviders(<Dashboard />, {
      route: "/dashboard",
    });

    expect(
      screen.getByText(/Plotting your constellation/i)
    ).toBeInTheDocument();

    entriesDeferred.resolve([]);
    unmount();
  });

  it("renders dashboard content after data resolves", async () => {
    renderWithProviders(<Dashboard />, { route: "/dashboard" });

    await waitFor(() =>
      expect(screen.getByText(/Your Life Score/i)).toBeInTheDocument()
    );
    expect(screen.getByText(/Sleep Mastery/i)).toBeInTheDocument();
    expect(screen.getByTestId("ai-insights")).toBeInTheDocument();
  });

  it("surfaces AI fallback UI when insights fail", async () => {
    shouldThrowAIInsights = true;
    renderWithProviders(<Dashboard />, { route: "/dashboard" });

    await waitFor(() =>
      expect(screen.getByText(/AI Service Unavailable/i)).toBeInTheDocument()
    );
  });
});
