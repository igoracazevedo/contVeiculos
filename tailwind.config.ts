import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "SF Pro Text", "SF Pro Display", "system-ui", "Segoe UI", "Roboto", "sans-serif"],
      },
      colors: {
        background: "#020617", // slate-950
        card: "#0f172a", // slate-900
      },
    },
  },
  plugins: [],
};
export default config;
