import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach } from "vitest";
import Timeline from "@/pages/Timeline";
import { api } from "@/utils/apiClient";
import { createDeferred, createMockUser } from "@/tests/testUtils";

const renderTimeline = () =>
  render(
    <MemoryRouter initialEntries={["/timeline"]}>
      <Timeline />
    </MemoryRouter>
  );

describe("Timeline page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.authMe.mockResolvedValue(createMockUser());
    api.getTimeline.mockResolvedValue({ data: [] });
  });

  it("shows the empty placeholder while events are loading", async () => {
    const deferred = createDeferred<{ data: unknown[] }>();
    api.getTimeline.mockReturnValueOnce(deferred.promise);

    renderTimeline();

    await waitFor(() =>
      expect(
        screen.getByText(/No activity in the last 30 days/i)
      ).toBeInTheDocument()
    );

    deferred.resolve({ data: [] });
  });

  it("renders server events once data arrives", async () => {
    api.getTimeline.mockResolvedValueOnce({
      data: [
        {
          type: "habit-check",
          pillarId: "sleep",
          date: new Date().toISOString(),
          value: "10",
          note: "Felt great",
        },
      ],
    });

    renderTimeline();

    await waitFor(() =>
      expect(screen.getByText(/habit check/i)).toBeInTheDocument()
    );
    expect(screen.getByText(/Value: 10/i)).toBeInTheDocument();
    expect(screen.getByText(/Felt great/i)).toBeInTheDocument();
  });

  it("logs an error and keeps the fallback when the request fails", async () => {
    const error = new Error("network");
    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    api.getTimeline.mockRejectedValueOnce(error);

    renderTimeline();

    await waitFor(() =>
      expect(
        screen.getByText(/No activity in the last 30 days/i)
      ).toBeInTheDocument()
    );
    expect(consoleSpy).toHaveBeenCalledWith("load timeline", error);
    consoleSpy.mockRestore();
  });

  it("keeps the empty state when no events are returned", async () => {
    api.getTimeline.mockResolvedValueOnce([]);

    renderTimeline();

    await waitFor(() =>
      expect(
        screen.getByText(/No activity in the last 30 days/i)
      ).toBeInTheDocument()
    );
  });
});
