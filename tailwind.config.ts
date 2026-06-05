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
        ink: "#15231e",
        leaf: "#2e7d55",
        mint: "#dff4e9",
        sun: "#f5bd4f",
        clay: "#d9654f",
        sky: "#5c8fd8",
        paper: "#fbfaf7"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(21, 35, 30, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;

