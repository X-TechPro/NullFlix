import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Play, Star, Clock, Tv, Film } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Media } from "@/services/movie-service"
import { fetchMovieDetailsByTMDB, getTMDBPoster } from "@/services/tmdb-service"
import MoviePlayer from "@/components/movie-player"
import TVEpisodeSelector from "@/components/tv-episode-selector"

export interface MediaResultsProps {
  media: Media[]
  onMediaSelect: (media: Media) => void
  onNewSearch: () => void
  toggleBookmark: (media: Media) => void
  isBookmarked: (id: string, tmdbId?: number | undefined) => boolean
}

export function MediaResults({ media, onMediaSelect, onNewSearch, toggleBookmark, isBookmarked }: MediaResultsProps) {
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null)
  const [movieDetails, setMovieDetails] = useState<any | null>(null)
  const [showPlayer, setShowPlayer] = useState(false)
  const [playerMedia, setPlayerMedia] = useState<{ id: string, type: "movie" | "tv", title?: string } | null>(null)
  const [showEpisodeSelector, setShowEpisodeSelector] = useState(false)
  const [episodeSelectorTmdbId, setEpisodeSelectorTmdbId] = useState<string | null>(null)

  // Fetch and cache all movie details on mount or when media changes
  useEffect(() => {
    async function fetchAndCacheAllDetails() {
      for (const item of media) {
        const key = `movieDetails_${item.tmdb || item.id}`
        if (!localStorage.getItem(key)) {
          try {
            const details = await fetchMovieDetailsByTMDB(item.tmdb, item.type)
            localStorage.setItem(key, JSON.stringify(details))
          } catch (err) {
            // Optionally store a marker for failed fetch
            localStorage.setItem(key, JSON.stringify({ error: true }))
          }
        }
      }
    }
    if (media.length > 0) fetchAndCacheAllDetails()
  }, [media])

  // Handle card click: get details from localStorage and show popup
  const handleCardClick = (item: Media) => {
    const key = `movieDetails_${item.tmdb || item.id}`
    const detailsStr = localStorage.getItem(key)
    let details = null
    try {
      details = detailsStr ? JSON.parse(detailsStr) : null
    } catch {
      details = null
    }
    setMovieDetails(details)
    setSelectedMedia(item)
  }

  // Play button logic (copy from movie-details-popup)
  const handlePlay = (media: Media, details?: any) => {
    if (media.type === "tv") {
      setEpisodeSelectorTmdbId((media.tmdb || media.id).toString())
      setShowEpisodeSelector(true)
      setSelectedMedia(null)
      return
    }
    if (typeof window !== "undefined" && (details?.title || media.title)) {
      localStorage.setItem("snayerTitle", details?.title || media.title)
    }
    setPlayerMedia({ id: media.tmdb || media.id, type: media.type, title: details?.title || media.title })
    setShowPlayer(true)
  }

  // Handle episode selection from TVEpisodeSelector
  const handleSelectEpisode = (season: number, episode: number) => {
    if (episodeSelectorTmdbId) {
      setPlayerMedia({ id: episodeSelectorTmdbId, type: "tv", title: undefined })
      setShowPlayer(true)
      setShowEpisodeSelector(false)
      setEpisodeSelectorTmdbId(null)
      // Optionally, you can store season/episode in localStorage or pass as props to MoviePlayer if needed
      // For now, just play the show (MoviePlayer may need to be updated to accept season/episode)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="py-4"
    >
      {/* Player modal */}
      <AnimatePresence>
        {showPlayer && playerMedia && (
          <MoviePlayer
            mediaId={playerMedia.id}
            mediaType={playerMedia.type}
            title={playerMedia.title}
            onClose={() => { setShowPlayer(false); setPlayerMedia(null) }}
          />
        )}
      </AnimatePresence>
      {/* TV Episode Selector modal */}
      <AnimatePresence>
        {showEpisodeSelector && episodeSelectorTmdbId && (
          <TVEpisodeSelector
            tmdbId={episodeSelectorTmdbId}
            onSelectEpisode={handleSelectEpisode}
            onClose={() => { setShowEpisodeSelector(false); setEpisodeSelectorTmdbId(null) }}
          />
        )}
      </AnimatePresence>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Search Results</h2>
        <Button variant="ghost" className="text-[color:var(--theme-secondary-lighter)] hover:text-white hover:bg-[color:var(--theme-hover)]" onClick={onNewSearch}>
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="11" cy="11" r="8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
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
              layoutId={`card-${item.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="h-full cursor-pointer bg-slate-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-200 border border-slate-700 will-change-transform relative"
              onClick={() => handleCardClick(item)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Bookmark button (keep logic/design from movie-results.tsx) */}
              <motion.button
                className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  isBookmarked(item.id, item.tmdb ? Number(item.tmdb) : undefined)
                    ? "bg-[color:var(--theme-primary)] text-white"
                    : "bg-black/70 text-white/70 hover:bg-[color:var(--theme-hover)]"
                }`}
                onClick={e => {
                  e.stopPropagation()
                  toggleBookmark(item)
                }}
                whileHover={{ scale: 1.1, boxShadow: "0 0 8px var(--theme-shadow)" }}
                whileTap={{ scale: 0.9 }}
              >
                <svg className="w-4 h-4" fill={isBookmarked(item.id, item.tmdb ? Number(item.tmdb) : undefined) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
              </motion.button>

              {/* Poster section */}
              <motion.div
                layoutId={`poster-${item.id}`}
                className="relative h-36 md:h-44 overflow-hidden transform-gpu will-change-transform"
              >
                {/* Blurred background */}
                <div
                  className="absolute inset-0 bg-cover bg-center filter blur-lg scale-110"
                  style={{ backgroundImage: `url(${item.poster || "/placeholder.svg"})` }}
                />
                {/* Main poster image */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    src={item.poster || "/placeholder.svg"}
                    alt={item.title}
                    className="h-full w-auto object-contain max-w-[80%]"
                  />
                </div>
                {/* Media type pill - top left */}
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">
                  {item.type === "tv" ? "TV Series" : "Movie"}
                </div>
                <motion.div
                  layoutId={`overlay-${item.id}`}
                  className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transform-gpu will-change-transform"
                />
              </motion.div>

              {/* Content section */}
              <motion.div layoutId={`content-${item.id}`} className="p-3 md:p-4 transform-gpu will-change-transform">
                <motion.h2
                  layoutId={`title-${item.id}`}
                  className="text-sm md:text-base font-bold text-white mb-2 transform-gpu will-change-transform"
                >
                  {item.title}
                </motion.h2>
                <div className="flex items-center gap-2">
                  <motion.div
                    layoutId={`year-${item.id}`}
                    className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded-full text-blue-400 font-medium text-xs border border-sky-600 will-change-transform"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    {item.year}
                  </motion.div>
                  <div className="bg-black/50 px-2 py-1 rounded-full text-blue-400 font-medium text-xs border border-sky-600">
                    TMDB: {item.tmdb}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Details Popup (open instantly, use cached details) */}
      <AnimatePresence>
        {selectedMedia && movieDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start md:items-center justify-center p-2 md:p-4 transform-gpu will-change-transform"
            onClick={() => setSelectedMedia(null)}
          >
            <motion.div
              layoutId={`card-${selectedMedia.id}`}
              onClick={e => e.stopPropagation()}
              className="bg-slate-800 border border-slate-700 rounded-3xl overflow-hidden w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] flex flex-col shadow-2xl will-change-transform"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "tween", duration: 0.12, ease: [0.25, 1, 0.5, 1] }}
            >
              <div className="overflow-y-auto flex flex-col md:flex-row h-full">
                {/* Poster section */}
                <div className="md:sticky md:top-0 md:h-[90vh] md:overflow-hidden">
                  <motion.div
                    layoutId={`poster-${selectedMedia.id}`}
                    className="relative w-full md:w-80 h-64 md:h-[90vh] flex-shrink-0 transform-gpu will-change-transform"
                  >
                    <img
                      src={movieDetails?.poster_path ? getTMDBPoster(movieDetails.poster_path) : (selectedMedia.poster || "/placeholder.svg")}
                      alt={selectedMedia.title}
                      className="w-full h-full object-cover"
                    />
                    <motion.div
                      layoutId={`overlay-${selectedMedia.id}`}
                      className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transform-gpu will-change-transform"
                    />
                    {/* Close button for mobile */}
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2, duration: 0.2 }}
                      className="absolute top-4 right-4 md:hidden bg-black/50 backdrop-blur-sm rounded-full p-2 text-white hover:bg-black/70 transition-colors duration-150 transform-gpu"
                      onClick={() => setSelectedMedia(null)}
                    >
                      <X className="w-6 h-6" />
                    </motion.button>
                  </motion.div>
                </div>
                {/* Content section */}
                <motion.div
                  layoutId={`content-${selectedMedia.id}`}
                  className="flex-1 md:overflow-y-auto transform-gpu will-change-transform"
                >
                  <div className="p-4 md:p-8 flex flex-col justify-between min-h-full">
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <motion.h2
                          layoutId={`title-${selectedMedia.id}`}
                          className="text-2xl md:text-4xl font-bold text-white pr-4 transform-gpu will-change-transform"
                        >
                          {movieDetails?.title || selectedMedia.title}
                        </motion.h2>
                        {/* Close button for desktop */}
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2, duration: 0.2 }}
                          className="hidden md:block bg-slate-700 hover:bg-slate-600 rounded-full p-2 text-slate-300 hover:text-white transition-colors duration-150 flex-shrink-0 transform-gpu"
                          onClick={() => setSelectedMedia(null)}
                        >
                          <X className="w-6 h-6" />
                        </motion.button>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-4 md:mb-6">
                        {/* Year */}
                        <motion.div
                          layoutId={`year-${selectedMedia.id}`}
                          className="flex items-center gap-1 bg-slate-700 px-3 py-1 rounded-full text-slate-200 font-medium text-base md:text-lg will-change-transform"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          {movieDetails?.release_date ? new Date(movieDetails.release_date).getFullYear() : (selectedMedia.year || "N/A")}
                        </motion.div>
                        {/* Rating */}
                        {movieDetails?.vote_average && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: 0.05, duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
                            className="flex items-center gap-2 bg-slate-700 px-3 py-1 rounded-full transform-gpu will-change-transform"
                          >
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-slate-200 font-medium text-sm md:text-base">
                              {movieDetails.vote_average}
                            </span>
                          </motion.div>
                        )}
                        {/* Runtime */}
                        {movieDetails?.runtime && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: 0.08, duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
                            className="flex items-center gap-2 bg-slate-700 px-3 py-1 rounded-full transform-gpu will-change-transform"
                          >
                            <Clock className="w-4 h-4 text-slate-300" />
                            <span className="text-slate-200 font-medium text-sm md:text-base">
                              {movieDetails.runtime} min
                            </span>
                          </motion.div>
                        )}
                      </div>
                      {/* Genre tags */}
                      {movieDetails?.genres && movieDetails.genres.length > 0 && (
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
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.15, duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                        className="text-slate-300 leading-relaxed text-sm md:text-lg transform-gpu will-change-transform"
                      >
                        {movieDetails?.overview || "N/A"}
                      </motion.p>
                    </div>
                    {/* Play button */}
                    <motion.div
                      initial={{ opacity: 0, y: 40, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.18, duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                      className="flex justify-end pt-4 border-t border-slate-700 md:border-t-0 md:pt-0 transform-gpu will-change-transform"
                    >
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-full px-6 md:px-8 py-2 md:py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-sm md:text-base"
                        onClick={() => { handlePlay(selectedMedia, movieDetails); setSelectedMedia(null) }}
                      >
                        <Play className="w-4 md:w-5 h-4 md:h-5 mr-2 fill-white" />
                        Play Now
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
