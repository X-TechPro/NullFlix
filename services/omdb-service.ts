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

export async function fetchMovieDetails(title: string): Promise<OMDBResponse | null> {
  try {
    // Check if OMDB API is enabled
    const isOMDBEnabled = localStorage.getItem("omdbEnabled") === "true"
    if (!isOMDBEnabled) {
      return null
    }

    // Get API key from localStorage
    const apiKey = localStorage.getItem("omdbApiKey")
    if (!apiKey) {
      console.error("OMDB API key not found")
      return null
    }

    // Fetch movie details from OMDB API
    const response = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${apiKey}`)
    const data = await response.json()

    // Check if the response is valid
    if (data.Response === "True") {
      return data
    } else {
      console.error("OMDB API error:", data.Error)
      return null
    }
  } catch (error) {
    console.error("Error fetching movie details:", error)
    return null
  }
}

export async function fetchMovieDetailsByIMDB(imdbId: string): Promise<OMDBResponse | null> {
  try {
    // Check if OMDB API is enabled
    const isOMDBEnabled = localStorage.getItem("omdbEnabled") === "true"
    if (!isOMDBEnabled) {
      return null
    }

    // Get API key from localStorage
    const apiKey = localStorage.getItem("omdbApiKey")
    if (!apiKey) {
      console.error("OMDB API key not found")
      return null
    }

    // Fetch movie details from OMDB API
    const response = await fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=${apiKey}`)
    const data = await response.json()

    // Check if the response is valid
    if (data.Response === "True") {
      return data
    } else {
      console.error("OMDB API error:", data.Error)
      return null
    }
  } catch (error) {
    console.error("Error fetching movie details:", error)
    return null
  }
}

// Add a new function to search movies via OMDB API

export async function searchMoviesViaOMDB(query: string): Promise<OMDBResponse[]> {
  try {
    // Check if OMDB API is enabled
    const isOMDBEnabled = localStorage.getItem("omdbEnabled") === "true"
    if (!isOMDBEnabled) {
      return []
    }

    // Get API key from localStorage
    const apiKey = localStorage.getItem("omdbApiKey")
    if (!apiKey) {
      console.error("OMDB API key not found")
      return []
    }

    // Fetch search results from OMDB API
    const response = await fetch(`https://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=${apiKey}`)
    const data = await response.json()

    // Check if the response is valid
    if (data.Response === "True" && Array.isArray(data.Search)) {
      return data.Search
    } else {
      console.error("OMDB API search error:", data.Error)
      return []
    }
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
