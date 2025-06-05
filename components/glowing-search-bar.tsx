"use client"

import type React from "react"

import { useRef, useState, useEffect, type RefObject } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useMouseGlow } from "@/hooks/use-mouse-glow"

interface GlowingSearchBarProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  placeholder?: string
  className?: string
}

export default function GlowingSearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = "What do you want to watch?",
  className = "",
}: GlowingSearchBarProps) {
  // Fix typing for searchBarRef and useMouseGlow
  const searchBarRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isHoveringContainer, setIsHoveringContainer] = useState(false)

  // Check if we're on a mobile device
  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
  }, [])

  // Use our custom hook for the glow effect - only for the input part
  const { isHovering, glowPosition, radius, intensity, color, falloff } = useMouseGlow(searchBarRef as unknown as React.RefObject<HTMLElement>, {
    radius: 200,
    intensity: 0.15, // Further reduced intensity
    color: "255, 255, 255",
    falloff: 85, // Increased falloff for an even more gradual fade
  })

  // Base shadow for both input and button
  const baseShadow = "0 4px 12px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2)"

  // Enhanced shadow when hovering - but not as bright
  const enhancedShadow = isHovering ? `${baseShadow}, 0 0 15px rgba(255, 255, 255, 0.1)` : baseShadow

  // Handle hover state for the container
  const handleMouseEnter = () => setIsHoveringContainer(true)
  const handleMouseLeave = () => setIsHoveringContainer(false)

  // Border style when hovering
  const hoverBorder = isHoveringContainer ? "border-gray-500" : "border-[color:var(--theme-border)]/30"

  return (
    <form onSubmit={onSubmit} className={`relative w-full ${className}`}>
      <div className="relative flex w-full p-2 sm:p-0">
        {/* Input container with glow effect */}
        <div ref={searchBarRef} className="relative flex-1">
          {/* Glow effect overlay - only for the input part */}
          {!isMobile && isHovering && (
            <div
              className="absolute inset-0 pointer-events-none rounded-l-full z-0 overflow-hidden"
              style={{
                background: `radial-gradient(circle ${radius}px at ${glowPosition.x}% ${glowPosition.y}%, rgba(${color}, ${intensity}), rgba(${color}, 0.08) ${falloff}%, rgba(${color}, 0.02) 100%)`,
              }}
            />
          )}

          {/* Actual input field - background remains consistent */}
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            className={`w-full py-6 pl-12 pr-4 text-lg bg-white/10 backdrop-blur-md text-white placeholder:text-[color:var(--theme-primary-light)]/70 focus-visible:ring-[color:var(--theme-primary-dark)] rounded-l-full transition-all duration-300 relative z-10 ${hoverBorder} border-0`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              boxShadow: enhancedShadow,
              borderRight: isHoveringContainer
                ? "1px solid rgba(107, 114, 128, 0.5)"
                : "1px solid var(--theme-border)",
            }}
          />

          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20">
            <Search className="h-5 w-5 text-[color:var(--theme-primary-light)]" />
          </div>
        </div>

        {/* Button - separate from the glow effect */}
        <Button
          type="submit"
          className={`rounded-r-full bg-[color:var(--theme-primary-dark)] hover:bg-[color:var(--theme-primary-darker)] text-white px-6 h-auto relative z-10 transition-all duration-300 ${isHoveringContainer ? "border-gray-500" : "border-[color:var(--theme-border)]/30"}`}
          style={{
            boxShadow: baseShadow, // Always use base shadow for button
            borderLeft: "none", // Remove left border to avoid double border with input
          }}
        >
          Search
        </Button>
      </div>
    </form>
  )
}
