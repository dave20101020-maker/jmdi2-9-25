const palette = {
  cosmicNavy: "#0A1029",
  deepNavy: "#060A1F",
  midnight: "#0D1536",
  card: "#111A3B",
  surface: "#141F44",
  nebula: "#1E2B63",
  gold: "#D4AF37",
  amber: "#B8902D",
  teal: "#4cc9f0",
  magenta: "#c77dff",
  white: "#f7f8ff",
  muted: "#b8c4ff",
  danger: "#ff6b6b",
};

const gradients = {
  horizon: "linear-gradient(140deg, #0A1029 0%, #0C1440 45%, #111A3B 100%)",
  aurora:
    "linear-gradient(120deg, rgba(196,125,255,0.08), rgba(76,201,240,0.08))",
  cta: "linear-gradient(135deg, #F6D980, #D4AF37)",
  pill: "linear-gradient(145deg, rgba(212,175,55,0.18), rgba(76,201,240,0.16))",
  card: "linear-gradient(160deg, rgba(17,26,59,0.95), rgba(10,16,41,0.9))",
};

const radii = {
  sm: "10px",
  md: "16px",
  lg: "24px",
  pill: "999px",
};

const spacing = {
  gutter: "clamp(1.25rem, 2vw, 2.5rem)",
  section: "clamp(2rem, 6vw, 4.5rem)",
};

const typography = {
  fontFamily:
    '"InterVariable", "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  display: {
    size: "clamp(2rem, 4vw, 3.5rem)",
    weight: 600,
    letterSpacing: "-0.03em",
  },
  title: {
    size: "clamp(1.5rem, 2vw, 2.5rem)",
    weight: 600,
  },
  body: {
    size: "1rem",
    weight: 400,
  },
};

const northstarTheme = {
  palette,
  gradients,
  radii,
  spacing,
  typography,
};

export const applyNorthstarTheme = (root = document.documentElement) => {
  const entries = {
    "--ns-color-bg": gradients.horizon,
    "--ns-color-bg-solid": palette.cosmicNavy,
    "--ns-color-background": palette.cosmicNavy,
    "--ns-color-cosmic": palette.cosmicNavy,
    "--ns-color-deep": palette.deepNavy,
    "--ns-color-surface": palette.surface,
    "--ns-color-card": palette.card,
    "--ns-color-card-foreground": palette.white,
    "--ns-color-aurora": gradients.aurora,
    "--ns-color-gold": palette.gold,
    "--ns-color-primary": palette.gold,
    "--ns-color-primary-foreground": palette.cosmicNavy,
    "--ns-color-border": "rgba(212, 175, 55, 0.28)",
    "--ns-color-ring": "rgba(212, 175, 55, 0.45)",
    "--ns-color-accent": palette.midnight,
    "--ns-color-amber": palette.amber,
    "--ns-color-teal": palette.teal,
    "--ns-color-magenta": palette.magenta,
    "--ns-color-text": palette.white,
    "--ns-color-foreground": palette.white,
    "--ns-color-muted": palette.muted,
    "--ns-color-danger": palette.danger,
    "--ns-gradient-cta": gradients.cta,
    "--ns-gradient-pill": gradients.pill,
    "--ns-gradient-card": gradients.card,
    "--ns-radius-sm": radii.sm,
    "--ns-radius-md": radii.md,
    "--ns-radius-lg": radii.lg,
    "--ns-radius-pill": radii.pill,
    "--ns-spacing-gutter": spacing.gutter,
    "--ns-spacing-section": spacing.section,
    "--ns-font-family": typography.fontFamily,
  };

  Object.entries(entries).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
};

export default northstarTheme;
