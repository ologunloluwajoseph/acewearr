import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

/**
 * AceWears Tailwind Configuration
 * Brand System:
 *  - Deep Navy    #0A1128  (primary)
 *  - Clean White  #FFFFFF  (background)
 *  - Electric Amber #FF9F1C (accent / CTAs)
 *  - Transformative Teal #008080 (secondary accent)
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // AceWears Brand Palette (hex passthrough for SVG-consistency)
        navy: {
          DEFAULT: "#0A1128",
          50: "#E8EAF0",
          100: "#C5C9D8",
          200: "#9AA1B8",
          300: "#6F7894",
          400: "#47506B",
          500: "#1F2A47",
          600: "#162039",
          700: "#101A30",
          800: "#0A1128",
          900: "#060B1B",
        },
        amber: {
          DEFAULT: "#FF9F1C",
          50: "#FFF6E5",
          100: "#FFE9BF",
          200: "#FFD58F",
          300: "#FFC160",
          400: "#FFAD33",
          500: "#FF9F1C",
          600: "#E08800",
          700: "#B86E00",
          800: "#8A5300",
          900: "#5C3800",
        },
        teal: {
          DEFAULT: "#008080",
          50: "#E5F4F4",
          100: "#BFE3E3",
          200: "#8FCECE",
          300: "#5FB8B8",
          400: "#2FA3A3",
          500: "#008080",
          600: "#006666",
          700: "#004D4D",
          800: "#003333",
          900: "#001A1A",
        },
        // shadcn semantic tokens (kept for compatibility with existing ui/* components)
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "#0A1128",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#008080",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "#FF9F1C",
          foreground: "#0A1128",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "#FF9F1C",
        chart: {
          "1": "#0A1128",
          "2": "#FF9F1C",
          "3": "#008080",
          "4": "#47506B",
          "5": "#FFAD33",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
        display: ["var(--font-display)", "var(--font-geist-sans)", "serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "slide-up-sheet": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        "pulse-amber": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(255, 159, 28, 0.5)" },
          "50%": { boxShadow: "0 0 0 8px rgba(255, 159, 28, 0)" },
        },
      },
      animation: {
        "slide-up-sheet": "slide-up-sheet 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in": "fade-in 0.4s ease-out",
        "scale-in": "scale-in 0.25s ease-out",
        shimmer: "shimmer 2s linear infinite",
        "pulse-amber": "pulse-amber 2s ease-in-out infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
export default config;
