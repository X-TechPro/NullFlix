"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Sparkles, Github, Settings, Bookmark, Loader2, Film, AlertCircle, Tv } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import BackgroundShapes from "@/components/background-shapes"
import BookmarksArea from "@/components/bookmarks-area"
import SettingsDialog from "@/components/settings-dialog"
import MoviePlayer from "@/components/movie-player"
import TVEpisodeSelector from "@/components/tv-episode-selector"
import GlowingSearchBar from "@/components/glowing-search-bar"
import { searchMedia, type Media } from "@/services/movie-service"
import { isDatabaseInitialized, isTVDatabaseInitialized, getMetadata } from "@/utils/db"

export default function Home() {
  const [query, setQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingMedia, setIsLoadingMedia] = useState(true)
  const [bookmarks, setBookmarks] = useState<any[]>([])
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [mediaResults, setMediaResults] = useState<Media[]>([])
  const [selectedMovie, setSelectedMovie] = useState<string | null>(null)
  const [selectedTVShow, setSelectedTVShow] = useState<number | null>(null)
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null)
  const [selectedEpisode, setSelectedEpisode] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [usingOfflineDatabase, setUsingOfflineDatabase] = useState(false)
  const [showNoDatabaseError, setShowNoDatabaseError] = useState(false)
  const [searchInitiated, setSearchInitiated] = useState(false)
  const [movieCount, setMovieCount] = useState<number | null>(null)
  const [tvCount, setTVCount] = useState<number | null>(null)

  // Load media data
  useEffect(() => {
    const loadMedia = async () => {
      setIsLoadingMedia(true)
      setError(null)

      try {
        // Check if we have a downloaded database in IndexedDB
        const moviesInitialized = await isDatabaseInitialized()
        const tvInitialized = await isTVDatabaseInitialized()

        if (moviesInitialized || tvInitialized) {
          try {
            // Get movie count from metadata
            if (moviesInitialized) {
              const count = await getMetadata("movieCount")
              setMovieCount(count)
            }

            // Get TV count from metadata
            if (tvInitialized) {
              const count = await getMetadata("tvCount")
              setTVCount(count)
            }

            // We don't need to load all media into memory anymore
            // Just set the flag that we have a database
            setUsingOfflineDatabase(true)
            setIsLoadingMedia(false)
            return
          } catch (err) {
            console.error("Error loading from IndexedDB:", err)
            setError("Failed to load media database. Please try downloading again.")
          }
        }

        // If we reach here, either no database or failed to load
        setMediaResults([])
      } catch (err) {
        console.error("Error loading media:", err)
        setError("Failed to load media. Please try again later.")
      } finally {
        setIsLoadingMedia(false)
      }
    }

    loadMedia()
  }, [])

  // Load bookmarks from localStorage on component mount
  useEffect(() => {
    try {
      const savedBookmarks = localStorage.getItem("movieBookmarks")
      if (savedBookmarks) {
        setBookmarks(JSON.parse(savedBookmarks))
      }
    } catch (e) {
      console.error("Error parsing bookmarks:", e)
    }
  }, [])

  // Save bookmarks to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("movieBookmarks", JSON.stringify(bookmarks))
    } catch (e) {
      console.error("Error saving bookmarks:", e)
    }
  }, [bookmarks])

  // Auto-hide the no database error after 5 seconds
  useEffect(() => {
    if (showNoDatabaseError) {
      const timer = setTimeout(() => {
        setShowNoDatabaseError(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [showNoDatabaseError])

  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!query.trim()) return

      // Check if database is initialized
      const moviesInitialized = await isDatabaseInitialized()
      const tvInitialized = await isTVDatabaseInitialized()

      if (!moviesInitialized && !tvInitialized) {
        setShowNoDatabaseError(true)
        return
      }

      setSearchInitiated(true)
      setIsSearching(true)

      // Use setTimeout to allow the UI to update before starting the search
      setTimeout(async () => {
        try {
          // Search in IndexedDB
          const results = await searchMedia(query)
          setMediaResults(results)
          setShowBookmarks(false)
        } catch (error) {
          console.error("Search error:", error)
        } finally {
          setIsSearching(false)
        }
      }, 500) // Reduced loading time for better UX
    },
    [query],
  )

  // Update the toggleBookmark function to save complete media information
  const toggleBookmark = (media: Media) => {
    setBookmarks((prev) => {
      // Create a bookmark object with all necessary data
      const bookmarkItem = {
        // Essential identification
        id: media.id,
        imdbID: media.imdb || media.id, // For movies
        tmdbID: media.tmdb, // For TV shows

        // Display information
        title: media.title,
        year: media.year?.toString() || "",
        genre: media.genre || "",

        // Type information
        type: media.type,
        mediaType: media.type,

        // Additional data
        seasons: media.seasons || [],

        // Timestamp for sorting
        bookmarkedAt: new Date().toISOString(),
      }

      const exists = prev.some(
        (item) =>
          item.id === media.id ||
          (media.imdb && item.imdbID === media.imdb) ||
          (media.tmdb && item.tmdbID === media.tmdb),
      )

      if (exists) {
        return prev.filter(
          (item) =>
            item.id !== media.id &&
            (media.imdb ? item.imdbID !== media.imdb : true) &&
            (media.tmdb ? item.tmdbID !== media.tmdb : true),
        )
      } else {
        return [...prev, bookmarkItem]
      }
    })
  }

  // Update the isBookmarked function to check all possible IDs
  const isBookmarked = (mediaId: string, tmdbId?: number) => {
    return bookmarks.some(
      (item) => item.id === mediaId || item.imdbID === mediaId || (tmdbId && item.tmdbID === tmdbId),
    )
  }

  const resetSearch = () => {
    setSearchInitiated(false)
    setMediaResults([])
    setQuery("")
  }

  const handleMediaSelect = (media: Media) => {
    if (media.type === "movie") {
      setSelectedMovie(media.imdb || media.id)
    } else if (media.type === "tv") {
      setSelectedTVShow(media.tmdb)
    }
  }

  const handleEpisodeSelect = (season: number, episode: number) => {
    setSelectedSeason(season)
    setSelectedEpisode(episode)
  }

  const handleClosePlayer = () => {
    setSelectedMovie(null)
    setSelectedTVShow(null)
    setSelectedSeason(null)
    setSelectedEpisode(null)
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <BackgroundShapes />

      <div className="container relative z-10 px-4 mx-auto">
        <div className="flex items-center justify-between py-4 mt-4">
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => {
              setSearchInitiated(false)
              setShowBookmarks(false)
              setMediaResults([])
              setQuery("")
            }}
          >
            <Sparkles className="w-6 h-6 text-sky-400" />
            <h1 className="text-2xl font-bold text-white">NullFlix</h1>
            {usingOfflineDatabase && (
              <div className="flex items-center gap-1">
                {movieCount && (
                  <span className="px-2 py-0.5 text-xs bg-green-600/20 text-green-400 rounded-full border border-green-800/30">
                    Movies: {movieCount}
                  </span>
                )}
                {tvCount && (
                  <span className="px-2 py-0.5 text-xs bg-blue-600/20 text-blue-400 rounded-full border border-blue-800/30">
                    TV: {tvCount}
                  </span>
                )}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center gap-3"
          >
            <motion.a
              href="https://github.com/Jonathan-Chayna/NullFlix"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-blue-300 transition-colors rounded-full hover:text-white hover:bg-blue-800/30"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Github className="w-5 h-5" />
            </motion.a>
            <motion.button
              onClick={() => {
                setShowBookmarks(!showBookmarks)
                setSearchInitiated(false)
              }}
              className={`p-2 transition-colors rounded-full ${showBookmarks ? "text-sky-400 bg-blue-800/50" : "text-blue-300 hover:text-white hover:bg-blue-800/30"}`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bookmark className="w-5 h-5" />
            </motion.button>
            <motion.button
              onClick={() => setShowSettings(true)}
              className="p-2 text-blue-300 transition-colors rounded-full hover:text-white hover:bg-blue-800/30"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Settings className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </div>

        {/* No Database Error Alert */}
        <AnimatePresence>
          {showNoDatabaseError && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4"
            >
              <Alert variant="destructive" className="bg-red-900/30 border-red-800 text-white">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No media database found. Please download the database from Settings first.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {isLoadingMedia ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[70vh]"
            >
              <Loader2 className="w-12 h-12 text-sky-500 animate-spin" />
              <p className="mt-4 text-lg text-white">Loading media...</p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[70vh] text-center"
            >
              <p className="text-xl text-red-400">{error}</p>
              <Button className="mt-6 bg-sky-600 hover:bg-sky-700 text-white" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </motion.div>
          ) : searchInitiated ? (
            <motion.div
              key="search-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-4"
            >
              {/* Search bar at the top when searching - using GlowingSearchBar */}
              <motion.div className="relative w-full max-w-3xl mx-auto mb-8" initial={{ y: 0 }} animate={{ y: 0 }}>
                <GlowingSearchBar value={query} onChange={setQuery} onSubmit={handleSearch} />
              </motion.div>

              {isSearching ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-20"
                >
                  <Loader2 className="w-12 h-12 text-sky-500 animate-spin" />
                  <p className="mt-4 text-lg text-white">Searching for "{query}"...</p>
                </motion.div>
              ) : (
                <MediaResults
                  media={mediaResults}
                  onMediaSelect={handleMediaSelect}
                  onNewSearch={resetSearch}
                  toggleBookmark={toggleBookmark}
                  isBookmarked={isBookmarked}
                />
              )}
            </motion.div>
          ) : !showBookmarks ? (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center min-h-[70vh] text-center"
            >
              <motion.h2
                className="max-w-2xl mb-8 text-3xl font-bold text-white md:text-4xl"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                What would you like to watch today?
              </motion.h2>

              <motion.div
                className="relative w-full max-w-xl"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <GlowingSearchBar value={query} onChange={setQuery} onSubmit={handleSearch} />
              </motion.div>

              <motion.p
                className="mt-12 text-lg text-blue-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                Welcome, find media to watch here!
              </motion.p>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                <Button
                  className="mt-6 bg-sky-600 hover:bg-sky-700 text-white px-6 py-2 h-auto text-base rounded-full transition-colors duration-300"
                  onClick={() => {
                    setQuery("action")
                    const event = { preventDefault: () => {} } as React.FormEvent
                    handleSearch(event)
                  }}
                >
                  Discover
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            <BookmarksArea
              bookmarks={bookmarks}
              toggleBookmark={toggleBookmark}
              isBookmarked={isBookmarked}
              onMediaSelect={(media) => {
                // Handle both old and new bookmark formats
                if (media.mediaType === "tv" || media.type === "tv") {
                  setSelectedTVShow(media.tmdbID || media.tmdb || Number.parseInt(media.imdbID))
                } else {
                  setSelectedMovie(media.imdbID || media.imdb || media.id)
                }
              }}
              onBack={() => {
                setShowBookmarks(false)
                setSearchInitiated(false)
              }}
            />
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showSettings && <SettingsDialog isOpen={showSettings} onClose={() => setShowSettings(false)} />}
        {selectedMovie && <MoviePlayer mediaId={selectedMovie} mediaType="movie" onClose={handleClosePlayer} />}
        {selectedTVShow && !selectedSeason && (
          <TVEpisodeSelector
            tmdbId={selectedTVShow}
            onSelectEpisode={handleEpisodeSelect}
            onClose={() => setSelectedTVShow(null)}
          />
        )}
        {selectedTVShow && selectedSeason && selectedEpisode && (
          <MoviePlayer
            mediaId={selectedTVShow.toString()}
            mediaType="tv"
            season={selectedSeason}
            episode={selectedEpisode}
            onClose={handleClosePlayer}
          />
        )}
      </AnimatePresence>
    </main>
  )
}

interface MediaResultsProps {
  media: Media[]
  onMediaSelect: (media: Media) => void
  onNewSearch: () => void
  toggleBookmark: (media: Media) => void
  isBookmarked: (id: string, tmdbId?: number) => boolean
}

function MediaResults({ media, onMediaSelect, onNewSearch, toggleBookmark, isBookmarked }: MediaResultsProps) {
  // Function to generate a random color for media cards
  const getRandomColor = (seed: string) => {
    // Use the media ID or title as a seed for consistent colors per media
    const colors = [
      "from-blue-900/40 to-sky-900/40",
      "from-purple-900/40 to-pink-900/40",
      "from-red-900/40 to-orange-900/40",
      "from-green-900/40 to-emerald-900/40",
      "from-yellow-900/40 to-amber-900/40",
      "from-indigo-900/40 to-violet-900/40",
      "from-rose-900/40 to-pink-900/40",
      "from-teal-900/40 to-sky-900/40",
    ]

    // Simple hash function to get a consistent index
    const hash = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="py-4"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Search Results</h2>
        <Button variant="ghost" className="text-blue-300 hover:text-white hover:bg-blue-800/30" onClick={onNewSearch}>
          <Search className="w-4 h-4 mr-2" />
          New search
        </Button>
      </div>

      {media.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-blue-300">No results found. Try a different search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {media.map((item, index) => (
            <motion.div
              key={item.id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="h-full"
            >
              <div className="overflow-hidden bg-gray-800/80 border-gray-700/30 rounded-lg backdrop-blur-md hover:shadow-lg hover:shadow-sky-500/20 transition-all duration-300 group h-full flex flex-col relative">
                {/* Bookmark button */}
                <motion.button
                  className={`absolute top-2 right-2 z-10 p-2 rounded-full ${
                    isBookmarked(item.id, item.tmdb)
                      ? "bg-sky-600 text-white"
                      : "bg-black/70 text-white/70 hover:bg-sky-900/80"
                  } transition-colors duration-300`}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleBookmark(item)
                  }}
                  whileHover={{ scale: 1.1, boxShadow: "0 0 8px rgba(14, 165, 233, 0.5)" }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Bookmark className="w-4 h-4" fill={isBookmarked(item.id, item.tmdb) ? "currentColor" : "none"} />
                </motion.button>

                <div
                  className="relative aspect-[2/3] w-full overflow-hidden bg-gray-700 max-h-[180px] cursor-pointer"
                  onClick={() => onMediaSelect(item)}
                >
                  {/* Placeholder image with random gradient color */}
                  <div
                    className={`flex items-center justify-center w-full h-full bg-gradient-to-br ${getRandomColor(
                      item.id || item.title,
                    )}`}
                  >
                    {item.type === "tv" ? (
                      <Tv className="w-10 h-10 text-gray-600/80" />
                    ) : (
                      <Film className="w-10 h-10 text-gray-600/80" />
                    )}
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col cursor-pointer" onClick={() => onMediaSelect(item)}>
                  <div className="overflow-hidden h-6 mb-2">
                    {item.title.length > 20 ? (
                      <div className="animate-marquee whitespace-nowrap">
                        <h3 className="text-lg font-medium text-white inline-block">{item.title}</h3>
                        <span className="inline-block px-4">•</span>
                        <h3 className="text-lg font-medium text-white inline-block">{item.title}</h3>
                      </div>
                    ) : (
                      <h3 className="text-lg font-medium text-white truncate">{item.title}</h3>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-auto">
                    {item.year && (
                      <span className="px-2 py-1 text-xs text-sky-400 bg-black/50 border border-sky-900/30 rounded-md">
                        {item.year}
                      </span>
                    )}
                    <span className="px-2 py-1 text-xs text-sky-400 bg-black/50 border border-sky-900/30 rounded-md">
                      {item.type === "tv" ? `TV: ${item.tmdb}` : `IMDB: ${item.imdb}`}
                    </span>
                  </div>
                  {item.genre && <p className="mt-2 text-xs text-gray-400 truncate">{item.genre}</p>}

                  {/* Media type badge */}
                  <div className="absolute top-2 left-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-md ${
                        item.type === "tv" ? "bg-sky-600/70 text-white" : "bg-blue-600/70 text-white"
                      }`}
                    >
                      {item.type === "tv" ? "TV Series" : "Movie"}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
