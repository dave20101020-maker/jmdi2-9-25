import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, it, expect, beforeEach } from "vitest";
import Pillar from "@/pages/Pillar";
import { api } from "@/utils/apiClient";
import { createMockUser, createDeferred } from "@/tests/testUtils";

const renderPillarRoute = () =>
  render(
    <MemoryRouter initialEntries={["/pillars/sleep"]}>
      <Routes>
        <Route path="/pillars/:pillarId" element={<Pillar />} />
      </Routes>
    </MemoryRouter>
  );

vi.mock("@/components/shared/AuthGuard", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = React.useState<ReturnType<
      typeof createMockUser
    > | null>(null);

    React.useEffect(() => {
      api
        .authMe()
        .then(setUser)
        .catch(() => setUser(createMockUser()));
    }, []);

    if (!user) return null;
    return <>{typeof children === "function" ? children(user) : children}</>;
  },
}));

describe("Pillar page", () => {
  const isoNow = new Date().toISOString();

  beforeEach(() => {
    vi.clearAllMocks();
    api.authMe.mockResolvedValue(createMockUser());
    api.getLatestActionPlan.mockResolvedValue({
      plan: {
        createdAt: isoNow,
        actions: [{ text: "Deep breathing", completed: false }],
      },
    });
    api.createPillarCheckIn.mockResolvedValue({});
  });

  it("restricts access when the user does not own the pillar", async () => {
    const restrictedUser = createMockUser({
      subscriptionTier: "free",
      entitlements: { plan: "free", features: [] },
      allowedPillars: ["diet"],
    });
    api.authMe.mockResolvedValueOnce(restrictedUser);

    renderPillarRoute();

    await waitFor(() =>
      expect(screen.getByText(/Access Restricted/i)).toBeInTheDocument()
    );
    expect(api.getLatestActionPlan).not.toHaveBeenCalled();
  });

  it("shows a loading indicator while the current plan is fetched", async () => {
    const deferred = createDeferred<{ plan: unknown }>();
    api.getLatestActionPlan.mockReturnValueOnce(deferred.promise);

    const { unmount } = renderPillarRoute();

    await waitFor(() =>
      expect(screen.getByText(/Loading plan/i)).toBeInTheDocument()
    );

    deferred.resolve({ plan: null });
    unmount();
  });

  it("renders the latest plan actions when data is available", async () => {
    renderPillarRoute();

    await waitFor(() =>
      expect(screen.getByText(/Deep breathing/i)).toBeInTheDocument()
    );
  });

  it("submits a pillar check-in successfully", async () => {
    renderPillarRoute();

    await screen.findByText(/Deep breathing/i);

    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "9" } });

    const textarea = screen.getByLabelText(/Notes \(optional\)/i);
    fireEvent.change(textarea, { target: { value: "Feeling great" } });

    fireEvent.click(screen.getByRole("button", { name: /Save Check-In/i }));

    await waitFor(() =>
      expect(screen.getByText(/Saved ✅/i)).toBeInTheDocument()
    );
    expect(api.createPillarCheckIn).toHaveBeenCalledWith({
      pillarId: "sleep",
      value: 9,
      note: "Feeling great",
    });
  });

  it("alerts the user when the check-in fails", async () => {
    const alertSpy = vi
      .spyOn(window, "alert")
      .mockImplementation(() => undefined);
    api.createPillarCheckIn.mockRejectedValueOnce(new Error("boom"));

    renderPillarRoute();

    await screen.findByText(/Deep breathing/i);

    fireEvent.click(screen.getByRole("button", { name: /Save Check-In/i }));

    await waitFor(() => expect(alertSpy).toHaveBeenCalled());
    alertSpy.mockRestore();
  });
});
