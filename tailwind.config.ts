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
        "text-primary": "#ffffff",
        "text-muted": "#d4d0c8",
        "text-faint": "#b0a898",
        spore: "#d4a017",
        root: "#d48c3f",
        signal: "#e05555",
        decompose: "#a0a090",
        fruit: "#60b878",
        network: "#a088cc",
      },
      fontFamily: {
        serif: ["'Source Sans 3'", "'Source Sans Pro'", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "sans-serif"],
        mono: ["'Source Sans 3'", "'Source Sans Pro'", "-apple-system", "sans-serif"],
      },
      fontSize: {
        xs: ["0.875rem", { lineHeight: "1.5" }],
        sm: ["1rem", { lineHeight: "1.6" }],
        base: ["1.1rem", { lineHeight: "1.7" }],
        lg: ["1.25rem", { lineHeight: "1.7" }],
        xl: ["1.5rem", { lineHeight: "1.6" }],
      },
    },
  },
  plugins: [],
};

export default config;
