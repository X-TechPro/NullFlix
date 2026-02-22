"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { X, Tv, Play, Calendar, AlertCircle, RefreshCw, ChevronDown, CircleCheckBig, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  getFullTVShowDetails,
  getCachedTVStructure,
  setCachedTVStructure,
  getAllSeasons,
  getEpisodesForSeason,
} from "@/services/tv-details"
import { useToast } from "@/hooks/use-toast"

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
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  // Function to handle TV show data loading
  const loadTVShow = async (forceRenumerate = false) => {
    try {
      setLoading(true)
      setError(null)

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
    try {
      localStorage.removeItem(`tv-episodes-${tmdbId}`)
    } catch (e) {
      console.error("Error clearing TV episode cache:", e)
    }
    loadTVShow(true)
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start md:items-center justify-center p-2 md:p-4 transform-gpu will-change-transform">
      <style jsx global>{`
        .settings-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .settings-scrollbar::-webkit-scrollbar-track {
          background: #1e293b;
          border-radius: 4px;
        }

        .settings-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 4px;
        }

        .settings-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-800 border border-slate-700 rounded-3xl overflow-hidden w-full max-w-5xl max-h-[95vh] md:max-h-[90vh] flex flex-col shadow-2xl will-change-transform relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 bg-slate-800 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-sky-500 to-blue-500 rounded-full">
              <Tv className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white truncate">
              {loading ? "Loading..." : tvShow?.title || "Select Episode"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-full transition-colors duration-150"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {loading || enumerating ? (
            <div className="flex flex-col items-center justify-center flex-1 p-8">
              <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-white text-center mb-2 font-medium">{progressMessage}</p>

              {/* Progress bar */}
              <div className="w-full max-w-md bg-slate-700 rounded-full h-2.5 mb-4">
                <div
                  className="bg-gradient-to-r from-sky-500 to-blue-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              <p className="text-slate-400 text-sm text-center">
                {enumerating
                  ? "This may take a minute. We're finding all available episodes."
                  : "Loading TV show details..."}
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
              <p className="text-xl text-red-400 mb-6">{error}</p>
              <div className="flex gap-3">
                <Button
                  className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-full px-6 py-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  onClick={handleReload}
                >
                  <RefreshCw size={18} className="mr-2" />
                  Try Again
                </Button>
                <Button
                  className="bg-slate-700 hover:bg-slate-600 text-white rounded-full px-6 py-2 font-semibold transition-all duration-200"
                  onClick={onClose}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Sidebar - Season selector */}
              <div className="md:w-64 bg-slate-800 border-r border-slate-700 p-4 md:p-6 flex-shrink-0 overflow-y-auto settings-scrollbar">
                <label className="block mb-3 text-sm font-semibold text-slate-300">Select Season</label>
                <div className="relative">
                  <select
                    value={selectedSeason || ""}
                    onChange={(e) => setSelectedSeason(Number(e.target.value))}
                    className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
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
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                {/* Quick season navigation */}
                {seasons.length > 1 && (
                  <div className="mt-4">
                    <p className="text-xs text-slate-400 mb-2 font-medium">Quick Select</p>
                    <div className="flex flex-wrap gap-2">
                      {seasons.map((season) => (
                        <button
                          key={season}
                          onClick={() => setSelectedSeason(season)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                            selectedSeason === season
                              ? "bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-lg"
                              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                          }`}
                        >
                          S{season}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Info card */}
                <div className="mt-6 p-4 bg-slate-700/50 rounded-xl border border-slate-600">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    <span className="text-sky-400 font-semibold">Tip:</span> Select a season to view all available episodes. Click any episode to start watching.
                  </p>
                </div>
              </div>

              {/* Episode grid */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 settings-scrollbar">
                {selectedSeason ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg md:text-xl font-bold text-white">
                        Season {selectedSeason} Episodes
                      </h3>
                      <span className="text-sm text-slate-400 font-medium">
                        {episodes.length} episode{episodes.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {episodes.map((episode: any) => (
                        <motion.button
                          key={episode.episode_number}
                          onClick={() => onSelectEpisode(selectedSeason, episode.episode_number)}
                          className="bg-slate-700 hover:bg-slate-600 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] text-left group"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          {/* Episode thumbnail */}
                          <div className="relative aspect-video overflow-hidden">
                            {episode.still_path ? (
                              <img
                                src={`https://image.tmdb.org/t/p/w500${episode.still_path}`}
                                alt={episode.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                <Tv className="w-8 h-8 text-slate-600" />
                              </div>
                            )}
                            {/* Play overlay */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-500 rounded-full">
                                <Play size={16} className="w-4 h-4 fill-white text-white" />
                                <span className="text-white font-semibold text-sm">Play</span>
                              </div>
                            </div>
                            {/* Episode number badge */}
                            <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-lg">
                              <span className="text-white font-bold text-xs">E{episode.episode_number}</span>
                            </div>
                          </div>

                          {/* Episode info */}
                          <div className="p-3">
                            <h4 className="font-semibold text-white text-sm md:text-base truncate mb-1">
                              {episode.name || `Episode ${episode.episode_number}`}
                            </h4>
                            <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">
                              {episode.overview || "No description available."}
                            </p>
                          </div>
                        </motion.button>
                      ))}
                    </div>

                    {episodes.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <AlertCircle className="w-12 h-12 text-slate-500 mb-3" />
                        <p className="text-slate-400 font-medium">No episodes found for this season.</p>
                        <p className="text-slate-500 text-sm mt-1">Try selecting a different season.</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Tv className="w-16 h-16 text-slate-600 mb-4" />
                    <p className="text-slate-400 font-medium text-lg">Select a season to get started</p>
                    <p className="text-slate-500 text-sm mt-2">Choose from the dropdown or quick select buttons</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-4 md:p-6 bg-slate-800 border-t border-slate-700 flex-shrink-0">
          <Button
            onClick={handleReload}
            disabled={loading || enumerating}
            className="bg-slate-700 hover:bg-slate-600 text-white rounded-full px-4 py-2 font-medium transition-all duration-200 text-sm"
          >
            <RefreshCw size={16} className="mr-2" />
            Reload
          </Button>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                const url = `${window.location.origin}${window.location.pathname}?tv=${tmdbId}`
                navigator.clipboard.writeText(url)
                setCopied(true)
                toast({ title: "Link copied!", description: "Share this link to watch directly." })
                setTimeout(() => setCopied(false), 1500)
              }}
              className="bg-slate-700 hover:bg-slate-600 text-white rounded-full px-4 py-2 font-medium transition-all duration-200 text-sm"
            >
              {copied ? (
                <>
                  <CircleCheckBig size={16} className="mr-2 text-green-400" />
                  Copied
                </>
              ) : (
                <>
                  <Share2 size={16} className="mr-2" />
                  Share
                </>
              )}
            </Button>
            <Button
              onClick={onClose}
              className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-full px-6 py-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-sm"
            >
              Done
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
