import { afterEach, beforeAll, vi, describe, it, expect } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const ensureMatchMedia = () => {
  if (typeof window === "undefined" || window.matchMedia) {
    return;
  }

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

const ensureScrollTo = () => {
  if (typeof window === "undefined") {
    return;
  }

  if (!window.scrollTo) {
    window.scrollTo = vi.fn();
  }
};

const ensureIntersectionObserver = () => {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin = "0px";
    readonly thresholds = [] as number[];

    disconnect(): void {}
    observe(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
    unobserve(): void {}
  }

  if (!globalThis.IntersectionObserver) {
    globalThis.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;
  }
};

const ensureFetch = () => {
  if (typeof globalThis.fetch === "function") {
    return;
  }
  globalThis.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: async () => ({}),
    } as Response)
  ) as typeof fetch;
};

const createApiProxy = () =>
  new Proxy<Record<PropertyKey, ReturnType<typeof vi.fn>>>(
    {},
    {
      get(target, prop: PropertyKey) {
        if (!target[prop]) {
          target[prop] = vi.fn();
        }
        return target[prop];
      },
    }
  );

const apiProxy = createApiProxy();

vi.mock("@/utils/apiClient", () => ({
  api: apiProxy,
}));

vi.mock("@/api/aiClient", () => ({
  sendMessage: vi.fn(),
  sendToOrchestrator: vi.fn(),
  sendToPillarAgent: vi.fn(),
}));

beforeAll(() => {
  ensureMatchMedia();
  ensureScrollTo();
  ensureIntersectionObserver();
  ensureFetch();
});

export { describe, it, expect, vi };
