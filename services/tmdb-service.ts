// TMDB API Service (renamed from omdb-service)

export interface TMDBMovie {
  id: string
  title: string
  original_title: string
  overview: string
  poster_path: string
  backdrop_path: string
  media_type: string
  release_date?: string
  genre_ids?: number[]
  popularity?: number
  vote_average?: number
  vote_count?: number
}

// Helper to get TMDB API key
function getTMDBApiKey(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("tmdbApiKey")
  }
  return null
}

// Generalized fetch function for TMDB
async function fetchTMDB(url: string): Promise<any | null> {
  const apiKey = getTMDBApiKey()
  if (!apiKey) return null
  try {
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    })
    const data = await response.json()
    return data
  } catch (error) {
    console.error("TMDB API fetch error:", error)
    return null
  }
}

export async function searchMoviesViaTMDB(query: string): Promise<TMDBMovie[]> {
  const apiKey = getTMDBApiKey()
  if (!apiKey) return []
  try {
    const movieUrl = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}`
    const tvUrl = `https://api.themoviedb.org/3/search/tv?query=${encodeURIComponent(query)}`
    // Fetch both in parallel
    const [movieData, tvData] = await Promise.all([
      fetchTMDB(movieUrl),
      fetchTMDB(tvUrl)
    ])
    const movieResults = (movieData && Array.isArray(movieData.results)) ? movieData.results : []
    const tvResults = (tvData && Array.isArray(tvData.results)) ? tvData.results : []
    // Add media_type for later distinction
    const moviesWithType = movieResults.map((m: any) => ({ ...m, media_type: "movie" }))
    const tvWithType = tvResults.map((t: any) => ({ ...t, media_type: "tv" }))
    return [...moviesWithType, ...tvWithType]
  } catch (error) {
    console.error("Error searching movies via TMDB:", error)
    return []
  }
}

export async function fetchMovieDetailsByTMDB(id: string, type: "movie" | "tv" = "movie"): Promise<TMDBMovie | null> {
  const apiKey = getTMDBApiKey()
  if (!apiKey) return null
  try {
    const url = `https://api.themoviedb.org/3/${type}/${id}`
    const data = await fetchTMDB(url)
    if (data && data.id) return data
    return null
  } catch (error) {
    console.error("Error fetching movie details via TMDB:", error)
    return null
  }
}

export function getTMDBPoster(posterPath: string): string {
  if (!posterPath) return ""
  return `https://image.tmdb.org/t/p/w500/${posterPath}`
}
