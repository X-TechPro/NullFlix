"use client"

import { motion } from "framer-motion"
import { ArrowLeft, Film, Bookmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

interface MovieResultsProps {
  results: any[]
  toggleBookmark: (movie: any) => void
  isBookmarked: (id: string, tmdbId?: string) => boolean
}

export default function MovieResults({ results, toggleBookmark, isBookmarked }: MovieResultsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="py-8"
    >
      <Button
        variant="ghost"
        className="mb-6 text-blue-300 hover:text-white hover:bg-blue-800/30"
        onClick={() => window.location.reload()}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to search
      </Button>

      <h2 className="mb-6 text-2xl font-bold text-white">Search Results</h2>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {results.map((movie, index) => (
          <motion.div
            key={movie.id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="overflow-hidden bg-gray-800/80 border-gray-700/30 backdrop-blur-md hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 group">
              <div className="relative aspect-[2/3] w-full overflow-hidden">
                {movie.poster ? (
                  <Image
                    src={movie.poster}
                    alt={movie.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full bg-blue-800/50">
                    <Film className="w-16 h-16 text-blue-300/50" />
                  </div>
                )}
                <motion.button
                  className={`absolute top-2 right-2 p-2 rounded-full ${isBookmarked(movie.id) ? "bg-cyan-600 text-white" : "bg-black/70 text-white/70 hover:bg-cyan-900/80"} transition-colors duration-300`}
                  onClick={() => toggleBookmark(movie)}
                  whileHover={{ scale: 1.1, boxShadow: "0 0 8px rgb(255 0 0)" }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Bookmark className="w-4 h-4" fill={isBookmarked(movie.id) ? "currentColor" : "none"} />
                </motion.button>
              </div>
              <CardContent className="p-4">
                <h3 className="text-lg font-medium text-white line-clamp-1">{movie.title}</h3>
                <p className="text-sm text-blue-300">{movie.year}</p>
                <div className="flex items-center mt-2">
                  <span className="px-2 py-1 text-xs text-cyan-400 bg-black/50 border border-cyan-900/30 rounded-md">
                    {movie.type || "movie"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {results.length === 0 && (
        <div className="p-8 text-center">
          <p className="text-blue-300">No results found. Try a different search term.</p>
        </div>
      )}
    </motion.div>
  )
}
