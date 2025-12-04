const palette = {
  cosmicNavy: "#020617",
  deepNavy: "#050d2a",
  midnight: "#070b1f",
  card: "#0f1b3d",
  surface: "#111b3d",
  nebula: "#1d2759",
  gold: "#f4d06f",
  amber: "#d6a03a",
  teal: "#4cc9f0",
  magenta: "#c77dff",
  white: "#f7f8ff",
  muted: "#b8c4ff",
  danger: "#ff6b6b",
};

const gradients = {
  horizon:
    "linear-gradient(140deg, rgba(5,4,28,1) 0%, rgba(10,18,56,1) 40%, rgba(16,31,82,1) 100%)",
  aurora:
    "linear-gradient(120deg, rgba(196,125,255,0.08), rgba(76,201,240,0.08))",
  cta: "linear-gradient(135deg, #f8e27e, #d6a33a)",
  pill: "linear-gradient(145deg, rgba(244,208,63,0.18), rgba(71,214,167,0.18))",
  card: "linear-gradient(160deg, rgba(15,27,61,0.95), rgba(7,12,33,0.85))",
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
    '"Space Grotesk", "General Sans", "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
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
    "--ns-color-cosmic": palette.cosmicNavy,
    "--ns-color-deep": palette.deepNavy,
    "--ns-color-surface": palette.surface,
    "--ns-color-card": palette.card,
    "--ns-color-aurora": gradients.aurora,
    "--ns-color-gold": palette.gold,
    "--ns-color-amber": palette.amber,
    "--ns-color-teal": palette.teal,
    "--ns-color-magenta": palette.magenta,
    "--ns-color-text": palette.white,
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
