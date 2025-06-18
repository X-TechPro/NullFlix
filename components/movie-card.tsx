"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Play, Star, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Inter } from "next/font/google"

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
})

export default function Component() {
  const [selectedMovie, setSelectedMovie] = useState<string | null>(null)

  const movies = [
    {
      id: "1",
      title: "Cars",
      year: "2008",
      poster: "https://image.tmdb.org/t/p/w500//2Touk3m5gzsqr1VsvxypdyHY5ci.jpg",
      description:
        "An epic journey through the cosmos as humanity discovers ancient alien technology that could either save or destroy civilization. Follow Captain Sarah Chen and her diverse crew as they navigate political intrigue, cosmic mysteries, and the ultimate question of humanity's place in the universe.",
      rating: 8.7,
      runtime: "2h 28m",
      genre: "Sci-Fi Adventure",
    },
    {
      id: "2",
      title: "Cars 2",
      year: "2011",
      poster: "https://image.tmdb.org/t/p/w500//okIz1HyxeVOMzYwwHUjH2pHi74I.jpg",
      description:
        "In a cyberpunk future where memories can be stolen and sold, a rogue hacker discovers a conspiracy that threatens to erase the identity of an entire generation. Racing against time through neon-lit streets and virtual realities, she must decide what's worth remembering.",
      rating: 9.1,
      runtime: "1h 56m",
      genre: "Cyberpunk Thriller",
    },
    {
      id: "3",
      title: "Cars 3",
      year: "2017",
      poster: "https://image.tmdb.org/t/p/w500//fyy1nDC8wm553FCiBDojkJmKLCs.jpg",
      description:
        "After climate change has devastated Earth, a botanist discovers the last remaining seed vault hidden beneath the ruins of civilization. Her journey to restore life to a barren world becomes a meditation on hope, resilience, and the power of nature to heal.",
      rating: 8.4,
      runtime: "2h 12m",
      genre: "Post-Apocalyptic Drama",
    },
    {
      id: "4",
      title: "Cars on the road",
      year: "2022",
      poster: "https://image.tmdb.org/t/p/w500//6QXirTPUQecr1BAEfgVSXPD1np0.jpg",
      description:
        "A physicist working on quantum entanglement experiments accidentally creates a connection with her parallel universe counterpart. As they fall in love across dimensions, they must find a way to be together without destroying both their realities.",
      rating: 7.9,
      runtime: "1h 48m",
      genre: "Sci-Fi Romance",
    },
    {
      id: "5",
      title: "Shadow Protocol",
      year: "2024",
      poster: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=300&h=400&fit=crop&crop=center",
      description:
        "An elite special forces operative discovers that her latest mission is part of a larger conspiracy involving international arms dealers and corrupt government officials. With nowhere to turn, she must use all her skills to expose the truth and survive.",
      rating: 8.2,
      runtime: "2h 4m",
      genre: "Action Thriller",
    },
    {
      id: "6",
      title: "Wall-E",
      year: "2008",
      poster: "https://image.tmdb.org/t/p/w500//hbhFnRzzg6ZDmm8YAmxBnQpQIPh.jpg",
      description:
        "A mysterious library that appears only at midnight holds books containing the stories of lives never lived. When a young writer stumbles upon it, she must choose between exploring infinite possibilities or returning to her own imperfect reality.",
      rating: 8.8,
      runtime: "1h 42m",
      genre: "Fantasy Drama",
    },
  ]

  const selectedMovieData = movies.find((m) => m.id === selectedMovie)

  // Calculate dynamic animation based on card position
  const getCardPosition = (movieId: string) => {
    const movieIndex = movies.findIndex((m) => m.id === movieId)
    const row = Math.floor(movieIndex / 3)
    const col = movieIndex % 3

    // Calculate approximate position relative to viewport center
    const cardCenterX = (col - 1) * 300 // Approximate card width + gap
    const cardCenterY = (row - 1) * 200 // Approximate card height + gap

    return { x: cardCenterX, y: cardCenterY }
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-8 ${inter.className}`}>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 max-w-7xl mx-auto">
        {movies.map((movie) => (
          <motion.div
            key={movie.id}
            layoutId={`card-${movie.id}`}
            onClick={() => setSelectedMovie(movie.id)}
            className="bg-slate-800 rounded-2xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow duration-200 border border-slate-700 will-change-transform"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15 }}
          >
            <motion.div
              layoutId={`poster-${movie.id}`}
              className="relative h-36 md:h-44 overflow-hidden transform-gpu will-change-transform"
            >
              {/* Blurred background */}
              <div
                className="absolute inset-0 bg-cover bg-center filter blur-lg scale-110"
                style={{ backgroundImage: `url(${movie.poster || "/placeholder.svg"})` }}
              />

              {/* Stronger vignette overlay */}
              {/*
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40" />
              */}

              {/* Main poster image */}
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src={movie.poster || "/placeholder.svg"}
                  alt={movie.title}
                  className="h-full w-auto object-contain max-w-[80%]"
                />
              </div>

              {/* Movie pill - top left */}
              <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">
                Movie
              </div>

              {/* Bookmark button - top right */}
              <button className="absolute top-3 right-3 w-8 h-8 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
              </button>

              <motion.div
                layoutId={`overlay-${movie.id}`}
                className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transform-gpu will-change-transform"
              />
            </motion.div>

            <motion.div layoutId={`content-${movie.id}`} className="p-3 md:p-4 transform-gpu will-change-transform">
              <motion.h2
                layoutId={`title-${movie.id}`}
                className="text-sm md:text-base font-bold text-white mb-2 transform-gpu will-change-transform"
              >
                {movie.title}
              </motion.h2>
              <div className="flex items-center gap-2">
                <motion.div
                  layoutId={`year-${movie.id}`}
                  className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded-full text-blue-400 font-medium text-xs border border-sky-600 will-change-transform"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {movie.year}
                </motion.div>
                <div className="bg-black/50 px-2 py-1 rounded-full text-blue-400 font-medium text-xs border border-sky-600">
                  TMDB: {movie.rating}
                </div>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedMovie && selectedMovieData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start md:items-center justify-center p-2 md:p-4 transform-gpu will-change-transform"
            onClick={() => setSelectedMovie(null)}
          >
            <motion.div
              layoutId={`card-${selectedMovieData.id}`}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 border border-slate-700 rounded-3xl overflow-hidden w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] flex flex-col shadow-2xl will-change-transform"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{
                type: "tween",
                duration: 0.12,
                ease: [0.25, 1, 0.5, 1], // easeOutExpo style, buttery af
              }}
            >
              {/* Improved scrollable container with sticky poster on desktop */}
              <div className="overflow-y-auto flex flex-col md:flex-row h-full">
                {/* Poster section - sticky on desktop, normal scroll on mobile */}
                <div className="md:sticky md:top-0 md:h-[90vh] md:overflow-hidden">
                  <motion.div
                    layoutId={`poster-${selectedMovieData.id}`}
                    className="relative w-full md:w-80 h-64 md:h-[90vh] flex-shrink-0 transform-gpu will-change-transform"
                  >
                    <img
                      src={selectedMovieData.poster || "/placeholder.svg"}
                      alt={selectedMovieData.title}
                      className="w-full h-full object-cover"
                    />
                    <motion.div
                      layoutId={`overlay-${selectedMovieData.id}`}
                      className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transform-gpu will-change-transform"
                    />

                    {/* Close button for mobile - top right of poster */}
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2, duration: 0.2 }}
                      className="absolute top-4 right-4 md:hidden bg-black/50 backdrop-blur-sm rounded-full p-2 text-white hover:bg-black/70 transition-colors duration-150 transform-gpu"
                      onClick={() => setSelectedMovie(null)}
                    >
                      <X className="w-6 h-6" />
                    </motion.button>
                  </motion.div>
                </div>

                {/* Content section - scrollable */}
                <motion.div
                  layoutId={`content-${selectedMovieData.id}`}
                  className="flex-1 md:overflow-y-auto transform-gpu will-change-transform"
                >
                  <div className="p-4 md:p-8 flex flex-col justify-between min-h-full">
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <motion.h2
                          layoutId={`title-${selectedMovieData.id}`}
                          className="text-2xl md:text-4xl font-bold text-white pr-4 transform-gpu will-change-transform"
                        >
                          {selectedMovieData.title}
                        </motion.h2>

                        {/* Close button for desktop - next to title */}
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2, duration: 0.2 }}
                          className="hidden md:block bg-slate-700 hover:bg-slate-600 rounded-full p-2 text-slate-300 hover:text-white transition-colors duration-150 flex-shrink-0 transform-gpu"
                          onClick={() => setSelectedMovie(null)}
                        >
                          <X className="w-6 h-6" />
                        </motion.button>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-4 md:mb-6">
                        <motion.div
                          layoutId={`year-${selectedMovieData.id}`}
                          className="flex items-center gap-1 bg-slate-700 px-3 py-1 rounded-full text-slate-200 font-medium text-base md:text-lg will-change-transform"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {selectedMovieData.year}
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, scale: 0.8, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{
                            delay: 0.05,
                            duration: 0.15,
                            ease: [0.25, 0.1, 0.25, 1],
                          }}
                          className="flex items-center gap-2 bg-slate-700 px-3 py-1 rounded-full transform-gpu will-change-transform"
                        >
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-slate-200 font-medium text-sm md:text-base">
                            {selectedMovieData.rating}
                          </span>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, scale: 0.8, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{
                            delay: 0.08,
                            duration: 0.15,
                            ease: [0.25, 0.1, 0.25, 1],
                          }}
                          className="flex items-center gap-2 bg-slate-700 px-3 py-1 rounded-full transform-gpu will-change-transform"
                        >
                          <Clock className="w-4 h-4 text-slate-300" />
                          <span className="text-slate-200 font-medium text-sm md:text-base">
                            {selectedMovieData.runtime}
                          </span>
                        </motion.div>
                      </div>

                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: 0.1,
                          duration: 0.2,
                          ease: [0.25, 0.1, 0.25, 1],
                        }}
                        className="mb-6 md:mb-8 transform-gpu"
                      >
                        <motion.span
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.12, duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
                          className="inline-block bg-gradient-to-r from-sky-500 to-blue-500 text-white px-3 md:px-4 py-1 rounded-full text-xs md:text-sm font-medium mb-3 md:mb-4 transform-gpu will-change-transform"
                        >
                          {selectedMovieData.genre}
                        </motion.span>
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.15, duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                          className="text-slate-300 leading-relaxed text-sm md:text-lg transform-gpu will-change-transform"
                        >
                          {selectedMovieData.description}
                        </motion.p>
                      </motion.div>
                    </div>

                    {/* Play button with improved animation */}
                    <motion.div
                      initial={{ opacity: 0, y: 40, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{
                        delay: 0.18,
                        duration: 0.2,
                        ease: [0.25, 0.1, 0.25, 1],
                      }}
                      className="flex justify-end pt-4 border-t border-slate-700 md:border-t-0 md:pt-0 transform-gpu will-change-transform"
                    >
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-full px-6 md:px-8 py-2 md:py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-sm md:text-base"
                      >
                        <Play className="w-4 md:w-5 h-4 md:h-5 mr-2 fill-white" />
                        Play Now
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
