import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import GuidedJournal from "@/ai/GuidedJournal";
import AIInsights from "@/ai/AIInsights";
import { toast } from "sonner";
import { api } from "@/utils/apiClient";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

/**
 * GuidedJournal Component Tests
 *
 * Tests for:
 * - Component rendering with different states
 * - Category selection
 * - Form submission
 * - Close functionality
 * - Accessibility features
 */
describe("GuidedJournal Component", () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnClose.mockReset();
    mockOnSave.mockReset();
  });

  test("renders guided journal modal", () => {
    render(<GuidedJournal onClose={mockOnClose} onSave={mockOnSave} />);

    expect(screen.getByText("Guided Journaling")).toBeInTheDocument();
    expect(screen.getByText("Choose a focus")).toBeInTheDocument();
  });

  test("displays all category buttons", () => {
    render(<GuidedJournal onClose={mockOnClose} onSave={mockOnSave} />);

    expect(screen.getByLabelText(/Gratitude/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Reflection/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Goals/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Emotions/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Growth/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Challenges/i)).toBeInTheDocument();
  });

  test("displays response textarea", () => {
    render(<GuidedJournal onClose={mockOnClose} onSave={mockOnSave} />);

    const textarea = screen.getByPlaceholderText(/Take your time/i);
    expect(textarea).toBeInTheDocument();
  });

  test("displays mood selector buttons 1-10", () => {
    render(<GuidedJournal onClose={mockOnClose} onSave={mockOnSave} />);

    for (let i = 1; i <= 10; i++) {
      expect(screen.getByText(String(i))).toBeInTheDocument();
    }
  });

  test("closes modal when close button clicked", () => {
    render(<GuidedJournal onClose={mockOnClose} onSave={mockOnSave} />);

    const closeButton = screen.getByLabelText(/Close journal/i);
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test("closes modal when Cancel button clicked", () => {
    render(<GuidedJournal onClose={mockOnClose} onSave={mockOnSave} />);

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test("displays error when save attempted with empty response", async () => {
    render(<GuidedJournal onClose={mockOnClose} onSave={mockOnSave} />);

    const saveButton = screen.getByText(/Save Entry/i);
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Please write something before saving"
      );
    });
  });

  test("calls onSave with entry data when form submitted", async () => {
    mockOnSave.mockResolvedValue();
    render(<GuidedJournal onClose={mockOnClose} onSave={mockOnSave} />);

    // Fill in response
    const textarea = screen.getByPlaceholderText(/Take your time/i);
    fireEvent.change(textarea, { target: { value: "My journal entry" } });

    // Select a mood
    const moodButton = screen.getAllByLabelText(/Mood \d+ out of 10/i)[5]; // Select mood 6
    fireEvent.click(moodButton);

    // Submit form
    const saveButton = screen.getByText(/Save Entry/i);
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
      const callArg = mockOnSave.mock.calls[0][0];
      expect(callArg.response).toBe("My journal entry");
      expect(callArg.mood).toBe(6);
    });
  });

  test("updates character count as user types", () => {
    render(<GuidedJournal onClose={mockOnClose} onSave={mockOnSave} />);

    const textarea = screen.getByPlaceholderText(/Take your time/i);

    fireEvent.change(textarea, { target: { value: "Hello" } });
    expect(screen.getByText("5 characters")).toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: "Hello World!" } });
    expect(screen.getByText("12 characters")).toBeInTheDocument();
  });

  test("updates mood display when button clicked", () => {
    render(<GuidedJournal onClose={mockOnClose} onSave={mockOnSave} />);

    // Initial mood should be 7
    expect(screen.getByText("7/10")).toBeInTheDocument();

    // Click mood 9
    const moodButton = screen.getAllByLabelText(/Mood \d+ out of 10/i)[8];
    fireEvent.click(moodButton);

    expect(screen.getByText("9/10")).toBeInTheDocument();
  });

  test("handles ESC key to close modal", () => {
    render(<GuidedJournal onClose={mockOnClose} onSave={mockOnSave} />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(mockOnClose).toHaveBeenCalled();
  });

  test("has proper ARIA labels for accessibility", () => {
    render(<GuidedJournal onClose={mockOnClose} onSave={mockOnSave} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText(/Your Response/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/How do you feel after writing/i)
    ).toBeInTheDocument();
  });
});

