import React, { PropsWithChildren, createContext, useContext } from "react";

const themeTokens = {
  surface: "bg-[var(--ns-color-background)] text-[var(--ns-color-foreground)]",
  panel:
    "bg-[var(--ns-color-card)] text-[var(--ns-color-card-foreground)] border border-[var(--ns-color-border)] shadow-ns-card rounded-2xl",
  card: "bg-[var(--ns-color-card)] text-[var(--ns-color-card-foreground)] border border-[var(--ns-color-border)] shadow-ns-card rounded-xl",
  buttonPrimary:
    "bg-ns-gold text-ns-navy font-semibold rounded-full px-4 py-2 transition hover:bg-ns-softGold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ns-color-ring)]",
  buttonGhost:
    "text-[var(--ns-color-foreground)] bg-transparent hover:bg-[var(--ns-color-accent)]/70 rounded-full px-4 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ns-color-ring)]",
  surfaceMuted:
    "bg-[var(--ns-color-accent)]/70 text-[var(--ns-color-foreground)] border border-[var(--ns-color-border)] rounded-xl",
};

type ThemeTokens = typeof themeTokens;

const ThemeContext = createContext<ThemeTokens>(themeTokens);

export const useThemeTokens = () => useContext(ThemeContext);

export function ThemeProvider({ children }: PropsWithChildren) {
  return (
    <ThemeContext.Provider value={themeTokens}>
      <div
        className={`min-h-screen ${themeTokens.surface} antialiased selection:bg-ns-gold/20 selection:text-[var(--ns-color-foreground)]`}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export { themeTokens };
