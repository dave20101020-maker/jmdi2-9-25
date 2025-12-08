import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AppSettingsContext, defaultSettings } from "./appSettingsContext";

// settings defaults moved to appSettingsContext.js

export { AppSettingsContext };
export function AppSettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const raw = localStorage.getItem("app.settings");
      if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
    } catch {
      // ignore
    }
    return defaultSettings;
  });

  useEffect(() => {
    try {
      localStorage.setItem("app.settings", JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  const setSetting = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  // apply theme to document if not system
  useEffect(() => {
    const root = document.documentElement;
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const effectiveTheme =
      settings.theme === "system"
        ? prefersDark
          ? "dark"
          : "light"
        : settings.theme;
    root.classList.toggle("dark", effectiveTheme === "dark");
  }, [settings.theme]);

  const value = useMemo(
    () => ({ settings, setSetting }),
    [settings, setSetting]
  );

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
}
