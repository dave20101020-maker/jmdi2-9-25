const defaultTheme = require("tailwindcss/defaultTheme");

const northStarPalette = {
  navy: "#020617",
  card: "#0F172A",
  gold: "#FACC15",
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["InterVariable", "Inter", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        "ns-navy": northStarPalette.navy,
        "ns-card": northStarPalette.card,
        "ns-gold": northStarPalette.gold,
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
      spacing: {
        "space-1": "var(--ns-space-1)",
        "space-2": "var(--ns-space-2)",
        "space-3": "var(--ns-space-3)",
        "space-4": "var(--ns-space-4)",
        "space-5": "var(--ns-space-5)",
        "space-6": "var(--ns-space-6)",
      },
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
