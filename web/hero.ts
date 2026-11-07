// HeroUI Tailwind v4 plugin тохиргоо.
// index.css дотор: @plugin "../hero.ts"
import { heroui } from "@heroui/react";

export default heroui({
  defaultTheme: "dark",
  themes: {
    dark: {
      colors: {
        background: "#020617",
        foreground: "#e2e8f0",
        focus: "#818cf8",
        content1: "#0b1220",
        content2: "#111a2e",
        primary: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          DEFAULT: "#6366f1",
          foreground: "#ffffff"
        }
      }
    }
  }
});
