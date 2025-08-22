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
  cardRect?: DOMRect | null
}

export default function MovieDetailsPopup({ mediaId, onClose, onPlay, cardRect }: MovieDetailsPopupProps) {
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start md:items-center justify-center p-2 md:p-4 transform-gpu will-change-transform">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-800 border border-slate-700 rounded-3xl overflow-hidden w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] flex flex-col shadow-2xl will-change-transform relative"
      >
        <button
          onClick={onClose}
          className="absolute z-30 p-2 text-white bg-black/50 backdrop-blur-sm rounded-full top-4 right-4 hover:bg-black/70 transition-colors duration-150"
        >
          <X size={24} />
        </button>
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-96 text-center p-4">
            <Film className="w-16 h-16 text-red-500 mb-4" />
            <p className="text-xl text-red-400 mb-4">{error}</p>
            <Button onClick={onPlay} className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-full px-6 md:px-8 py-2 md:py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-sm md:text-base">
              Play Anyway
            </Button>
          </div>
        ) : movieDetails ? (
          <div className="overflow-y-auto flex flex-col md:flex-row h-full">
            {/* Poster section */}
            <div className="md:sticky md:top-0 md:overflow-hidden">
              <motion.div
                className="relative w-full md:w-80 h-64 md:h-[90vh] flex-shrink-0 transform-gpu will-change-transform group"
              >
                <img
                  src={movieDetails.poster_path ? getTMDBPoster(movieDetails.poster_path) : "/placeholder.svg"}
                  alt={movieDetails.title}
                  className="w-full h-full object-cover"
                />
                {/* Hover overlay for share */}
                <button
                  className="absolute z-20 inset-0 flex flex-col items-center justify-center bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                  onClick={() => {
                    const url = `${window.location.origin}${window.location.pathname}?movie=${mediaId}`
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
              </motion.div>
            </div>
            {/* Content section */}
            <motion.div
              className="flex-1 md:overflow-y-auto transform-gpu will-change-transform"
            >
              <div className="p-4 md:p-8 flex flex-col justify-between min-h-full">
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <motion.h2
                      className="text-2xl md:text-4xl font-bold text-white pr-4 transform-gpu will-change-transform"
                    >
                      {movieDetails.title}
                    </motion.h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-4 md:mb-6">
                    {/* Year */}
                    <div className="flex items-center gap-1 bg-slate-700 px-3 py-1 rounded-full text-slate-200 font-medium text-base md:text-lg will-change-transform">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {movieDetails.release_date ? new Date(movieDetails.release_date).getFullYear() : "N/A"}
                    </div>
                    {/* Rating */}
                    {movieDetails.vote_average && (
                      <div className="flex items-center gap-2 bg-slate-700 px-3 py-1 rounded-full transform-gpu will-change-transform">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-slate-200 font-medium text-sm md:text-base">
                          {movieDetails.vote_average}
                        </span>
                      </div>
                    )}
                    {/* Runtime */}
                    {movieDetails.runtime && (
                      <div className="flex items-center gap-2 bg-slate-700 px-3 py-1 rounded-full transform-gpu will-change-transform">
                        <Clock className="w-4 h-4 text-slate-300" />
                        <span className="text-slate-200 font-medium text-sm md:text-base">
                          {Math.floor(movieDetails.runtime / 60)}h {movieDetails.runtime % 60}m
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Genre tags */}
                  {movieDetails.genres && movieDetails.genres.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {movieDetails.genres.map((genre: any) => (
                          <span
                            key={genre.id}
                            className="inline-block bg-gradient-to-r from-sky-500 to-blue-500 text-white px-3 md:px-4 py-1 rounded-full text-xs md:text-sm font-medium mb-3 md:mb-4 transform-gpu will-change-transform"
                          >
                            {genre.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-slate-300 leading-relaxed text-sm md:text-lg transform-gpu will-change-transform">
                    {movieDetails.overview}
                  </p>
                </div>
                {/* Play button */}
                <div className="flex justify-end pt-4 md:pt-0 transform-gpu will-change-transform">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-full px-6 md:px-8 py-2 md:py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-sm md:text-base"
                    onClick={() => {
                      if (typeof window !== "undefined" && movieDetails && movieDetails.title) {
                        localStorage.setItem("snayerTitle", movieDetails.title)
                      }
                      onPlay()
                    }}
                  >
                    <Play className="w-4 md:w-5 h-4 md:h-5 mr-2 fill-white" />
                    Play Now
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-96">
            <Button onClick={() => {
              if (typeof window !== "undefined" && movieDetails && movieDetails.title) {
                localStorage.setItem("snayerTitle", movieDetails.title)
              }
              onPlay()
            }} className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-full px-6 md:px-8 py-2 md:py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-sm md:text-base">
              Play Now
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
