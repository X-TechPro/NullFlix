import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Film } from "lucide-react"
import { getTMDBPoster } from "@/services/tmdb-service"

interface TrendingMovie {
  id: number
  title: string
  poster_path: string | null
  release_date?: string
}

interface TrendingMoviesRowProps {
  onMovieClick?: (movie: TrendingMovie) => void
}

export default function TrendingMoviesRow({ onMovieClick }: TrendingMoviesRowProps) {
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
      <div className="mb-2">
        <h2 className="text-xl font-bold text-white text-left">Trending</h2>
        <div className="h-1 w-[90px] bg-[color:var(--theme-primary)] rounded-full mt-1 mx-0" />
      </div>
      <div className="overflow-x-auto hide-scrollbar">
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
