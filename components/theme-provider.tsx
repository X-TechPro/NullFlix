"use client"
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes"
import { ThemeProvider as ThemeColorProvider } from "@/components/theme-color-context"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <ThemeColorProvider>{children}</ThemeColorProvider>
  )
}
