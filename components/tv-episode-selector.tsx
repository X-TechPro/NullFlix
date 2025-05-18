"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { X, ChevronDown, Tv, Play, Calendar, Clock, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getTVShowDetails } from "@/services/movie-service"
import {
  enumerateTVShow,
  getCachedTVStructure,
  getAllSeasons,
  getEpisodesForSeason,
} from "@/services/tv-episode-enumerator"

interface TVEpisodeSelectorProps {
  tmdbId: number
  onSelectEpisode: (season: number, episode: number) => void
  onClose: () => void
}

export default function TVEpisodeSelector({ tmdbId, onSelectEpisode, onClose }: TVEpisodeSelectorProps) {
  const [tvShow, setTVShow] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [seasons, setSeasons] = useState<number[]>([])
  const [episodes, setEpisodes] = useState<number[]>([])
  const [enumerating, setEnumerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState("")
  const [tvStructure, setTvStructure] = useState<any>(null)

  // Function to handle TV show data loading
  const loadTVShow = async (forceRenumerate = false) => {
    try {
      setLoading(true)
      setError(null)

      // Load TV show details
      const show = await getTVShowDetails(tmdbId)
      setTVShow(show)

      // Check if we have cached episode data and aren't forcing renumeration
      const cachedStructure = getCachedTVStructure(tmdbId)
      if (cachedStructure && !forceRenumerate) {
        setTvStructure(cachedStructure)
        const availableSeasons = getAllSeasons(cachedStructure)
        setSeasons(availableSeasons)

        // Auto-select first season if available
        if (availableSeasons.length > 0) {
          setSelectedSeason(availableSeasons[0])
          setEpisodes(getEpisodesForSeason(cachedStructure, availableSeasons[0]))
        }

        setLoading(false)
        return
      }

      // If no cached data or forcing renumeration, start enumeration
      setEnumerating(true)
      setProgressMessage("Starting episode enumeration...")
      setProgress(0)

      const structure = await enumerateTVShow(tmdbId, (message, progress) => {
        setProgressMessage(message)
        setProgress(progress)
      })

      setTvStructure(structure)
      const availableSeasons = getAllSeasons(structure)
      setSeasons(availableSeasons)

      // Auto-select first season if available
      if (availableSeasons.length > 0) {
        setSelectedSeason(availableSeasons[0])
        setEpisodes(getEpisodesForSeason(structure, availableSeasons[0]))
      }
    } catch (err) {
      console.error("Error loading TV show:", err)
      setError("Failed to load TV show details")

      // Set default seasons and episodes even on error
      const defaultSeasons = Array.from({ length: 3 }, (_, i) => i + 1)
      setSeasons(defaultSeasons)
      setEpisodes(Array.from({ length: 10 }, (_, i) => i + 1))
      setSelectedSeason(1)
    } finally {
      setLoading(false)
      setEnumerating(false)
    }
  }

  // Function to handle forced reloading of episode data
  const handleReload = () => {
    loadTVShow(true) // Force renumeration
  }

  useEffect(() => {
    loadTVShow()
  }, [tmdbId])

  // Update episodes when season changes
  useEffect(() => {
    if (selectedSeason && tvStructure) {
      setEpisodes(getEpisodesForSeason(tvStructure, selectedSeason))
    }
  }, [selectedSeason, tvStructure])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-gray-800 rounded-lg shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Tv className="w-5 h-5 text-sky-400" />
            <h2 className="text-xl font-bold text-white truncate">
              {loading ? "Loading..." : tvShow?.title || "Select Episode"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 transition-colors rounded-full hover:bg-gray-700 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4">
          {loading || enumerating ? (
            <div className="flex flex-col items-center justify-center p-8">
              <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-white text-center mb-2">{progressMessage}</p>

              {/* Progress bar */}
              <div className="w-full bg-gray-700 rounded-full h-2.5 mb-4">
                <div className="bg-sky-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
              </div>

              <p className="text-gray-400 text-sm text-center">
                {enumerating
                  ? "This may take a minute. We're finding all available episodes."
                  : "Loading TV show details..."}
              </p>
            </div>
          ) : error ? (
            <div className="p-4 text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-400">{error}</p>
              <div className="flex justify-between mt-4">
                <Button className="bg-sky-600 hover:bg-sky-700 text-white" onClick={handleReload}>
                  <RefreshCw size={16} className="mr-2" />
                  Try Again
                </Button>
                <Button className="bg-gray-600 hover:bg-gray-700 text-white" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Season selector */}
              <div className="mb-6">
                <label className="block mb-2 text-sm font-medium text-gray-300">Select Season</label>
                <div className="relative">
                  <select
                    value={selectedSeason || ""}
                    onChange={(e) => setSelectedSeason(Number(e.target.value))}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white appearance-none"
                  >
                    <option value="" disabled>
                      Select a season
                    </option>
                    {seasons.map((season) => (
                      <option key={season} value={season}>
                        Season {season}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Episode grid */}
              {selectedSeason && (
                <div>
                  <h3 className="mb-3 text-lg font-medium text-white">Episodes</h3>
                  <div className="grid grid-cols-5 gap-2">
                    {episodes.map((episode) => (
                      <Button
                        key={episode}
                        onClick={() => onSelectEpisode(selectedSeason, episode)}
                        className="flex items-center justify-center p-2 h-12 bg-gray-700 hover:bg-sky-600 text-white relative group"
                      >
                        <span>{episode}</span>
                        <div className="absolute inset-0 flex items-center justify-center bg-sky-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Play size={14} className="mr-1" />
                          <span>Play</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Show info */}
              {tvShow && (
                <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
                  <div className="text-sm text-gray-300">
                    <div className="flex items-center mb-2">
                      <Tv className="w-4 h-4 mr-2 text-sky-400" />
                      <h4 className="font-medium text-white">{tvShow?.title}</h4>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                      {tvShow?.year && (
                        <p className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1 text-sky-400" />
                          <span>{tvShow.year}</span>
                        </p>
                      )}

                      <p className="flex items-center">
                        <Clock className="w-3 h-3 mr-1 text-sky-400" />
                        <span>~45 min</span>
                      </p>
                    </div>

                    {tvShow?.genre && <p className="mt-2 text-gray-400">{tvShow.genre}</p>}
                  </div>
                </div>
              )}

              <div className="mt-4 p-3 bg-blue-900/20 border border-blue-800/30 rounded-lg text-xs text-blue-300">
                <p>
                  Note: If an episode doesn't load, try another episode or season. Not all episodes may be available.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="sticky bottom-0 flex justify-between p-4 bg-gray-800 border-t border-gray-700">
          <Button
            onClick={handleReload}
            disabled={loading || enumerating}
            className="bg-sky-600 hover:bg-sky-700 text-white"
          >
            <RefreshCw size={16} className="mr-2" />
            Reload Links
          </Button>
          <Button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white">
            Cancel
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
