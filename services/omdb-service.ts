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
  Ratings: { Source: string; Value: string }[]
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

// Function to search movies by title using OMDB API
export async function searchMoviesByTitle(title: string): Promise<OMDBResponse[]> {
  try {
    const apiKey = localStorage.getItem("omdbApiKey")
    if (!apiKey) {
      throw new Error("OMDB API key not found")
    }

    const response = await fetch(`https://www.omdbapi.com/?s=${encodeURIComponent(title)}&apikey=${apiKey}`)
    const data = await response.json()

    if (data.Response === "True" && data.Search) {
      // Return the search results
      return data.Search
    } else {
      console.warn("OMDB API search error:", data.Error)
      return []
    }
  } catch (error) {
    console.error("Error searching OMDB API:", error)
    return []
  }
}

// Function to get movie details by IMDB ID
export async function fetchMovieDetailsByIMDB(imdbId: string): Promise<OMDBResponse> {
  try {
    const apiKey = localStorage.getItem("omdbApiKey")
    if (!apiKey) {
      throw new Error("OMDB API key not found")
    }

    const response = await fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=${apiKey}`)
    const data = await response.json()

    if (data.Response === "True") {
      return data
    } else {
      throw new Error(data.Error || "Failed to fetch movie details")
    }
  } catch (error) {
    console.error("Error fetching movie details:", error)
    throw error
  }
}

// Function to get movie details by title
export async function fetchMovieDetailsByTitle(title: string): Promise<OMDBResponse> {
  try {
    const apiKey = localStorage.getItem("omdbApiKey")
    if (!apiKey) {
      throw new Error("OMDB API key not found")
    }

    const response = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${apiKey}`)
    const data = await response.json()

    if (data.Response === "True") {
      return data
    } else {
      throw new Error(data.Error || "Failed to fetch movie details")
    }
  } catch (error) {
    console.error("Error fetching movie details:", error)
    throw error
  }
}

// Function to get high resolution poster
export function getHighResolutionPoster(posterUrl: string): string {
  if (!posterUrl || posterUrl === "N/A") return ""
  return posterUrl.replace("SX300", "SX900")
}

// Convert OMDB response to our Media format
export function convertOMDBToMedia(omdbData: OMDBResponse): any {
  return {
    id: omdbData.imdbID,
    imdb: omdbData.imdbID,
    title: omdbData.Title,
    year: Number.parseInt(omdbData.Year) || null,
    genre: omdbData.Genre,
    type: omdbData.Type === "movie" ? "movie" : "tv",
    tmdb: 0, // OMDB doesn't provide TMDB IDs
  }
}
