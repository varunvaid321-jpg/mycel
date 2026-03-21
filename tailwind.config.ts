import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#ffffff",
        surface: "#f8f9fa",
        "surface-hover": "#f1f3f4",
        border: "#dadce0",
        accent: "#1a73e8",
        "text-primary": "#202124",
        "text-muted": "#5f6368",
        "text-faint": "#9aa0a6",
        spore: "#e8710a",
        root: "#1967d2",
        signal: "#d93025",
        decompose: "#80868b",
        fruit: "#188038",
        network: "#8430ce",
      },
      fontFamily: {
        serif: ["'Google Sans'", "'Roboto'", "Arial", "sans-serif"],
        mono: ["'Roboto Mono'", "'JetBrains Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
