import React, { createContext, useContext, useState, useEffect } from "react"
import type { JSX } from "react"

export type ThemeColor = "blue" | "red" | "green" | "pink" | "purple" | "yellow" | "black"

const THEME_COLORS: Record<ThemeColor, Record<string, string>> = {
  blue: {
    "--theme-primary": "#3b82f6", // blue-500
    "--theme-primary-dark": "#2563eb", // blue-600
    "--theme-primary-darker": "#1e40af", // blue-800
    "--theme-primary-light": "#60a5fa", // blue-400

    "--theme-border": "#334155", // slate-700 (darker and cooler than before)
    "--theme-hover": "#0ea5e9", // sky-500

    "--theme-bg": "#0a0f1c", // custom: deeper navy, not too black
    "--theme-note-bg": "#1e293b", // slate-800, clear separation for note area
    "--theme-button-hover": "#1d4ed8", // blue-700 for strong hover feedback

    // Blue derivatives for backgrounds and text
    "--theme-bg-blue-400": "#60a5fa", // blue-400
    "--theme-bg-blue-500": "#3b82f6", // blue-500
    "--theme-bg-blue-600": "#2563eb", // blue-600

    "--theme-bg-sky-400": "#38bdf8", // sky-400
    "--theme-bg-sky-500": "#0ea5e9", // sky-500
    "--theme-bg-sky-600": "#0284c7", // sky-600

    "--theme-bg-cyan-400": "#22d3ee", // cyan-400
    "--theme-bg-cyan-500": "#06b6d4", // cyan-500
    "--theme-bg-cyan-600": "#0891b2", // cyan-600

    "--theme-text-blue-300": "#93c5fd", // blue-300
    "--theme-text-blue-400": "#60a5fa", // blue-400
    "--theme-text-blue-500": "#3b82f6", // blue-500
    "--theme-text-sky-400": "#38bdf8", // sky-400
    "--theme-text-sky-500": "#0ea5e9", // sky-500
    "--theme-text-cyan-400": "#22d3ee", // cyan-400
    "--theme-text-cyan-500": "#06b6d4", // cyan-500
  },
red: {
    "--theme-primary": "#f87171", // red-400
    "--theme-primary-dark": "#ef4444", // red-500
    "--theme-primary-darker": "#b91c1c", // red-700
    "--theme-primary-light": "#fca5a5", // red-300

    "--theme-border": "#450a0a", // deeper and clearer than before
    "--theme-hover": "#dc2626", // red-600 for bolder interactivity

    "--theme-bg": "#1a0a0a", // very dark crimson base
    "--theme-note-bg": "#331111", // richer than red-900
    "--theme-button-hover": "#b91c1c", // red-700

    "--theme-bg-blue-400": "#f87171", // red-400
    "--theme-bg-blue-500": "#ef4444", // red-500
    "--theme-bg-blue-600": "#b91c1c", // red-700

    "--theme-bg-sky-400": "#fb7185", // rose-400
    "--theme-bg-sky-500": "#f43f5e", // rose-500
    "--theme-bg-sky-600": "#be123c", // rose-700

    "--theme-bg-cyan-400": "#fb7185", // rose-400
    "--theme-bg-cyan-500": "#f43f5e", // rose-500
    "--theme-bg-cyan-600": "#be123c", // rose-700

    "--theme-text-blue-300": "#fca5a5", // red-300
    "--theme-text-blue-400": "#f87171", // red-400
    "--theme-text-blue-500": "#ef4444", // red-500
    "--theme-text-sky-400": "#fb7185", // rose-400
    "--theme-text-sky-500": "#f43f5e", // rose-500
    "--theme-text-cyan-400": "#fb7185", // rose-400
    "--theme-text-cyan-500": "#f43f5e", // rose-500
  },
  green: {
    "--theme-primary": "#4ade80", // green-400
    "--theme-primary-dark": "#22c55e", // green-500
    "--theme-primary-darker": "#15803d", // green-700
    "--theme-primary-light": "#86efac", // green-300

    "--theme-border": "#0f2f1c", // deep and mossy
    "--theme-hover": "#16a34a", // green-600 for a bright punch

    "--theme-bg": "#051b11", // near-black forest green
    "--theme-note-bg": "#123824", // solid contrast for note bg
    "--theme-button-hover": "#15803d", // green-700

    "--theme-bg-blue-400": "#4ade80", // green-400
    "--theme-bg-blue-500": "#22c55e", // green-500
    "--theme-bg-blue-600": "#15803d", // green-700

    "--theme-bg-sky-400": "#2dd4bf", // teal-400
    "--theme-bg-sky-500": "#14b8a6", // teal-500
    "--theme-bg-sky-600": "#0f766e", // teal-700

    "--theme-bg-cyan-400": "#2dd4bf", // teal-400
    "--theme-bg-cyan-500": "#14b8a6", // teal-500
    "--theme-bg-cyan-600": "#0f766e", // teal-700

    "--theme-text-blue-300": "#bbf7d0", // green-300
    "--theme-text-blue-400": "#4ade80", // green-400
    "--theme-text-blue-500": "#22c55e", // green-500
    "--theme-text-sky-400": "#2dd4bf", // teal-400
    "--theme-text-sky-500": "#14b8a6", // teal-500
    "--theme-text-cyan-400": "#2dd4bf", // teal-400
    "--theme-text-cyan-500": "#14b8a6", // teal-500
  },
  pink: {
    "--theme-primary": "#f472b6", // pink-400
    "--theme-primary-dark": "#ec4899", // pink-500
    "--theme-primary-darker": "#be185d", // pink-700
    "--theme-primary-light": "#f9a8d4", // pink-300
    "--theme-border": "#831843", // pink-900
    "--theme-hover": "#ec4899", // pink-500
    "--theme-bg": "#2f0a23",
    "--theme-note-bg": "#831843", // pink-900
    "--theme-button-hover": "#be185d", // pink-700
    "--theme-bg-blue-400": "#f472b6", // pink-400
    "--theme-bg-blue-500": "#ec4899", // pink-500
    "--theme-bg-blue-600": "#be185d", // pink-700
    "--theme-bg-sky-400": "#e879f9", // fuchsia-400
    "--theme-bg-sky-500": "#d946ef", // fuchsia-500
    "--theme-bg-sky-600": "#c026d3", // fuchsia-600
    "--theme-bg-cyan-400": "#e879f9", // fuchsia-400
    "--theme-bg-cyan-500": "#d946ef", // fuchsia-500
    "--theme-bg-cyan-600": "#c026d3", // fuchsia-600
    "--theme-text-blue-300": "#f9a8d4", // pink-300
    "--theme-text-blue-400": "#f472b6", // pink-400
    "--theme-text-blue-500": "#ec4899", // pink-500
    "--theme-text-sky-400": "#e879f9", // fuchsia-400
    "--theme-text-sky-500": "#d946ef", // fuchsia-500
    "--theme-text-cyan-400": "#e879f9", // fuchsia-400
    "--theme-text-cyan-500": "#d946ef", // fuchsia-500
  },
  purple: {
    "--theme-primary": "#a78bfa", // purple-400
    "--theme-primary-dark": "#8b5cf6", // purple-500
    "--theme-primary-darker": "#6d28d9", // purple-700
    "--theme-primary-light": "#c4b5fd", // purple-300
    "--theme-border": "#4c1d95", // purple-900
    "--theme-hover": "#8b5cf6", // purple-500
    "--theme-bg": "#1a0a2f",
    "--theme-note-bg": "#4c1d95", // purple-900
    "--theme-button-hover": "#6d28d9", // purple-700
    "--theme-bg-blue-400": "#a78bfa", // purple-400
    "--theme-bg-blue-500": "#8b5cf6", // purple-500
    "--theme-bg-blue-600": "#6d28d9", // purple-700
    "--theme-bg-sky-400": "#818cf8", // indigo-400
    "--theme-bg-sky-500": "#6366f1", // indigo-500
    "--theme-bg-sky-600": "#4f46e5", // indigo-600
    "--theme-bg-cyan-400": "#818cf8", // indigo-400
    "--theme-bg-cyan-500": "#6366f1", // indigo-500
    "--theme-bg-cyan-600": "#4f46e5", // indigo-600
    "--theme-text-blue-300": "#c4b5fd", // purple-300
    "--theme-text-blue-400": "#a78bfa", // purple-400
    "--theme-text-blue-500": "#8b5cf6", // purple-500
    "--theme-text-sky-400": "#818cf8", // indigo-400
    "--theme-text-sky-500": "#6366f1", // indigo-500
    "--theme-text-cyan-400": "#818cf8", // indigo-400
    "--theme-text-cyan-500": "#6366f1", // indigo-500
  },
yellow: {
    "--theme-primary": "#fde047",           // yellow-400
    "--theme-primary-dark": "#facc15",       // yellow-500
    "--theme-primary-darker": "#a16207",     // yellow-700
    "--theme-primary-light": "#fef08a",      // yellow-300
    "--theme-border": "#713f12",             // yellow-900
    "--theme-hover": "#facc15",              // yellow-500
    "--theme-bg": "#2f2a0a",                 // dark background
    "--theme-note-bg": "#713f12",            // yellow-900
    "--theme-button-hover": "#a16207",       // yellow-700

    // Background derivatives
    "--theme-bg-blue-400": "#fde047",        // yellow-400
    "--theme-bg-blue-500": "#facc15",        // yellow-500
    "--theme-bg-blue-600": "#a16207",        // yellow-700
    "--theme-bg-sky-400": "#fbbf24",         // amber-400
    "--theme-bg-sky-500": "#f59e42",         // orange-500
    "--theme-bg-sky-600": "#ea580c",         // orange-600
    "--theme-bg-cyan-400": "#fbbf24",        // amber-400
    "--theme-bg-cyan-500": "#f59e42",        // orange-500
    "--theme-bg-cyan-600": "#ea580c",        // orange-600

    // Text color derivatives
    "--theme-text-blue-300": "#fef08a",      // yellow-300
    "--theme-text-blue-400": "#fde047",      // yellow-400
    "--theme-text-blue-500": "#facc15",      // yellow-500
    "--theme-text-sky-400": "#fbbf24",       // amber-400
    "--theme-text-sky-500": "#f59e42",       // orange-500
    "--theme-text-cyan-400": "#fbbf24",      // amber-400
    "--theme-text-cyan-500": "#f59e42",      // orange-500
  },
black: {
    "--theme-primary": "#64748b",            // slate-400
    "--theme-primary-dark": "#334155",       // slate-700
    "--theme-primary-darker": "#0f172a",     // slate-900
    "--theme-primary-light": "#cbd5e1",      // slate-300
    "--theme-border": "#0f172a",             // slate-900
    "--theme-hover": "#334155",              // slate-700
    "--theme-bg": "#000000",                 // true black
    "--theme-note-bg": "#0f172a",            // slate-900
    "--theme-button-hover": "#334155",       // slate-700

    // Background derivatives
    "--theme-bg-blue-400": "#64748b",        // slate-400
    "--theme-bg-blue-500": "#334155",        // slate-700
    "--theme-bg-blue-600": "#0f172a",        // slate-900
    "--theme-bg-sky-400": "#6b7280",         // gray-500
    "--theme-bg-sky-500": "#374151",         // gray-700
    "--theme-bg-sky-600": "#1f2937",         // gray-800
    "--theme-bg-cyan-400": "#6b7280",        // gray-500
    "--theme-bg-cyan-500": "#374151",        // gray-700
    "--theme-bg-cyan-600": "#1f2937",        // gray-800

    // Text color derivatives
    "--theme-text-blue-300": "#cbd5e1",      // slate-300
    "--theme-text-blue-400": "#64748b",      // slate-400
    "--theme-text-blue-500": "#334155",      // slate-700
    "--theme-text-sky-400": "#6b7280",       // gray-500
    "--theme-text-sky-500": "#374151",       // gray-700
    "--theme-text-cyan-400": "#6b7280",      // gray-500
    "--theme-text-cyan-500": "#374151",      // gray-700
  },
}

interface ThemeContextProps {
  theme: ThemeColor
  setTheme: (theme: ThemeColor) => void
}

const ThemeContext = createContext<ThemeContextProps>({
  theme: "blue",
  setTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeColor>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme-color") as ThemeColor) || "blue"
    }
    return "blue"
  })

  useEffect(() => {
    const colors = THEME_COLORS[theme]
    for (const key in colors) {
      document.documentElement.style.setProperty(key, colors[key])
    }
    localStorage.setItem("theme-color", theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useThemeColor() {
  return useContext(ThemeContext)
}

export const THEME_COLORS_META = THEME_COLORS
