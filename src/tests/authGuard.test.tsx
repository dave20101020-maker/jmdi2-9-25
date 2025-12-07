import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AuthGuard from "@/components/shared/AuthGuard";
import { api } from "@/utils/apiClient";
import { createMockUser, createDeferred } from "@/tests/testUtils";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("AuthGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
  });

  it("shows the loading state while authentication is in progress", async () => {
    const deferred = createDeferred<ReturnType<typeof createMockUser>>();
    api.authMe.mockReturnValueOnce(deferred.promise);

    render(
      <MemoryRouter>
        <AuthGuard>
          <div>Protected Area</div>
        </AuthGuard>
      </MemoryRouter>
    );

    expect(screen.getByText(/Loading NorthStar/i)).toBeInTheDocument();

    deferred.resolve(createMockUser());
    await waitFor(() =>
      expect(screen.getByText(/Protected Area/i)).toBeInTheDocument()
    );
  });

  it("renders children when authentication succeeds", async () => {
    const user = createMockUser({ email: "success@example.com" });
    api.authMe.mockResolvedValueOnce(user);

    render(
      <MemoryRouter>
        <AuthGuard>{(currentUser) => <div>{currentUser.email}</div>}</AuthGuard>
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText("success@example.com")).toBeInTheDocument()
    );
  });

  it("shows the error state and retries when the request fails", async () => {
    const user = createMockUser();
    api.authMe
      .mockRejectedValueOnce(new Error("Network issue"))
      .mockResolvedValueOnce(user);

    render(
      <MemoryRouter>
        <AuthGuard>
          <div>Protected Area</div>
        </AuthGuard>
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/Connection Issue/i)).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: /Try Again/i }));

    await waitFor(() =>
      expect(screen.getByText(/Protected Area/i)).toBeInTheDocument()
    );
    expect(api.authMe).toHaveBeenCalledTimes(2);
  });

  it("redirects to login when the session is unauthorized", async () => {
    const authError = new Error("Unauthorized");
    authError.status = 401;
    api.authMe.mockRejectedValueOnce(authError);

    render(
      <MemoryRouter>
        <AuthGuard>
          <div>Protected Area</div>
        </AuthGuard>
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/login", { replace: true })
    );
  });
});
