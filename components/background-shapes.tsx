"use client"

import { motion } from "framer-motion"

export default function BackgroundShapes() {
  const shapes = [
    { type: "circle", size: "w-24 h-24", color: "bg-blue-500/20", position: "top-20 left-[10%]", delay: 0 },
    { type: "square", size: "w-32 h-32", color: "bg-cyan-500/20", position: "top-40 right-[15%]", delay: 0.2 },
    {
      type: "triangle",
      size: "w-20 h-20",
      color: "border-t-cyan-400/20",
      position: "bottom-40 left-[20%]",
      delay: 0.4,
    },
    { type: "circle", size: "w-40 h-40", color: "bg-blue-500/20", position: "bottom-20 right-[25%]", delay: 0.6 },
    { type: "square", size: "w-16 h-16", color: "bg-cyan-400/20", position: "top-[30%] left-[30%]", delay: 0.8 },
    { type: "circle", size: "w-12 h-12", color: "bg-blue-400/20", position: "bottom-[35%] right-[5%]", delay: 1 },
    // Add more shapes for enhanced background
    { type: "circle", size: "w-20 h-20", color: "bg-blue-600/20", position: "top-[60%] left-[5%]", delay: 1.2 },
    { type: "square", size: "w-24 h-24", color: "bg-cyan-600/20", position: "bottom-[10%] left-[40%]", delay: 1.4 },
    { type: "circle", size: "w-36 h-36", color: "bg-blue-600/20", position: "top-[10%] right-[30%]", delay: 1.6 },
  ]

  // Movie-related icons as SVG paths
  const movieIcons = [
    {
      path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-3.5l6-4.5-6-4.5z",
      position: "top-[15%] left-[40%]",
      delay: 0.3,
    },
    {
      path: "M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z",
      position: "bottom-[25%] left-[60%]",
      delay: 0.7,
    },
    {
      path: "M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2zM8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z",
      position: "top-[45%] right-[20%]",
      delay: 1.1,
    },
    {
      path: "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z",
      position: "bottom-[15%] left-[25%]",
      delay: 0.5,
    },
    // Add more movie icons
    {
      path: "M4 6.47L5.76 10H20v8H4V6.47M22 4h-4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4z",
      position: "top-[5%] right-[10%]",
      delay: 0.9,
    },
    {
      path: "M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2zM8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z",
      position: "bottom-[45%] left-[8%]",
      delay: 1.3,
    },
  ]

  return (
    <div className="absolute inset-0 overflow-hidden">
      {shapes.map((shape, index) => (
        <motion.div
          key={`shape-${index}`}
          className={`absolute ${shape.size} ${shape.position} rounded-full ${shape.type === "square" ? "rounded-lg" : ""} ${shape.type === "triangle" ? "triangle" : ""} ${shape.color} backdrop-blur-xl`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [1, 1.1, 1],
            rotate: [0, shape.type === "square" ? 10 : 0, 0],
          }}
          transition={{
            duration: 8,
            delay: shape.delay,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
          style={
            shape.type === "triangle"
              ? {
                  width: 0,
                  height: 0,
                  backgroundColor: "transparent",
                  borderLeft: "25px solid transparent",
                  borderRight: "25px solid transparent",
                  borderBottom: "50px solid rgba(34, 211, 238, 0.2)",
                }
              : {}
          }
        />
      ))}

      {movieIcons.map((icon, index) => (
        <motion.svg
          key={`icon-${index}`}
          className={`absolute ${icon.position} w-12 h-12 text-cyan-500/30`}
          viewBox="0 0 24 24"
          initial={{ opacity: 0, rotate: -10 }}
          animate={{
            opacity: [0.2, 0.5, 0.2],
            rotate: [0, 10, 0],
            scale: [1, 1.1, 1],
            y: [0, -10, 0],
          }}
          transition={{
            duration: 10,
            delay: icon.delay,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
        >
          <path d={icon.path} />
        </motion.svg>
      ))}
    </div>
  )
}
