const defaultTheme = require("tailwindcss/defaultTheme");

const northStarPalette = {
  brand: {
    navy: "#0A1224", // Core background
    gold: "#F6C944", // Primary accent
    softGold: "#EABF3A", // Hover accent
    white: "#FFFFFF",
    softWhite: "#F4F7FA",
    divider: "#1C2438",
    error: "#FF6868",
  },
  semantic: {
    background: "var(--ns-color-background)",
    foreground: "var(--ns-color-foreground)",
    card: {
      DEFAULT: "var(--ns-color-card)",
      foreground: "var(--ns-color-card-foreground)",
    },
    border: "var(--ns-color-border)",
    ring: "var(--ns-color-ring)",
    muted: {
      DEFAULT: "var(--ns-color-muted)",
      foreground: "var(--ns-color-muted-foreground)",
    },
    accent: {
      DEFAULT: "var(--ns-color-accent)",
      foreground: "var(--ns-color-accent-foreground)",
    },
    primary: {
      DEFAULT: "var(--ns-color-primary)",
      foreground: "var(--ns-color-primary-foreground)",
    },
    secondary: {
      DEFAULT: "var(--ns-color-secondary)",
      foreground: "var(--ns-color-secondary-foreground)",
    },
  },
};

const northStarSpacing = {
  xs: "var(--ns-space-1)",
  sm: "var(--ns-space-2)",
  base: "var(--ns-space-3)",
  lg: "var(--ns-space-4)",
  xl: "var(--ns-space-5)",
  "2xl": "var(--ns-space-6)",
  gutter: "var(--ns-spacing-gutter)",
  section: "var(--ns-spacing-section)",
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["InterVariable", "Inter", ...defaultTheme.fontFamily.sans],
        heading: ["InterVariable", "Inter", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        ns: northStarPalette.brand,
        gold: northStarPalette.brand.gold,
        background: northStarPalette.semantic.background,
        foreground: northStarPalette.semantic.foreground,
        card: northStarPalette.semantic.card,
        border: northStarPalette.semantic.border,
        ring: northStarPalette.semantic.ring,
        muted: northStarPalette.semantic.muted,
        accent: northStarPalette.semantic.accent,
        primary: northStarPalette.semantic.primary,
        secondary: northStarPalette.semantic.secondary,
        // Pillar colors for utilities
        pillar: {
          sleep: "#4B6FFF",
          diet: "#7BC74D",
          exercise: "#FF7A28",
          physical: "#1BBF9A",
          mental: "#4FB3FF",
          finances: "#22A06B",
          social: "#FF4D8B",
          spirituality: "#9A66FF",
        },
      },
      spacing: northStarSpacing,
      borderRadius: {
        lg: "var(--ns-radius-lg)",
        md: "var(--ns-radius-md)",
        sm: "var(--ns-radius-sm)",
        pill: "var(--ns-radius-pill)",
      },
      boxShadow: {
        "ns-card": "0 0 30px rgba(250,204,21,0.12)",
        "ns-glow": "0 25px 80px rgba(2,6,23,0.65)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
