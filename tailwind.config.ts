import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          DEFAULT: "#16a34a",
          dark:    "#052e16",
          mid:     "#14532d",
          light:   "#f0fdf4",
          glow:    "rgba(22,163,74,0.18)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans:    ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "brand-glow": "0 0 0 3px rgba(22,163,74,0.18)",
        "card":       "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)",
        "card-hover": "0 10px 25px -5px rgba(0,0,0,0.08), 0 4px 10px -3px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