/**
 * AIInsights Component Tests
 *
 * Tests for:
 * - Loading state
 * - Error state
 * - Success state with data
 * - Retry functionality
 * - Data display
 */
describe("AIInsights Component", () => {
  const mockProps = {
    entries: [],
    lifeScore: 75,
    pillarScores: {
      sleep: 80,
      diet: 70,
      exercise: 65,
      physical_health: 75,
      mental_health: 80,
      finances: 60,
      social: 85,
      spirituality: 70,
    },
    accessiblePillars: ["sleep", "diet", "exercise"],
    plans: [],
    user: { id: "test-user", name: "Test User" },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    api.generateInsights = vi
      .fn()
      .mockResolvedValue({ insights: "", recommendations: [] });
  });

  test("renders loading state initially", () => {
    render(<AIInsights {...mockProps} />);

    // Should show loading indicator
    const loadingElements = screen.queryAllByText(
      /loading|generating|analyzing/i
    );
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  test("renders error state when API fails", async () => {
    api.generateInsights = vi.fn().mockRejectedValue(new Error("API Error"));

    render(<AIInsights {...mockProps} />);

    await waitFor(() => {
      const errorElements = screen.queryAllByText(
        /error|failed|something went wrong/i
      );
      expect(errorElements.length).toBeGreaterThan(0);
    });
  });

  test("displays retry button on error", async () => {
    api.generateInsights = vi.fn().mockRejectedValue(new Error("API Error"));

    render(<AIInsights {...mockProps} />);

    await waitFor(() => {
      const retryButton = screen.queryByText(/retry|try again/i);
      expect(retryButton).toBeInTheDocument();
    });
  });

  test("retries API call when retry button clicked", async () => {
    api.generateInsights = vi
      .fn()
      .mockRejectedValueOnce(new Error("API Error"))
      .mockResolvedValueOnce({
        insights: "Great work!",
        recommendations: ["Sleep more", "Exercise daily"],
      });

    render(<AIInsights {...mockProps} />);

    await waitFor(() => {
      const retryButton = screen.queryByText(/retry|try again/i);
      if (retryButton) {
        fireEvent.click(retryButton);
      }
    });

    // After retry, should eventually show success state
    await waitFor(() => {
      expect(api.generateInsights).toHaveBeenCalledTimes(2);
    });
  });

  test("displays success state with insights", async () => {
    api.generateInsights = vi.fn().mockResolvedValue({
      insights: "You are doing well on sleep!",
      recommendations: ["Keep up the good work", "Try to maintain consistency"],
      trending: ["sleep"],
    });

    render(<AIInsights {...mockProps} />);

    await waitFor(() => {
      expect(
        screen.getByText(/You are doing well on sleep/i)
      ).toBeInTheDocument();
    });
  });

  test("displays recommendations when available", async () => {
    api.generateInsights = vi.fn().mockResolvedValue({
      insights: "Test insight",
      recommendations: [
        "Get 8 hours of sleep",
        "Exercise 30 minutes daily",
        "Meditate for 10 minutes",
      ],
    });

    render(<AIInsights {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText(/Get 8 hours of sleep/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Exercise 30 minutes daily/i)
      ).toBeInTheDocument();
    });
  });

  test("handles no data gracefully", async () => {
    api.generateInsights = vi.fn().mockResolvedValue(null);

    render(<AIInsights {...mockProps} />);

    await waitFor(() => {
      // Should still render without crashing
      expect(screen.getByText("AI Insights")).toBeInTheDocument();
    });
  });

  test("has proper ARIA live region for dynamic content", () => {
    api.generateInsights = vi.fn().mockResolvedValue({
      insights: "Updated insight",
    });

    render(<AIInsights {...mockProps} />);

    const liveRegions = screen.queryAllByRole("status");
    expect(liveRegions.length).toBeGreaterThan(0);
  });
});
