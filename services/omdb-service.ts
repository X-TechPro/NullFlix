// OMDB API Service

export interface OMDBResponse {
  Title: string
  Year: string
  Rated: string
  Released: string
  Runtime: string
  Genre: string
  Director: string
  Writer: string
  Actors: string
  Plot: string
  Language: string
  Country: string
  Awards: string
  Poster: string
  Ratings: {
    Source: string
    Value: string
  }[]
  Metascore: string
  imdbRating: string
  imdbVotes: string
  imdbID: string
  Type: string
  DVD: string
  BoxOffice: string
  Production: string
  Website: string
  Response: string
}

// Helper to get OMDB API key if enabled
function getOMDBApiKey(): string | null {
  // Always use a default key if none is set
  if (typeof window !== "undefined") {
    // If no key is set, set the default key for first-time users
    if (!localStorage.getItem("omdbApiKey")) {
      localStorage.setItem("omdbApiKey", "9f603783")
    }
  }
  // Optionally, you can keep the omdbEnabled logic if needed
  // if (localStorage.getItem("omdbEnabled") !== "true") return null
  const apiKey = localStorage.getItem("omdbApiKey")
  if (!apiKey) console.error("OMDB API key not found")
  return apiKey
}

// Generalized fetch function
async function fetchOMDB(params: string): Promise<any | null> {
  const apiKey = getOMDBApiKey()
  if (!apiKey) return null
  try {
    const response = await fetch(`https://www.omdbapi.com/?${params}&apikey=${apiKey}`)
    const data = await response.json()
    if (data.Response === "True") return data
    console.error("OMDB API error:", data.Error)
    return null
  } catch (error) {
    console.error("OMDB API fetch error:", error)
    return null
  }
}

export async function fetchMovieDetails(title: string): Promise<OMDBResponse | null> {
  return fetchOMDB(`t=${encodeURIComponent(title)}`)
}

export async function fetchMovieDetailsByIMDB(imdbId: string): Promise<OMDBResponse | null> {
  return fetchOMDB(`i=${imdbId}`)
}

// Add a new function to search movies via OMDB API
export async function searchMoviesViaOMDB(query: string): Promise<OMDBResponse[]> {
  const apiKey = getOMDBApiKey()
  if (!apiKey) return []
  try {
    const response = await fetch(`https://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=${apiKey}`)
    const data = await response.json()
    if (data.Response === "True" && Array.isArray(data.Search)) return data.Search
    console.error("OMDB API search error:", data.Error)
    return []
  } catch (error) {
    console.error("Error searching movies via OMDB:", error)
    return []
  }
}

export function getHighResolutionPoster(posterUrl: string): string {
  if (!posterUrl || posterUrl === "N/A") {
    return ""
  }

  // Replace SX300 with SX900 for higher resolution
  return posterUrl.replace("SX300", "SX900")
}
