"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { X, Tv, Calendar, Clock, Play, Share2, CircleCheckBig } from "lucide-react"
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
          genre: Array.isArray(details.genres) ? details.genres.map((g: any) => g.name).join(", ") : "",
          year: details.first_air_date?.slice(0, 4) || details.release_date?.slice(0, 4) || "",
          Runtime: Array.isArray(details.episode_run_time) && details.episode_run_time.length > 0 ? details.episode_run_time[0] : "",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2 sm:p-4 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-3xl bg-gray-900 rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto"
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
            <Tv className="w-16 h-16 text-red-500 mb-4" />
            <p className="text-xl text-red-400 mb-4">{error}</p>
            <Button onClick={onClose} className="bg-gray-600 hover:bg-gray-700">
              Close
            </Button>
          </div>
        ) : tvShow ? (
          <div className="flex flex-col md:flex-row overflow-hidden">
            {/* Poster */}
            <div className="w-full md:w-1/3 bg-gray-800 max-h-[300px] md:max-h-none flex items-center justify-center relative group">
              {tvShow.poster ? (
                <>
                  <img
                    src={tvShow.poster}
                    alt={tvShow.title}
                    className="w-full h-full object-cover max-h-[300px] md:max-h-none"
                  />
                  {/* Hover overlay for share */}
                  <button
                    className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 cursor-pointer"
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
                        <span className="text-white font-semibold text-base">Share this tv series</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-gray-800">
                  <Tv className="w-20 h-20 text-gray-600" />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="w-full md:w-2/3 p-4 sm:p-6 flex flex-col relative">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 break-words">
                {tvShow.title}
              </h2>

              <div className="flex flex-wrap gap-2 sm:gap-4 mb-3 sm:mb-4 text-xs sm:text-sm text-gray-300">
                {tvShow.year && (
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1 text-[color:var(--theme-primary-light)]" />
                    <span>{tvShow.year}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1 text-[color:var(--theme-primary-light)]" />
                  <span>{tvShow.Runtime}</span>
                </div>
              </div>

              {tvShow.genre && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {tvShow.genre.split(", ").map((genre: string) => (
                      <span
                        key={genre}
                        className="px-2 py-1 text-xs bg-gray-800 text-[color:var(--theme-primary-light)] rounded-md border border-gray-700"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6 flex-grow">{tvShow.plot}</p>
              {/* Move hover text here, bottom left under description */}
              <span className="absolute left-4 bottom-4 text-xs text-white/80 bg-black/60 px-2 py-1 rounded shadow z-20 select-none">
                Hover the poster
              </span>
              <Button
                onClick={() => {
                  // Save the movie title to localStorage for snayer provider
                  if (typeof window !== "undefined" && tvShow && tvShow.title) {
                    localStorage.setItem("snayerTitle", tvShow.title)
                  }
                  onPlay(tmdbId)
                }}
                className="bg-[color:var(--theme-primary)] hover:bg-[color:var(--theme-button-hover)] text-white w-full md:w-auto self-end mt-4 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Play
              </Button>
            </div>
          </div>
        ) : null}
      </motion.div>
    </div>
  )
}
