import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a08",
        surface: "#141410",
        "surface-hover": "#1c1c16",
        border: "#2e2e28",
        accent: "#d4aa7c",
        "text-primary": "#f5f2ea",
        "text-muted": "#b8b0a0",
        "text-faint": "#8a8070",
        spore: "#b8960f",
        root: "#b85c2f",
        signal: "#c44040",
        decompose: "#666658",
        fruit: "#4a8c5c",
        network: "#7b68ae",
      },
      fontFamily: {
        serif: ["'EB Garamond'", "Georgia", "serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
