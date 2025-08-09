"use client"

import { useState, useEffect, type RefObject } from "react"

interface GlowOptions {
  radius?: number
  intensity?: number
  color?: string
  falloff?: number
}

export function useMouseGlow(elementRef: RefObject<HTMLElement>, options: GlowOptions = {}) {
  const { radius = 200, intensity = 0.15, color = "255, 255, 255", falloff = 85 } = options

  const [isHovering, setIsHovering] = useState(false)
  const [glowPosition, setGlowPosition] = useState({ x: 0, y: 0 })
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!elementRef.current) return

    const element = elementRef.current

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect()

      // Check if mouse is over the element
      const isOver =
        e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom

      if (isOver) {
        setIsHovering(true)

        // Calculate relative position within the element
        const relativeX = e.clientX - rect.left
        const relativeY = e.clientY - rect.top

        setMousePos({ x: relativeX, y: relativeY })
      } else {
        setIsHovering(false)
      }
    }

    const handleMouseLeave = () => {
      setIsHovering(false)
    }

    // Add event listeners
    window.addEventListener("mousemove", handleMouseMove)
    element.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      element.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [elementRef])

  // Update glow position based on mouse position
  useEffect(() => {
    if (!isHovering || !elementRef.current) {
      return
    }

    const rect = elementRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    // Calculate the percentage position for the glow
    const xPercent = (mousePos.x / width) * 100
    const yPercent = (mousePos.y / height) * 100

    setGlowPosition({ x: xPercent, y: yPercent })
  }, [isHovering, mousePos, elementRef])

  return { isHovering, glowPosition, radius, intensity, color, falloff }
}
