import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const API_BASE = "https://api.test";

const createResponse = (status: number, body?: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  text: () => Promise.resolve(body ? JSON.stringify(body) : ""),
});

type ApiModule = typeof import("@/utils/apiClient");

describe("APIClient", () => {
  let APIClientClass: ApiModule["APIClient"];
  const originalFetch = global.fetch;
  let fetchMock: ReturnType<typeof vi.fn>;
  let dispatchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    ({ APIClient: APIClientClass } = await vi.importActual<ApiModule>(
      "@/utils/apiClient"
    ));
    fetchMock = vi.fn();
    global.fetch = fetchMock as typeof fetch;
    dispatchSpy = vi.spyOn(window, "dispatchEvent");
  });

  afterEach(() => {
    global.fetch = originalFetch;
    dispatchSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it("returns parsed data for successful requests", async () => {
    const client = new APIClientClass(API_BASE);
    fetchMock.mockResolvedValueOnce(
      createResponse(200, { data: { ok: true } })
    );

    const result = await client.request("/entries");

    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE}/api/entries`,
      expect.objectContaining({ method: "GET" })
    );
    expect(result).toEqual({ data: { ok: true } });
  });

  it("refreshes the session once after an unauthorized response", async () => {
    const client = new APIClientClass(API_BASE);

    fetchMock
      .mockResolvedValueOnce(createResponse(401, { message: "expired" }))
      .mockResolvedValueOnce(createResponse(200, { data: { refreshed: true } }))
      .mockResolvedValueOnce(createResponse(200, { data: { ok: true } }));

    const result = await client.request("/entries");

    expect(result).toEqual({ data: { ok: true } });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toBe(`${API_BASE}/api/auth/refresh`);
  });

  it("emits auth-required events when refresh fails", async () => {
    const client = new APIClientClass(API_BASE);

    fetchMock
      .mockResolvedValueOnce(createResponse(401, { message: "expired" }))
      .mockResolvedValueOnce(createResponse(401, { message: "still bad" }));

    await expect(client.request("/entries")).rejects.toMatchObject({
      message: "still bad",
      status: 401,
    });

    const emittedEvents = dispatchSpy.mock.calls.map(([event]) => event.type);
    expect(emittedEvents).toContain("api-error");
    expect(emittedEvents).toContain("auth-required");
  });

  it("unwraps authMe responses that nest data", async () => {
    const client = new APIClientClass(API_BASE);
    const user = { email: "tester@example.com" };
    fetchMock.mockResolvedValueOnce(createResponse(200, { data: user }));

    const result = await client.authMe();

    expect(result).toEqual(user);
    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE}/api/auth/me`,
      expect.any(Object)
    );
  });
});
