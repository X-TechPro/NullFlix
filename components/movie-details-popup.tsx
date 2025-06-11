"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { X, Star, Clock, Calendar, Film, Play, Share2, CircleCheckBig } from "lucide-react"
import { Button } from "@/components/ui/button"
import { fetchMovieDetailsByTMDB, getTMDBPoster } from "@/services/tmdb-service"
import { useToast } from "@/hooks/use-toast"

interface MovieDetailsPopupProps {
  mediaId: string
  onClose: () => void
  onPlay: () => void
}

export default function MovieDetailsPopup({ mediaId, onClose, onPlay }: MovieDetailsPopupProps) {
  const [movieDetails, setMovieDetails] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const details = await fetchMovieDetailsByTMDB(mediaId, "movie")
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

  // If TMDB API is disabled or there's an error, play the movie directly
  if (!movieDetails && !isLoading) {
    onPlay()
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2 sm:p-4 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-4xl bg-gray-900 rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute z-20 p-2 text-white bg-black/50 rounded-full top-2 right-2 hover:bg-black/80"
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
            <Button onClick={onPlay} className="bg-[color:var(--theme-primary)] hover:bg-[color:var(--theme-button-hover)]">
              Play Anyway
            </Button>
          </div>
        ) : movieDetails ? (
          <div className="flex flex-col md:flex-row overflow-hidden">
            {/* Poster */}
            <div className="w-full md:w-1/3 bg-gray-800 max-h-[300px] md:max-h-none relative group flex items-center justify-center">
              {movieDetails.poster_path ? (
                <>
                  <img
                    src={getTMDBPoster(movieDetails.poster_path) || "/placeholder.svg"}
                    alt={movieDetails.title}
                    className="w-full h-full object-cover max-h-[300px] md:max-h-none"
                  />
                  {/* Hover overlay for share */}
                  <button
                    className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 cursor-pointer"
                    onClick={() => {
                      const url = `${window.location.origin}${window.location.pathname}?watch=${mediaId}`
                      navigator.clipboard.writeText(url)
                      setCopied(true);
                      toast({ title: "Link copied!", description: "Share this link to watch directly." })
                      setTimeout(() => setCopied(false), 1500);
                    }}
                  >
                    {copied ? (
                      <>
                        <CircleCheckBig className="w-8 h-8 text-green-400 mb-2" />
                        <span className="text-green-400 font-semibold text-base">Copied</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-8 h-8 text-white mb-2" />
                        <span className="text-white font-semibold text-base">Share this movie</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-gray-800">
                  <Film className="w-20 h-20 text-gray-600" />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="w-full md:w-2/3 p-4 sm:p-6 flex flex-col relative">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 break-words">
                {movieDetails.title}
              </h2>

              <div className="flex flex-wrap gap-2 sm:gap-4 mb-3 sm:mb-4 text-xs sm:text-sm text-gray-300">
                {movieDetails.release_date && movieDetails.release_date !== "N/A" && (
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1 text-[color:var(--theme-primary-light)]" />
                    <span>{new Date(movieDetails.release_date).toLocaleDateString()}</span>
                  </div>
                )}

                {movieDetails.runtime && movieDetails.runtime !== "N/A" && (
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1 text-[color:var(--theme-primary-light)]" />
                    <span>{movieDetails.runtime} minutes</span>
                  </div>
                )}

                {movieDetails.vote_average && movieDetails.vote_average !== "N/A" && (
                  <div className="flex items-center">
                    <Star className="w-4 h-4 mr-1 text-yellow-500" />
                    <span>{movieDetails.vote_average}/10</span>
                  </div>
                )}
              </div>

              {movieDetails.genres && movieDetails.genres.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {movieDetails.genres.map((genre: any) => (
                      <span
                        key={genre.id}
                        className="px-2 py-1 text-xs bg-gray-800 text-[color:var(--theme-primary-light)] rounded-md border border-gray-700"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6 flex-grow">{movieDetails.overview}</p>
              {/* Move hover text here, bottom left under description */}
              <span className="absolute left-4 bottom-4 text-xs text-white/80 bg-black/60 px-2 py-1 rounded shadow z-20 select-none">
                Hover the poster
              </span>
              <Button
                onClick={() => {
                  // Save the movie title to localStorage for snayer provider
                  if (typeof window !== "undefined" && movieDetails && movieDetails.title) {
                    localStorage.setItem("snayerTitle", movieDetails.title)
                  }
                  onPlay()
                }}
                className="bg-[color:var(--theme-primary)] hover:bg-[color:var(--theme-button-hover)] text-white w-full md:w-auto self-end mt-4 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Play Movie
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-96">
            <Button onClick={() => {
              if (typeof window !== "undefined" && movieDetails && movieDetails.title) {
                localStorage.setItem("snayerTitle", movieDetails.title)
              }
              onPlay()
            }} className="bg-[color:var(--theme-primary)] hover:bg-[color:var(--theme-button-hover)]">
              Play Movie
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
