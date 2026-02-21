import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Film } from "lucide-react"
import { getTMDBPoster } from "@/services/tmdb-service"

export interface TrendingMovie {
  id: number
  title: string
  poster_path: string | null
  release_date?: string
  type?: "movie" | "tv"
}

interface TrendingMoviesRowProps {
  onMovieClick?: (movie: TrendingMovie) => void
  toggleBookmark?: (movie: TrendingMovie) => void
  isBookmarked?: (id: string, tmdbId?: number) => boolean
}

export default function TrendingMoviesRow({ onMovieClick, toggleBookmark, isBookmarked }: TrendingMoviesRowProps) {
  const [movies, setMovies] = useState<TrendingMovie[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true)
      try {
        const apiKey = localStorage.getItem("tmdbApiKey")
        if (!apiKey) return
        const res = await fetch(
          "https://api.themoviedb.org/3/trending/movie/day?language=en-US",
          {
            headers: {
              accept: "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
          }
        )
        const data = await res.json()
        setMovies(Array.isArray(data.results) ? data.results : [])
      } catch (e) {
        setMovies([])
      } finally {
        setLoading(false)
      }
    }
    fetchTrending()
  }, [])

  if (loading) return null
  if (!movies.length) return null

  return (
    <div className="w-full mb-8">
      <style jsx global>{`
        .trending-scrollbar::-webkit-scrollbar {
          height: 8px;
        }

        .trending-scrollbar::-webkit-scrollbar-track {
          background: #1e293b;
          border-radius: 4px;
        }

        .trending-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 4px;
        }

        .trending-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>
      <div className="mb-2">
        <h2 className="text-xl font-bold text-white text-left">Trending</h2>
        <div className="h-1 w-[90px] bg-[color:var(--theme-primary)] rounded-full mt-1 mx-0" />
      </div>
      <div className="overflow-x-auto trending-scrollbar">
        <div className="flex gap-4">
          {movies.map((movie) => (
            <motion.div
              key={movie.id}
              className="flex-shrink-0 w-32 cursor-pointer group relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => onMovieClick && onMovieClick(movie)}
            >
              <div className="aspect-[2/3] w-full overflow-hidden bg-gray-800 rounded-lg border border-gray-700/40 shadow-lg group-hover:shadow-[color:var(--theme-shadow)] transition-all duration-300 relative">
                {/* Bookmark button */}
                {toggleBookmark && isBookmarked && (
                  <motion.button
                    className={`absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-300 ${
                      isBookmarked(movie.id.toString(), movie.id)
                        ? "bg-[color:var(--theme-primary)] text-white"
                        : "bg-black/70 text-white/70 hover:bg-[color:var(--theme-hover)]"
                    }`}
                    onClick={e => {
                      e.stopPropagation()
                      toggleBookmark(movie)
                    }}
                    whileHover={{ scale: 1.1, boxShadow: "0 0 8px var(--theme-shadow)" }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg className="w-3.5 h-3.5" fill={isBookmarked(movie.id.toString(), movie.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </motion.button>
                )}
                {movie.poster_path ? (
                  <img
                    src={getTMDBPoster(movie.poster_path)}
                    alt={movie.title}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full bg-blue-900/40">
                    <Film className="w-10 h-10 text-blue-300/50" />
                  </div>
                )}
              </div>
              <div className="mt-2 text-xs text-white truncate text-center">
                {movie.title}
              </div>
              {movie.release_date && (
                <div className="text-[10px] text-[color:var(--theme-primary)] text-center">
                  {movie.release_date.slice(0, 4)}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
