import React from "react";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import MyPlans from "@/pages/MyPlans";
import { api } from "@/utils/apiClient";
import {
  createDeferred,
  createMockPlan,
  createMockPlanChecklist,
  createMockSmartGoal,
  createMockUser,
  renderWithProviders,
} from "@/tests/testUtils";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Create Plan flow", () => {
  const user = createMockUser({ email: "plan@example.com" });

  const renderPlans = () =>
    renderWithProviders(<MyPlans />, { route: "/my-plans" });

  const answerSleepQuestions = () => {
    const answers = ["Need a better wind-down", "Usually 11pm", "Want 8 hours"];
    const fields = screen.getAllByPlaceholderText(/Your answer/i);
    fields.forEach((field, index) => {
      fireEvent.change(field, { target: { value: answers[index] } });
    });
  };

  const openSleepModal = async () => {
    const sleepButton = await screen.findByRole("button", { name: /Sleep/i });
    fireEvent.click(sleepButton);
  };

  const goToGoalSelection = async () => {
    fireEvent.click(
      screen.getByRole("button", { name: /Next: Select Goals/i })
    );
    await waitFor(() =>
      expect(screen.getByText(/Link Existing Goals/i)).toBeInTheDocument()
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    api.authMe.mockResolvedValue(user);
    api.getPlans.mockResolvedValue([]);
    api.getGoals.mockResolvedValue([]);
    api.aiCoach.mockResolvedValue(createMockPlanChecklist());
    api.createPlan.mockResolvedValue(createMockPlan({ id: "plan-new" }));
    api.updateGoal.mockResolvedValue({});
    api.createHabit.mockResolvedValue({});
  });

  it("renders a loading state while plans are fetched", async () => {
    const deferred = createDeferred<unknown[]>();
    api.getPlans.mockReturnValueOnce(deferred.promise);

    renderPlans();

    await waitFor(() =>
      expect(screen.getByText(/Loading plans/i)).toBeInTheDocument()
    );

    deferred.resolve([]);
  });

  it("shows the empty state when no plans exist", async () => {
    renderPlans();

    await waitFor(() =>
      expect(screen.getByText(/Create Your First Plan/i)).toBeInTheDocument()
    );
  });

  it("surfaces an error toast when the profile request fails", async () => {
    api.authMe.mockRejectedValueOnce(new Error("fail"));

    renderPlans();

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Unable to load your profile")
    );
  });

  it("lists active plans when data is returned", async () => {
    api.getPlans.mockResolvedValueOnce([
      createMockPlan({ id: "plan-1", planTitle: "Momentum" }),
    ]);

    renderPlans();

    await waitFor(() =>
      expect(screen.getByText(/Momentum/i)).toBeInTheDocument()
    );
  });

  it("shows the AI thinking overlay while generating a plan", async () => {
    api.getGoals.mockResolvedValueOnce([]);
    const deferredPlan =
      createDeferred<ReturnType<typeof createMockPlanChecklist>>();
    api.aiCoach.mockReturnValueOnce(deferredPlan.promise);

    renderPlans();
    await openSleepModal();
    answerSleepQuestions();
    await goToGoalSelection();

    fireEvent.click(screen.getByRole("button", { name: /Generate Plan/i }));

    await waitFor(() =>
      expect(
        screen.getByText(/NorthStar is crafting your personalized plan/i)
      ).toBeInTheDocument()
    );

    deferredPlan.resolve(createMockPlanChecklist());
  });

  it("surfaces an error toast when AI generation fails", async () => {
    api.getGoals.mockResolvedValueOnce([]);
    api.aiCoach.mockRejectedValueOnce(new Error("bad request"));

    renderPlans();
    await openSleepModal();
    answerSleepQuestions();
    await goToGoalSelection();

    fireEvent.click(screen.getByRole("button", { name: /Generate Plan/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Failed to generate plan")
    );
  });

  it("creates a plan, links goals, and seeds habits", async () => {
    const goal = createMockSmartGoal({
      id: "goal-42",
      goalStatement: "Improve focus",
    });
    const checklist = createMockPlanChecklist({
      planTitle: "Focus Booster",
      dailyActions: ["Drink water", "Stretch"],
    });

    api.getGoals.mockResolvedValueOnce([goal]);
    api.aiCoach.mockResolvedValueOnce(checklist);

    renderPlans();
    await openSleepModal();
    answerSleepQuestions();
    await goToGoalSelection();

    fireEvent.click(screen.getByText(/Improve focus/i));
    fireEvent.click(screen.getByRole("button", { name: /Generate Plan/i }));

    await waitFor(() =>
      expect(screen.getByText(/Focus Booster/i)).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: /Create Plan/i }));

    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(api.createPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        pillar: "sleep",
        planTitle: "Focus Booster",
        dailyActions: checklist.dailyActions,
        smartGoalIds: [goal.id],
      })
    );
    expect(api.updateGoal).toHaveBeenCalledWith(goal.id, {
      linkedPlanId: "plan-new",
    });
    expect(api.createHabit).toHaveBeenCalledTimes(
      checklist.dailyActions.length
    );
  });
});
