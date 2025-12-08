import { createContext } from "react";

export const defaultSettings = {
  reduceMotion: false,
  theme: "system",
  notifications: true,
  aiCoach: { persona: "Supportive Guide", tone: "warm", model: "default" },
};

export const AppSettingsContext = createContext({
  settings: defaultSettings,
  setSetting: () => {},
});
