import React, { createContext, useContext, useState, useEffect } from "react"
import type { JSX } from "react"

export type ThemeColor = "blue" | "red" | "green" | "pink" | "purple" | "yellow" | "black"

const THEME_COLORS: Record<ThemeColor, Record<string, string>> = {
  blue: {
    "--theme-primary": "#0284c7", // sky-600
    "--theme-primary-dark": "", // 
    "--theme-primary-darker": "", // 
    "--theme-primary-light": "#38bdf8", // sky-400
    "--theme-primary-lighter": "#7dd3fc", // sky-300

    "--theme-secondary": "#2563eb", // blue-600
    "--theme-secondary-dark": "", // 
    "--theme-secondary-darker": "", // 
    "--theme-secondary-light": "#60a5fa", // blue-400
    "--theme-secondary-lighter": "#93c5fd", // blue-300

    "--theme-border": "#334155", // slate-700
    "--theme-hover": "#1e40af4d", // blue-800/30
    "--theme-button-hover": "#0369a1", // sky-700
    "--theme-shadow": "#0E95E9B3", // between blue and cyan

    // Shape background colors for background-shapes.tsx
    "--theme-shape1": "#3b82f633", // blue-500/20
    "--theme-shape2": "#06b6d433", // cyan-500/20
    "--theme-shape3": "#22d3ee33", // cyan-400/20
    "--theme-shape4": "#60a5fa33", // blue-400/20
    "--theme-shape5": "#2563eb33", // blue-600/20
    "--theme-shape6": "#0ea5e933", // cyan-600/20
    "--theme-shape7": "#38bdf833", // blue-400/20 (lighter)
    // Add more as needed

    // Provider container
    "--theme-container-bg-on": "#082f4966", // bg-sky-950/40
    "--theme-container-border-on": "#0ea5e9", // border-sky-500
    "--theme-container-bg-off": "#1f2937", // bg-gray-800
    "--theme-container-border-off": "#374151", // border-gray-700

    // Note
    "--theme-note-border": "#1e40af4d", // border-blue-800/30
    "--theme-note-bg": "#1e3a8a33", // bg-blue-900/20
  },
  red: {
    "--theme-primary": "#dc2626", // red-600
    "--theme-primary-dark": "#b91c1c", // red-700
    "--theme-primary-darker": "#991b1b", // red-800
    "--theme-primary-light": "#f87171", // red-400
    "--theme-primary-lighter": "#fca5a5", // red-300

    "--theme-secondary": "#be123c", // rose-700
    "--theme-secondary-dark": "#9f1239", // rose-800
    "--theme-secondary-darker": "#881337", // rose-900
    "--theme-secondary-light": "#fb7185", // rose-400
    "--theme-secondary-lighter": "#fda4af", // rose-300

    "--theme-border": "#7f1d1d", // red-900
    "--theme-hover": "#b91c1c4d", // red-700/30
    "--theme-button-hover": "#b91c1c", // red-700
    "--theme-shadow": "#F87171B3", // red-400/70

    // Shape background colors for background-shapes.tsx
    "--theme-shape1": "#f8717133", // red-400/20
    "--theme-shape2": "#fb718533", // rose-400/20
    "--theme-shape3": "#fca5a533", // red-300/20
    "--theme-shape4": "#fca5a533", // red-300/20 (lighter)
    "--theme-shape5": "#be123c33", // rose-700/20
    "--theme-shape6": "#f43f5e33", // rose-500/20
    "--theme-shape7": "#f8717133", // red-400/20 (lighter)

    // Provider container
    "--theme-container-bg-on": "#450a0a66", // bg-red-950/40
    "--theme-container-border-on": "#ef4444", // border-red-500
    "--theme-container-bg-off": "#1f2937", // bg-gray-800
    "--theme-container-border-off": "#374151", // border-gray-700

    // Note
    "--theme-note-border": "#b91c1c4d", // border-red-700/30
    "--theme-note-bg": "#7f1d1d33", // bg-red-900/20
  },
  green: {
    "--theme-primary": "#16a34a", // green-600
    "--theme-primary-dark": "#15803d", // green-700
    "--theme-primary-darker": "#166534", // green-800
    "--theme-primary-light": "#4ade80", // green-400
    "--theme-primary-lighter": "#86efac", // green-300

    "--theme-secondary": "#22c55e", // green-500
    "--theme-secondary-dark": "#15803d", // green-700
    "--theme-secondary-darker": "#166534", // green-800
    "--theme-secondary-light": "#6ee7b7", // emerald-300
    "--theme-secondary-lighter": "#bbf7d0", // green-200

    "--theme-border": "#14532d", // green-900
    "--theme-hover": "#15803d4d", // green-700/30
    "--theme-button-hover": "#15803d", // green-700
    "--theme-shadow": "#4ADE80B3", // green-400/70

    // Shape background colors for background-shapes.tsx
    "--theme-shape1": "#4ade8033", // green-400/20
    "--theme-shape2": "#6ee7b733", // emerald-300/20
    "--theme-shape3": "#bbf7d033", // green-200/20
    "--theme-shape4": "#bbf7d033", // green-200/20 (lighter)
    "--theme-shape5": "#16a34a33", // green-600/20
    "--theme-shape6": "#22d3ee33", // cyan-400/20
    "--theme-shape7": "#4ade8033", // green-400/20 (lighter)

    // Provider container
    "--theme-container-bg-on": "#052e1666", // bg-green-950/40
    "--theme-container-border-on": "#22d3ee", // border-cyan-400
    "--theme-container-bg-off": "#1f2937", // bg-gray-800
    "--theme-container-border-off": "#374151", // border-gray-700

    // Note
    "--theme-note-border": "#15803d4d", // border-green-700/30
    "--theme-note-bg": "#14532d33", // bg-green-900/20
  },
  pink: {
    "--theme-primary": "#db2777", // pink-600
    "--theme-primary-dark": "#be185d", // pink-700
    "--theme-primary-darker": "#9d174d", // pink-800
    "--theme-primary-light": "#f472b6", // pink-400
    "--theme-primary-lighter": "#f9a8d4", // pink-300

    "--theme-secondary": "#e11d48", // rose-600
    "--theme-secondary-dark": "#be123c", // rose-700
    "--theme-secondary-darker": "#9f1239", // rose-800
    "--theme-secondary-light": "#fb7185", // rose-400
    "--theme-secondary-lighter": "#fda4af", // rose-300

    "--theme-border": "#831843", // pink-900
    "--theme-hover": "#be185d4d", // pink-700/30
    "--theme-button-hover": "#be185d", // pink-700
    "--theme-shadow": "#F472B6B3", // pink-400/70

    // Shape background colors for background-shapes.tsx
    "--theme-shape1": "#f472b633", // pink-400/20
    "--theme-shape2": "#fb718533", // rose-400/20
    "--theme-shape3": "#f9a8d433", // pink-300/20
    "--theme-shape4": "#f9a8d433", // pink-300/20 (lighter)
    "--theme-shape5": "#be185d33", // pink-700/20
    "--theme-shape6": "#ec489933", // pink-500/20
    "--theme-shape7": "#f472b633", // pink-400/20 (lighter)

    // Provider container
    "--theme-container-bg-on": "#50072466", // bg-pink-950/40
    "--theme-container-border-on": "#ec4899", // border-pink-500
    "--theme-container-bg-off": "#1f2937", // bg-gray-800
    "--theme-container-border-off": "#374151", // border-gray-700

    // Note
    "--theme-note-border": "#be185d4d", // border-pink-700/30
    "--theme-note-bg": "#83184333", // bg-pink-900/20
  },
  purple: {
    "--theme-primary": "#7c3aed", // purple-600
    "--theme-primary-dark": "#6d28d9", // purple-700
    "--theme-primary-darker": "#5b21b6", // purple-800
    "--theme-primary-light": "#a78bfa", // purple-400
    "--theme-primary-lighter": "#c4b5fd", // purple-300

    "--theme-secondary": "#8b5cf6", // violet-500
    "--theme-secondary-dark": "#7c3aed", // violet-600
    "--theme-secondary-darker": "#6d28d9", // violet-700
    "--theme-secondary-light": "#a5b4fc", // indigo-300
    "--theme-secondary-lighter": "#ddd6fe", // violet-200

    "--theme-border": "#4c1d95", // purple-900
    "--theme-hover": "#6d28d94d", // purple-700/30
    "--theme-button-hover": "#6d28d9", // purple-700
    "--theme-shadow": "#A78BFA99", // purple-400/60

    // Shape background colors for background-shapes.tsx
    "--theme-shape1": "#a78bfa33", // purple-400/20
    "--theme-shape2": "#a5b4fc33", // indigo-300/20
    "--theme-shape3": "#c4b5fd33", // purple-300/20
    "--theme-shape4": "#c4b5fd33", // purple-300/20 (lighter)
    "--theme-shape5": "#7c3aed33", // purple-600/20
    "--theme-shape6": "#8b5cf633", // violet-500/20
    "--theme-shape7": "#a78bfa33", // purple-400/20 (lighter)

    // Provider container
    "--theme-container-bg-on": "#2e106566", // bg-purple-950/40
    "--theme-container-border-on": "#a21caf", // border-fuchsia-700
    "--theme-container-bg-off": "#1f2937", // bg-gray-800
    "--theme-container-border-off": "#374151", // border-gray-700

    // Note
    "--theme-note-border": "#6d28d94d", // border-purple-700/30
    "--theme-note-bg": "#4c1d9533", // bg-purple-900/20
  },
  yellow: {
    "--theme-primary": "#eab308", // yellow-500
    "--theme-primary-dark": "#ca8a04", // yellow-600
    "--theme-primary-darker": "#a16207", // yellow-700
    "--theme-primary-light": "#fde047", // yellow-300
    "--theme-primary-lighter": "#fef08a", // yellow-200

    "--theme-secondary": "#f59e42", // orange-400
    "--theme-secondary-dark": "#ea580c", // orange-600
    "--theme-secondary-darker": "#c2410c", // orange-700
    "--theme-secondary-light": "#fdba74", // orange-300
    "--theme-secondary-lighter": "#fed7aa", // orange-200

    "--theme-border": "#713f12", // yellow-900
    "--theme-hover": "#ca8a044d", // yellow-600/30
    "--theme-button-hover": "#ca8a04", // yellow-600
    "--theme-shadow": "#FDE047B3", // yellow-300/70

    // Shape background colors for background-shapes.tsx
    "--theme-shape1": "#fde04733", // yellow-300/20
    "--theme-shape2": "#fdba7433", // orange-300/20
    "--theme-shape3": "#fef08a33", // yellow-200/20
    "--theme-shape4": "#fef08a33", // yellow-200/20 (lighter)
    "--theme-shape5": "#eab30833", // yellow-500/20
    "--theme-shape6": "#f59e4233", // orange-400/20
    "--theme-shape7": "#fde04733", // yellow-300/20 (lighter)

    // Provider container
    "--theme-container-bg-on": "#42200666", // bg-yellow-950/40
    "--theme-container-border-on": "#facc15", // border-yellow-400
    "--theme-container-bg-off": "#1f2937", // bg-gray-800
    "--theme-container-border-off": "#374151", // border-gray-700

    // Note
    "--theme-note-border": "#ca8a044d", // border-yellow-600/30
    "--theme-note-bg": "#713f1233", // bg-yellow-900/20
  },
  black: {
    "--theme-primary": "#18181b", // zinc-900
    "--theme-primary-dark": "#09090b", // zinc-950
    "--theme-primary-darker": "#000000", // black
    "--theme-primary-light": "#52525b", // zinc-600
    "--theme-primary-lighter": "#a1a1aa", // zinc-400

    "--theme-secondary": "#27272a", // zinc-800
    "--theme-secondary-dark": "#18181b", // zinc-900
    "--theme-secondary-darker": "#09090b", // zinc-950
    "--theme-secondary-light": "#71717a", // zinc-500
    "--theme-secondary-lighter": "#d4d4d8", // zinc-300

    "--theme-border": "#27272a", // zinc-800
    "--theme-hover": "#18181b4d", // zinc-900/30
    "--theme-button-hover": "#27272a", // zinc-800
    "--theme-shadow": "#18181b99", // zinc-900/60

    // Shape background colors for background-shapes.tsx
    "--theme-shape1": "#52525b33", // zinc-600/20
    "--theme-shape2": "#71717a33", // zinc-500/20
    "--theme-shape3": "#a1a1aa33", // zinc-400/20
    "--theme-shape4": "#a1a1aa33", // zinc-400/20 (lighter)
    "--theme-shape5": "#18181b33", // zinc-900/20
    "--theme-shape6": "#27272a33", // zinc-800/20
    "--theme-shape7": "#52525b33", // zinc-600/20 (lighter)

    // Provider container
    "--theme-container-bg-on": "#09090b66", // zinc-950/40
    "--theme-container-border-on": "#27272a", // zinc-800
    "--theme-container-bg-off": "#18181b", // zinc-900
    "--theme-container-border-off": "#27272a", // zinc-800

    // Note
    "--theme-note-border": "#18181b4d", // border-zinc-900/30
    "--theme-note-bg": "#27272a33", // bg-zinc-800/20
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
