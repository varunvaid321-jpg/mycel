import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a08",
        surface: "#141410",
        "surface-hover": "#1c1c16",
        border: "#232320",
        accent: "#c49a6c",
        "text-primary": "#e8e4d8",
        "text-muted": "#8a8570",
        "text-faint": "#5a5545",
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
