import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "var(--text)",
        leaf: "var(--brand-2)",
        mint: "color-mix(in srgb, var(--brand) 18%, transparent)",
        sun: "var(--accent)",
        clay: "var(--danger)",
        sky: "#4ea7ff",
        paper: "var(--surface)"
      },
      boxShadow: {
        soft: "var(--shadow)"
      }
    }
  },
  plugins: []
};

export default config;
