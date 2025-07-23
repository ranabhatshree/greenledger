import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: process.env.NEXT_PUBLIC_THEME_COLOR || "#008000",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: process.env.NEXT_PUBLIC_SECONDARY_COLOR || "#4CAF50",
          foreground: "#ffffff",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
