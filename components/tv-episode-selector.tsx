"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { X, ChevronDown, Tv, Play, Calendar, Clock, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  getFullTVShowDetails,
  getCachedTVStructure,
  setCachedTVStructure,
  getAllSeasons,
  getEpisodesForSeason,
} from "@/services/tv-details"

interface TVEpisodeSelectorProps {
  tmdbId: string
  onSelectEpisode: (season: number, episode: number) => void
  onClose: () => void
}

export default function TVEpisodeSelector({ tmdbId, onSelectEpisode, onClose }: TVEpisodeSelectorProps) {
  const [tvShow, setTVShow] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [seasons, setSeasons] = useState<number[]>([])
  const [episodes, setEpisodes] = useState<any[]>([])
  const [enumerating, setEnumerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState("")
  const [tvStructure, setTvStructure] = useState<any>(null)

  // Function to handle TV show data loading
  const loadTVShow = async (forceRenumerate = false) => {
    try {
      setLoading(true)
      setError(null)

      // Load TV show details (title, etc)
      // Optionally, you can fetch more details if needed
      // const show = await getTVShowDetails(Number(tmdbId))
      // setTVShow(show)

      // Check if we have cached episode data and aren't forcing renumeration
      const cachedStructure = getCachedTVStructure(tmdbId)
      if (cachedStructure && !forceRenumerate) {
        setTvStructure(cachedStructure)
        setTVShow({ title: cachedStructure.name })
        const availableSeasons = getAllSeasons(cachedStructure)
        setSeasons(availableSeasons)
        if (availableSeasons.length > 0) {
          setSelectedSeason(availableSeasons[0])
          setEpisodes(getEpisodesForSeason(cachedStructure, availableSeasons[0]))
        }
        setLoading(false)
        return
      }

      setEnumerating(true)
      setProgressMessage("Fetching all seasons and episodes from TMDB...")
      setProgress(0)

      const structure = await getFullTVShowDetails(tmdbId)
      if (!structure) throw new Error("Failed to fetch TV show structure")
      setTvStructure(structure)
      setTVShow({ title: structure.name })
      setCachedTVStructure(tmdbId, structure)
      const availableSeasons = getAllSeasons(structure)
      setSeasons(availableSeasons)
      if (availableSeasons.length > 0) {
        setSelectedSeason(availableSeasons[0])
        setEpisodes(getEpisodesForSeason(structure, availableSeasons[0]))
      }
    } catch (err) {
      console.error("Error loading TV show:", err)
      setError("Failed to load TV show details")
      const defaultSeasons = Array.from({ length: 3 }, (_, i) => i + 1)
      setSeasons(defaultSeasons)
      setEpisodes([])
      setSelectedSeason(1)
    } finally {
      setLoading(false)
      setEnumerating(false)
    }
  }

  // Function to handle forced reloading of episode data
  const handleReload = () => {
    // Clear cache for this show
    try {
      localStorage.removeItem(`tv-episodes-${tmdbId}`)
    } catch (e) {
      console.error("Error clearing TV episode cache:", e)
    }
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
                  <div className="flex flex-col items-center gap-3">
                    {episodes.map((episode: any) => (
                      <Button
                        key={episode.episode_number}
                        onClick={() => onSelectEpisode(selectedSeason, episode.episode_number)}
                        className="w-full max-w-full flex items-stretch gap-3 p-0 bg-gray-700 hover:bg-sky-600 text-white relative group min-h-[80px] text-left rounded-lg shadow-md overflow-hidden"
                        style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}
                      >
                        {episode.still_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w185${episode.still_path}`}
                            alt={episode.name}
                            className="h-full w-24 object-cover rounded-l-lg flex-shrink-0"
                            style={{ minHeight: '80px', maxHeight: '220px', alignSelf: 'stretch' }}
                          />
                        ) : (
                          <div className="h-full w-24 bg-gray-900 rounded-l-lg flex-shrink-0" style={{ minHeight: '80px', maxHeight: '220px', alignSelf: 'stretch' }} />
                        )}
                        <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
                          <div className="font-semibold text-white mb-1 break-words whitespace-normal">
                            {episode.episode_number}. {episode.name}
                          </div>
                          <div className="text-xs text-gray-300 whitespace-normal break-words">
                            {episode.overview || "No description."}
                          </div>
                        </div>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Play size={16} className="mr-1" />
                          <span>Play</span>
                        </div>
                      </Button>
                    ))}
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
