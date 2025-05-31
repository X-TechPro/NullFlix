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
  // If running on the server (e.g., in Vercel), prioritize env variable
  if (typeof window === "undefined") {
    const apiKey = process.env.TMDB_API_KEY
    if (!apiKey) console.error("TMDB API key not found in environment variables")
    return apiKey || null
  }

  // If running in the browser, use localStorage fallback
  let apiKey = localStorage.getItem("tmdbApiKey")
  if (!apiKey) {
    console.warn("TMDB API key not found in localStorage, setting a placeholder.")
    localStorage.setItem("tmdbApiKey", "YOUR_TMDB_API_KEY")
    apiKey = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2ZWFjNjM1ODA4YmRjMDJkZjI2ZDMwMjk0MGI0Y2EzNyIsIm5iZiI6MTc0ODY4NTIxNy43Mjg5OTk5LCJzdWIiOiI2ODNhZDFhMTkyMWI4N2IxYzk1Mzc4ODQiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.w-oWdRIxwlXKTpP42Yo87Mld5sqp8uNFpDHgrqB6a3U"
  }
  return apiKey
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
    const url = `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(query)}`
    const data = await fetchTMDB(url)
    if (data && Array.isArray(data.results)) return data.results
    return []
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
