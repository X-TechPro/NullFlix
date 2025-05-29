"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { X, Tv, Calendar, Clock, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getTVShowDetails } from "@/services/movie-service"
import TVEpisodeSelector from "@/components/tv-episode-selector"
import { fetchMovieDetailsByIMDB, getHighResolutionPoster } from "@/services/omdb-service"

interface TVDetailsPopupProps {
  tmdbId: string
  imdbId?: string // allow passing imdbId
  onClose: () => void
  onPlay: (tmdbId: string) => void
}

export default function TVDetailsPopup({ tmdbId, imdbId, onClose, onPlay }: TVDetailsPopupProps) {
  const [tvShow, setTVShow] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true)
      setError(null)
      try {
        // Try OMDB first if imdbId is provided and OMDB is enabled
        let omdbData = null
        const isOMDBEnabled = typeof window !== "undefined" && localStorage.getItem("omdbEnabled") === "true"
        if (imdbId && isOMDBEnabled) {
          omdbData = await fetchMovieDetailsByIMDB(imdbId)
        }
        if (omdbData && omdbData.Response === "True") {
          setTVShow({
            poster: omdbData.Poster && omdbData.Poster !== "N/A" ? getHighResolutionPoster(omdbData.Poster) : null,
            title: omdbData.Title || "",
            plot: omdbData.Plot || "",
            genre: omdbData.Genre || "",
            year: omdbData.Year || "",
            Runtime: omdbData.Runtime || "",
          })
        } else {
          // fallback to local DB
          const details = await getTVShowDetails(Number(tmdbId))
          setTVShow({
            poster: details.poster
              ? getHighResolutionPoster(details.poster)
              : details.poster_path
              ? getHighResolutionPoster(details.poster_path)
              : details.image
              ? getHighResolutionPoster(details.image)
              : null,
            title: details.title || details.name || details.original_name || "",
            plot: details.plot || details.overview || details.description || "",
            genre: details.genre || (Array.isArray(details.genres) ? details.genres.map((g: any) => g.name).join(", ") : ""),
            year: details.year || details.first_air_date?.slice(0, 4) || details.release_date?.slice(0, 4) || "",
            Runtime: details.runtime || details.episode_run_time?.[0] || "",
          })
        }
      } catch (err) {
        setError("Failed to load TV show details")
      } finally {
        setIsLoading(false)
      }
    }
    fetchDetails()
  }, [tmdbId, imdbId])

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
            <Tv className="w-16 h-16 text-red-500 mb-4" />
            <p className="text-xl text-red-400 mb-4">{error}</p>
            <Button onClick={onClose} className="bg-gray-600 hover:bg-gray-700">
              Close
            </Button>
          </div>
        ) : tvShow ? (
          <div className="flex flex-col md:flex-row overflow-hidden">
            {/* Poster */}
            <div className="w-full md:w-1/3 bg-gray-800 max-h-[300px] md:max-h-none flex items-center justify-center">
              {tvShow.poster ? (
                <img
                  src={tvShow.poster}
                  alt={tvShow.title}
                  className="w-full h-full object-cover max-h-[300px] md:max-h-none"
                />
              ) : (
                <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-gray-800">
                  <Tv className="w-20 h-20 text-gray-600" />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="w-full md:w-2/3 p-4 sm:p-6 flex flex-col">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 break-words">
                {tvShow.title}
              </h2>

              <div className="flex flex-wrap gap-2 sm:gap-4 mb-3 sm:mb-4 text-xs sm:text-sm text-gray-300">
                {tvShow.year && (
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1 text-sky-400" />
                    <span>{tvShow.year}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1 text-sky-400" />
                  <span>{tvShow.Runtime}</span>
                </div>
              </div>

              {tvShow.genre && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {tvShow.genre.split(", ").map((genre: string) => (
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

              <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6 flex-grow">{tvShow.plot || tvShow.description}</p>

              <Button
                onClick={() => onPlay(tmdbId)}
                className="bg-sky-600 hover:bg-sky-700 text-white w-full md:w-auto self-end mt-4 flex items-center justify-center gap-2"
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
