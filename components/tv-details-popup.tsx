"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { X, Tv, Calendar, Star, Clock, Play, Share2, CircleCheckBig } from "lucide-react"
import { Button } from "@/components/ui/button"
import { fetchMovieDetailsByTMDB, getTMDBPoster } from "@/services/tmdb-service"
import { useToast } from "@/hooks/use-toast"

interface TVDetailsPopupProps {
  tmdbId: string
  onClose: () => void
  onPlay: (tmdbId: string) => void
}

// Extend TMDBMovie for TV details
interface TMDBTVDetails {
  id: string
  title?: string
  name?: string
  original_title?: string
  original_name?: string
  overview?: string
  poster_path?: string
  backdrop_path?: string
  media_type?: string
  release_date?: string
  first_air_date?: string
  genre_ids?: number[]
  genres?: { id: number; name: string }[]
  popularity?: number
  vote_average?: number
  vote_count?: number
  episode_run_time?: number[]
}

export default function TVDetailsPopup({ tmdbId, onClose, onPlay }: TVDetailsPopupProps) {
  const [tvShow, setTVShow] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const details: TMDBTVDetails | null = await fetchMovieDetailsByTMDB(tmdbId, "tv")
        if (!details) throw new Error("No details found")
        setTVShow({
          poster: details.poster_path ? getTMDBPoster(details.poster_path) : null,
          title: details.name || details.title || details.original_name || details.original_title || "",
          plot: details.overview || "",
          genre: Array.isArray(details.genres) ? details.genres.map((g: any) => g.name) : [],
          year: details.first_air_date?.slice(0, 4) || details.release_date?.slice(0, 4) || "",
          Runtime: Array.isArray(details.episode_run_time) && details.episode_run_time.length > 0 ? details.episode_run_time[0] : "",
          vote_average: details.vote_average,
        })
      } catch (err) {
        setError("Failed to load TV show details")
      } finally {
        setIsLoading(false)
      }
    }
    fetchDetails()
  }, [tmdbId])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start md:items-center justify-center p-2 md:p-4 transform-gpu will-change-transform"
      onClick={onClose}
    >
      <motion.div
        onClick={e => e.stopPropagation()}
        className="bg-slate-800 border border-slate-700 rounded-3xl overflow-hidden w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] flex flex-col shadow-2xl will-change-transform"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "tween", duration: 0.12, ease: [0.25, 1, 0.5, 1] }}
      >
        <div className="overflow-y-auto flex flex-col md:flex-row h-full">
          {/* Poster section */}
          <div className="md:sticky md:top-0 md:overflow-hidden">
            <motion.div
              className="relative w-full md:w-80 h-64 md:h-[90vh] flex-shrink-0 transform-gpu will-change-transform group"
            >
              <img
                src={tvShow?.poster || "/placeholder.svg"}
                alt={tvShow?.title}
                className="w-full h-full object-cover"
              />
              {/* Mobile close button moved outside share overlay and given higher z-index */}
              <button
                className="absolute top-4 right-4 md:hidden bg-black/50 backdrop-blur-sm rounded-full p-2 text-white hover:bg-black/70 transition-colors duration-150 transform-gpu z-30"
                onClick={onClose}
              >
                <X className="w-6 h-6" />
              </button>
              {/* Hover overlay for share */}
              <button
                className="absolute z-20 inset-0 flex flex-col items-center justify-center bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                onClick={() => {
                  const url = `${window.location.origin}${window.location.pathname}?tv=${tmdbId}`
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
                    <span className="text-white font-semibold text-base">Share this TV series</span>
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
                    {tvShow?.title}
                  </motion.h2>
                  {/* Close button for desktop */}
                  <button
                    className="hidden md:block bg-slate-700 hover:bg-slate-600 rounded-full p-2 text-slate-300 hover:text-white transition-colors duration-150 flex-shrink-0 transform-gpu"
                    onClick={onClose}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-4 md:mb-6">
                  {/* Year */}
                  <div
                    className="flex items-center gap-1 bg-slate-700 px-3 py-1 rounded-full text-slate-200 font-medium text-base md:text-lg will-change-transform"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    {tvShow?.year || "N/A"}
                  </div>
                  {/* Rating */}
                  {tvShow?.vote_average && (
                    <div
                      className="flex items-center gap-2 bg-slate-700 px-3 py-1 rounded-full transform-gpu will-change-transform"
                    >
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-slate-200 font-medium text-sm md:text-base">
                        {tvShow.vote_average}
                      </span>
                    </div>
                  )}
                  {/* Runtime */}
                  {tvShow?.Runtime && (
                    <div
                      className="flex items-center gap-2 bg-slate-700 px-3 py-1 rounded-full transform-gpu will-change-transform"
                    >
                      <Clock className="w-4 h-4 text-slate-300" />
                      <span className="text-slate-200 font-medium text-sm md:text-base">
                        {Math.floor(tvShow.runtime / 60)}h {tvShow.runtime % 60}m
                      </span>
                    </div>
                  )}
                </div>
                {/* Genre tags */}
                {tvShow?.genre && tvShow.genre.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {tvShow.genre.map((genre: string) => (
                        <span
                          key={genre}
                          className="inline-block bg-gradient-to-r from-sky-500 to-blue-500 text-white px-3 md:px-4 py-1 rounded-full text-xs md:text-sm font-medium mb-3 md:mb-4 transform-gpu will-change-transform"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <p
                  className="text-slate-300 leading-relaxed text-sm md:text-lg transform-gpu will-change-transform"
                >
                  {tvShow?.plot || "N/A"}
                </p>
              </div>
              {/* Play button */}
              <div
                className="flex justify-end pt-4 md:pt-0 transform-gpu will-change-transform"
              >
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-full px-6 md:px-8 py-2 md:py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-sm md:text-base"
                  onClick={() => {
                    if (typeof window !== "undefined" && tvShow && tvShow.title) {
                      localStorage.setItem("snayerTitle", tvShow.title)
                    }
                    onPlay(tmdbId)
                  }}
                >
                  <Play className="w-4 md:w-5 h-4 md:h-5 mr-2 fill-white" />
                  Play Now
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-50 text-center p-4">
            <Tv className="w-16 h-16 text-red-500 mb-4" />
            <p className="text-xl text-red-400 mb-4">{error}</p>
            <Button onClick={onClose} className="bg-gray-600 hover:bg-gray-700">
              Close
            </Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
