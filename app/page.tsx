"use client"

import type React from "react"

import { Analytics } from "@vercel/analytics/next"
import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Sparkles, Github, Settings, Bookmark, Loader2, Film, AlertCircle, Tv } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import BackgroundShapes from "@/components/background-shapes"
import BookmarksArea from "@/components/bookmarks-area"
import SettingsDialog from "@/components/settings-dialog"
import MoviePlayer from "@/components/movie-player"
import MovieDetailsPopup from "@/components/movie-details-popup"
import TVEpisodeSelector from "@/components/tv-episode-selector"
import GlowingSearchBar from "@/components/glowing-search-bar"
import { searchMedia, type Media } from "@/services/movie-service"
import TVDetailsPopup from "@/components/tv-details-popup"
import TrendingMoviesRow from "@/components/trending-movies-row"
import { fetchMovieDetailsByTMDB } from "@/services/tmdb-service"

// Add Telegram SVG icon component
const Telegram = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 192 192"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    width={props.width || 20}
    height={props.height || 20}
    {...props}
  >
    <path stroke="currentColor" strokeWidth="13.44" d="M23.073 88.132s65.458-26.782 88.16-36.212c8.702-3.772 38.215-15.843 38.215-15.843s13.621-5.28 12.486 7.544c-.379 5.281-3.406 23.764-6.433 43.756-4.54 28.291-9.459 59.221-9.459 59.221s-.756 8.676-7.188 10.185c-6.433 1.509-17.027-5.281-18.919-6.79-1.513-1.132-28.377-18.106-38.214-26.404-2.649-2.263-5.676-6.79.378-12.071 13.621-12.447 29.891-27.913 39.728-37.72 4.54-4.527 9.081-15.089-9.837-2.264-26.864 18.483-53.35 35.835-53.35 35.835s-6.053 3.772-17.404.377c-11.351-3.395-24.594-7.921-24.594-7.921s-9.08-5.659 6.433-11.693Z"></path>
  </svg>
)

