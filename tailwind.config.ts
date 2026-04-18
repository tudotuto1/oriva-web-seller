import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        oriva: {
          black: "#080808",
          surface: "#111111",
          card: "#161616",
          border: "#222222",
          gold: "#C9A96E",
          "gold-light": "#E8C98A",
          "gold-dark": "#9A7A4A",
          cream: "#F5F0E8",
          muted: "#666666",
          danger: "#E55B5B",
          success: "#5BBF8A",
          warning: "#E5A84A",
        },
      },
      fontFamily: {
        display: ["var(--font-cormorant)", "Georgia", "serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        gold: "0 0 20px rgba(201, 169, 110, 0.15)",
        "gold-sm": "0 0 10px rgba(201, 169, 110, 0.1)",
        card: "0 4px 24px rgba(0, 0, 0, 0.4)",
        modal: "0 24px 80px rgba(0, 0, 0, 0.7)",
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #C9A96E, #E8C98A, #9A7A4A)",
        "surface-gradient": "linear-gradient(180deg, #161616, #111111)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease forwards",
        "slide-up": "slideUp 0.4s ease forwards",
        "slide-in-right": "slideInRight 0.3s ease forwards",
        shimmer: "shimmer 1.5s infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          from: { opacity: "0", transform: "translateX(20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
