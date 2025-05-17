"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { X, Star, Clock, Calendar, Film, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { fetchMovieDetailsByIMDB, getHighResolutionPoster, type OMDBResponse } from "@/services/omdb-service"

interface MovieDetailsPopupProps {
  mediaId: string
  onClose: () => void
  onPlay: () => void
}

export default function MovieDetailsPopup({ mediaId, onClose, onPlay }: MovieDetailsPopupProps) {
  const [movieDetails, setMovieDetails] = useState<OMDBResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const details = await fetchMovieDetailsByIMDB(mediaId)
        setMovieDetails(details)
      } catch (err) {
        console.error("Error fetching movie details:", err)
        setError("Failed to load movie details")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDetails()
  }, [mediaId])

  // If OMDB API is disabled or there's an error, play the movie directly
  if (!movieDetails && !isLoading) {
    onPlay()
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-4xl bg-gray-900 rounded-lg overflow-hidden shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute z-10 p-2 text-white bg-black/50 rounded-full top-4 right-4 hover:bg-black/80"
        >
          <X size={20} />
        </button>

        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-96 text-center p-4">
            <Film className="w-16 h-16 text-red-500 mb-4" />
            <p className="text-xl text-red-400 mb-4">{error}</p>
            <Button onClick={onPlay} className="bg-sky-600 hover:bg-sky-700">
              Play Anyway
            </Button>
          </div>
        ) : movieDetails ? (
          <div className="flex flex-col md:flex-row">
            {/* Poster */}
            <div className="w-full md:w-1/3 bg-gray-800">
              {movieDetails.Poster && movieDetails.Poster !== "N/A" ? (
                <img
                  src={getHighResolutionPoster(movieDetails.Poster) || "/placeholder.svg"}
                  alt={movieDetails.Title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-gray-800">
                  <Film className="w-20 h-20 text-gray-600" />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="w-full md:w-2/3 p-6 flex flex-col">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{movieDetails.Title}</h2>

              <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-300">
                {movieDetails.Released && movieDetails.Released !== "N/A" && (
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1 text-sky-400" />
                    <span>{movieDetails.Released}</span>
                  </div>
                )}

                {movieDetails.Runtime && movieDetails.Runtime !== "N/A" && (
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1 text-sky-400" />
                    <span>{movieDetails.Runtime}</span>
                  </div>
                )}

                {movieDetails.imdbRating && movieDetails.imdbRating !== "N/A" && (
                  <div className="flex items-center">
                    <Star className="w-4 h-4 mr-1 text-yellow-500" />
                    <span>{movieDetails.imdbRating}/10</span>
                  </div>
                )}
              </div>

              {movieDetails.Genre && movieDetails.Genre !== "N/A" && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {movieDetails.Genre.split(", ").map((genre) => (
                      <span
                        key={genre}
                        className="px-2 py-1 text-xs bg-gray-800 text-sky-400 rounded-md border border-gray-700"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {movieDetails.Plot && movieDetails.Plot !== "N/A" && (
                <p className="text-gray-300 mb-6 flex-grow">{movieDetails.Plot}</p>
              )}

              <Button
                onClick={onPlay}
                className="bg-sky-600 hover:bg-sky-700 text-white w-full md:w-auto self-end mt-4 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Play Movie
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-96">
            <Button onClick={onPlay} className="bg-sky-600 hover:bg-sky-700">
              Play Movie
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
