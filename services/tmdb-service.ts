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

export interface IMDBSearchResult {
  id: string // IMDB ID (e.g., "tt0317219")
  type: "movie" | "tv"
  primaryTitle: string
  originalTitle: string
  primaryImage?: {
    url: string
    width: number
    height: number
  }
  startYear?: number
  rating?: {
    aggregateRating: number
    voteCount: number
  }
}

export interface IMDBSearchResponse {
  titles: IMDBSearchResult[]
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

/**
 * Search titles using IMDB API (handles typos/fuzzy well)
 * Returns up to 50 results with IMDB IDs
 */
export async function searchViaIMDB(query: string): Promise<IMDBSearchResult[]> {
  if (!query.trim()) return []
  try {
    const url = `https://api.imdbapi.dev/search/titles?query=${encodeURIComponent(query)}`
    const response = await fetch(url)
    const data: IMDBSearchResponse = await response.json()
    return data.titles || []
  } catch (error) {
    console.error("Error searching via IMDB API:", error)
    return []
  }
}

/**
 * Find TMDB movie/TV details using IMDB ID via TMDB's Find by External ID endpoint
 */
export async function findTMDBByIMDBId(imdbId: string): Promise<TMDBMovie | null> {
  const apiKey = getTMDBApiKey()
  if (!apiKey || !imdbId) return null
  try {
    const url = `https://api.themoviedb.org/3/find/${imdbId}?external_source=imdb_id`
    const data = await fetchTMDB(url)
    if (!data) return null

    // TMDB returns results in different arrays based on type
    const movieResults = data.movie_results || []
    const tvResults = data.tv_results || []

    // Prefer movie results, fallback to TV
    const result = movieResults[0] || tvResults[0]

    if (result) {
      return {
        ...result,
        media_type: movieResults.length > 0 ? "movie" : "tv"
      }
    }
    return null
  } catch (error) {
    console.error("Error finding TMDB by IMDB ID:", error)
    return null
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
  return `https://image.tmdb.org/t/p/w780/${posterPath}`
}
