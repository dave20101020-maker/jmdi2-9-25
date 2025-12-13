import { create } from "zustand";

const DEFAULT_DIAGNOSTICS = {
  url: null,
  status: null,
  code: null,
  message: null,
  body: null,
  timestamp: null,
  env: import.meta.env.MODE || "development",
};

export const useDiagnosticsStore = create((set) => ({
  diagnostics: { ...DEFAULT_DIAGNOSTICS },
  setDiagnostics: (payload) =>
    set(() => ({
      diagnostics: {
        ...DEFAULT_DIAGNOSTICS,
        ...payload,
        timestamp: payload?.timestamp || new Date().toISOString(),
        env: payload?.env || import.meta.env.MODE || "development",
      },
    })),
  clearDiagnostics: () =>
    set(() => ({ diagnostics: { ...DEFAULT_DIAGNOSTICS } })),
}));

export default useDiagnosticsStore;