export default function Home() {
  const [query, setQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingMedia, setIsLoadingMedia] = useState(false)
  const [bookmarks, setBookmarks] = useState<any[]>([])
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [mediaResults, setMediaResults] = useState<Media[]>([])
  const [selectedMovie, setSelectedMovie] = useState<string | null>(null)
  const [selectedTVShow, setSelectedTVShow] = useState<string | null>(null)
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null)
  const [selectedEpisode, setSelectedEpisode] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchInitiated, setSearchInitiated] = useState(false)
  const [showMovieDetails, setShowMovieDetails] = useState(false)
  const [selectedMediaForDetails, setSelectedMediaForDetails] = useState<string | null>(null)
  const [showTVDetails, setShowTVDetails] = useState(false)
  const [selectedTVShowForDetails, setSelectedTVShowForDetails] = useState<string | null>(null)
  const [discoverEnabled, setDiscoverEnabled] = useState(false)
  const [cardRect, setCardRect] = useState<DOMRect | null>(null)

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

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDiscoverEnabled(localStorage.getItem("discover") === "true")
      window.addEventListener("storage", () => {
        setDiscoverEnabled(localStorage.getItem("discover") === "true")
      })
    }
  }, [])

  // Check for ?movie= or ?tv= in the URL on page load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const movieId = params.get("movie")
      const tvId = params.get("tv")
      if (movieId) {
        setSelectedMediaForDetails(movieId)
        setShowMovieDetails(true)
      } else if (tvId) {
        setSelectedTVShowForDetails(tvId)
        setShowTVDetails(true)
      }
    }
  }, [])

  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!query.trim()) return

      // TMDB API is always enabled, so skip checks

      setSearchInitiated(true)
      setIsSearching(true)

      setTimeout(async () => {
        try {
          const results = await searchMedia(query)
          setMediaResults(results)
          setShowBookmarks(false)
        } catch (error) {
          console.error("Search error:", error)
        } finally {
          setIsSearching(false)
        }
      }, 500)
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
        tmdbID: media.tmdb || media.id, // For movies

        // Display information
        title: media.title,
        year: media.year?.toString() || "",
        genre: media.genre || "",

        // Type information
        type: media.type,
        mediaType: media.type,

        // Additional data
        seasons: media.seasons || [],
        poster: media.poster, // Save poster URL

        // Timestamp for sorting
        bookmarkedAt: new Date().toISOString(),
      }

      const exists = prev.some(
        (item) =>
          item.id === media.id ||
          (media.tmdb && item.tmdbID === media.tmdb)
      )

      if (exists) {
        return prev.filter(
          (item) =>
            item.id !== media.id &&
            (media.tmdb ? item.tmdbID !== media.tmdb : true)
        )
      } else {
        return [...prev, bookmarkItem]
      }
    })
  }

  // Update the isBookmarked function to check all possible IDs
  const isBookmarked = (mediaId: string, tmdbId?: number) => {
    return bookmarks.some(
      (item) =>
        item.id === mediaId ||
        (typeof tmdbId !== "undefined" && item.tmdb === String(tmdbId))
    )
  }

  const resetSearch = () => {
    setSearchInitiated(false)
    setMediaResults([])
    setQuery("")
    setError(null)
  }

  const handleMediaSelect = (media: Media) => {
    if (media.type === "movie") {
      setSelectedMediaForDetails(media.tmdb || media.id)
      setShowMovieDetails(true)
    } else if (media.type === "tv") {
      setSelectedTVShowForDetails(media.tmdb || media.id)
      setShowTVDetails(true)
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

  const handleCloseMovieDetails = () => {
    setShowMovieDetails(false)
    setSelectedMediaForDetails(null)
  }

  const handlePlayFromDetails = () => {
    setShowMovieDetails(false)
    setSelectedMovie(selectedMediaForDetails)
  }

  const handleCloseTVDetails = () => {
    setShowTVDetails(false)
    setSelectedTVShowForDetails(null)
  }

  const handlePlayTVFromDetails = (tmdbId: string) => {
    setShowTVDetails(false)
    setSelectedTVShow(tmdbId)
  }

  // Add handler for trending movie click
  const handleTrendingMovieClick = (movie: { id: number; _cardRect?: DOMRect }) => {
    setSelectedMediaForDetails(String(movie.id))
    setShowMovieDetails(true)
    setCardRect(movie._cardRect || null)
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <BackgroundShapes />
      <div className="container relative z-10 px-4 mx-auto">
        <div
          className={`flex items-center justify-between py-4 mt-4${discoverEnabled && !searchInitiated ? " mb-20" : ""}`}
        >
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
            <Sparkles className="w-6 h-6 text-[color:var(--theme-primary-light)]" />
            <h1 className="text-2xl font-bold text-white">NullFlix</h1>
          </motion.div>

          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center gap-3"
          >
            {/* Telegram button */}
            <motion.a
              href="https://t.me/nullflix"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-[color:var(--theme-secondary-lighter)] transition-colors rounded-full hover:text-white hover:bg-[color:var(--theme-hover)] flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Telegram className="w-5 h-5" />
            </motion.a>
            {/* Github button */}
            <motion.a
              href="https://github.com/X-TechPro/NullFlix"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-[color:var(--theme-secondary-lighter)] transition-colors rounded-full hover:text-white hover:bg-[color:var(--theme-hover)] flex items-center justify-center"
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
              className={`p-2 transition-colors rounded-full flex items-center justify-center ${showBookmarks ? "text-[color:var(--theme-primary-light)] bg-[color:var(--theme-hover)]" : "text-[color:var(--theme-secondary-lighter)] hover:text-white hover:bg-[color:var(--theme-hover)]"}`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bookmark className="w-5 h-5" />
            </motion.button>
            <motion.button
              onClick={() => setShowSettings(true)}
              className="p-2 text-[color:var(--theme-secondary-lighter)] transition-colors rounded-full hover:text-white hover:bg-[color:var(--theme-hover)] flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Settings className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </div>

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
              <Button className="mt-6 bg-[color:var(--theme-primary)] hover:bg-[color:var(--theme-button-hover)] text-white" onClick={() => setError(null)}>
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

              {/* Trending row below search bar, replacing Discover button if enabled */}
              <motion.p
                className="mt-12 text-lg text-[color:var(--theme-secondary-lighter)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                Welcome, find media to watch here!
              </motion.p>
              {discoverEnabled && (
                <div className="mt-10 w-full">
                  <TrendingMoviesRow onMovieClick={handleTrendingMovieClick} />
                </div>
              )}

              {!discoverEnabled && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                >
                  <Button
                    className="mt-6 bg-[color:var(--theme-primary)] hover:bg-[color:var(--theme-button-hover)] text-white px-6 py-2 h-auto text-base rounded-full transition-colors duration-300"
                    onClick={() => {
                      // Pick a random keyword from a list
                      const keywords = [
                        "action",
                        "comedy",
                        "drama",
                        "thriller",
                        "romance",
                        "sci-fi",
                        "fantasy",
                        "adventure",
                        "animation",
                        "mystery",
                        "crime",
                        "family",
                        "horror",
                        "documentary",
                        "superhero",
                        "history",
                        "music",
                        "sports",
                        "war",
                        "western",
                        "biography",
                        "kids",
                        "teen",
                        "classic",
                        "holiday",
                        "space",
                        "future",
                        "magic",
                        "robot",
                        "spy",
                        "detective",
                        "zombie",
                        "vampire",
                        "heist",
                        "courtroom",
                        "medical",
                        "political",
                        "nature",
                        "travel",
                        "cooking",
                        "anime"
                      ]
                      const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)]
                      setQuery(randomKeyword)
                      const event = { preventDefault: () => {} } as React.FormEvent
                      handleSearch(event)
                    }}
                  >
                    Discover
                  </Button>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <BookmarksArea
              bookmarks={bookmarks}
              toggleBookmark={toggleBookmark}
              isBookmarked={isBookmarked}
              onMediaSelect={(media) => {
                // Handle both old and new bookmark formats
                if (media.mediaType === "tv" || media.type === "tv") {
                  setSelectedTVShowForDetails(media.tmdbID || media.tmdb || media.id)
                  setShowTVDetails(true)
                } else {
                  // TMDB API is always enabled, so skip checks
                  // Show movie details popup first
                  setSelectedMediaForDetails(media.tmdbID || media.tmdb || media.id)
                  setShowMovieDetails(true)
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
        {selectedMovie && (
          <MoviePlayer 
            mediaId={selectedMovie} 
            mediaType="movie" 
            title={mediaResults.find(m => m.tmdb === selectedMovie || m.id === selectedMovie)?.title || bookmarks.find(b => b.tmdbID === selectedMovie || b.id === selectedMovie)?.title || ""}
            onClose={handleClosePlayer} 
          />
        )}
        {selectedTVShow && !selectedSeason && (
          <TVEpisodeSelector
            tmdbId={selectedTVShow}
            onSelectEpisode={handleEpisodeSelect}
            onClose={() => setSelectedTVShow(null)}
          />
        )}
        {selectedTVShow && selectedSeason && selectedEpisode && (
          <MoviePlayer
            mediaId={selectedTVShow}
            mediaType="tv"
            season={selectedSeason}
            episode={selectedEpisode}
            onClose={handleClosePlayer}
          />
        )}
        {showMovieDetails && selectedMediaForDetails && (
          <MovieDetailsPopup
            mediaId={selectedMediaForDetails}
            onClose={handleCloseMovieDetails}
            onPlay={handlePlayFromDetails}
            cardRect={cardRect}
          />
        )}
        {showTVDetails && selectedTVShowForDetails ? (
          <TVDetailsPopup
            tmdbId={selectedTVShowForDetails}
            onClose={handleCloseTVDetails}
            onPlay={handlePlayTVFromDetails}
          />
        ) : null}
      </AnimatePresence>
      <Analytics />
    </main>
  )
}

interface MediaResultsProps {
  media: Media[]
  onMediaSelect: (media: Media) => void
  onNewSearch: () => void
  toggleBookmark: (media: Media) => void
  isBookmarked: (id: string, tmdbId?: number | undefined) => boolean
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
        <Button variant="ghost" className="text-[color:var(--theme-secondary-lighter)] hover:text-white hover:bg-[color:var(--theme-hover)]" onClick={onNewSearch}>
          <Search className="w-4 h-4 mr-2" />
          New search
        </Button>
      </div>
      {media.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-[color:var(--theme-secondary-lighter)]">No results found. Try a different search term.</p>
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
              <div className="overflow-hidden bg-gray-800/80 border-gray-700/30 rounded-lg backdrop-blur-md hover:shadow-lg hover:shadow-[color:var(--theme-primary)] transition-all duration-300 group h-full flex flex-col relative">
                {/* Bookmark button */}
                <motion.button
                  className={`absolute top-2 right-2 z-10 p-2 rounded-full ${
                    isBookmarked(item.id, item.tmdb ? Number(item.tmdb) : undefined)
                      ? "bg-[color:var(--theme-primary)] text-white"
                      : "bg-black/70 text-white/70 hover:bg-[color:var(--theme-hover)]"
                  } transition-colors duration-300`}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleBookmark(item)
                  }}
                  whileHover={{ scale: 1.1, boxShadow: "0 0 8px var(--theme-shadow)" }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Bookmark className="w-4 h-4" fill={isBookmarked(item.id, item.tmdb ? Number(item.tmdb) : undefined) ? "currentColor" : "none"} />
                </motion.button>

                <div
                  className="relative aspect-[2/3] w-full overflow-hidden bg-gray-700 max-h-[180px] cursor-pointer movie-card-poster-container"
                  onClick={() => onMediaSelect(item)}
                >
                  {/* Show poster if available, otherwise show colored background */}
                  {item.poster ? (
                    <>
                      <div className="movie-card-poster-blur" style={{ backgroundImage: `url(${item.poster})` }}></div>
                      <img
                        src={item.poster || "/placeholder.svg"}
                        alt={item.title}
                        className="movie-card-poster-main"
                      />
                    </>
                  ) : (
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
                  )}
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
                      <span className="px-2 py-1 text-xs text-[color:var(--theme-secondary-light)] bg-black/50 border border-slate-700 rounded-md">
                        {item.year}
                      </span>
                    )}
                    <span className="px-2 py-1 text-xs text-[color:var(--theme-secondary-light)] bg-black/50 border border-slate-700 rounded-md">
                      TMDB: {item.tmdb}
                    </span>
                  </div>

                  {/* Media type badge */}
                  <div className="absolute top-2 left-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-md ${
                        item.type === "tv" ? "bg-[color:var(--theme-primary)] text-white" : "bg-[color:var(--theme-primary)] text-white"
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
