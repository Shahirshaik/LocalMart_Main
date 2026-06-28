import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand: Deep Royal Purple
        brand: {
          50:  "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
          950: "#2e1065",
        },
        // Semantic aliases used by user panel & navbar
        royal: {
          DEFAULT: "#3B0764",
          dark:    "#1E0A3C",
          mid:     "#4C1D95",
          accent:  "#7C3AED",
          glow:    "#A78BFA",
          light:   "#EDE9FE",
        },
        gold: {
          DEFAULT: "#F59E0B",
          light:   "#FDE68A",
          dark:    "#B45309",
        },
        mint: {
          DEFAULT: "#10B981",
          light:   "#D1FAE5",
          dark:    "#065F46",
        },
        surface: {
          DEFAULT: "#F9F7FF",
          card:    "#FFFFFF",
          dark:    "#1E0A3C",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "royal-gradient": "linear-gradient(135deg, #1E0A3C 0%, #3B0764 30%, #4C1D95 60%, #6D28D9 100%)",
        "hero-gradient":  "linear-gradient(135deg, #1E0A3C 0%, #3B0764 25%, #4C1D95 55%, #7C3AED 80%, #A78BFA 100%)",
        "gold-gradient":  "linear-gradient(135deg, #F59E0B 0%, #FDE68A 50%, #F59E0B 100%)",
        "mint-gradient":  "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
      },
      boxShadow: {
        "royal":       "0 4px 20px rgba(59, 7, 100, 0.35)",
        "royal-lg":    "0 8px 40px rgba(59, 7, 100, 0.45)",
        "glow-purple": "0 0 20px rgba(124,58,237,0.4), 0 0 60px rgba(124,58,237,0.1)",
        "glow-gold":   "0 0 20px rgba(245,158,11,0.4)",
        "glow-mint":   "0 0 20px rgba(16,185,129,0.4)",
      },
      animation: {
        "fade-in":    "fadeIn 0.4s ease-out both",
        "slide-up":   "slideUp 0.4s ease-out both",
        "float":      "float 6s ease-in-out infinite",
        "marquee":    "marquee 30s linear infinite",
        "spin-slow":  "spin 8s linear infinite",
        "ping-slow":  "ping-slow 1.5s ease-in-out infinite",
        "shimmer":    "shimmer 2s linear infinite",
        "agent-pulse":"agentPulse 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "33%":      { transform: "translateY(-14px) rotate(2deg)" },
          "66%":      { transform: "translateY(-7px) rotate(-1.5deg)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to:   { transform: "translateX(-50%)" },
        },
        "ping-slow": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%":      { opacity: "0.4", transform: "scale(1.3)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        agentPulse: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(16,185,129,0.5)" },
          "50%":      { boxShadow: "0 0 0 8px rgba(16,185,129,0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
