import { searchMediaInDB, getTVShowByTMDB } from "@/utils/db"

export interface Media {
  id: string
  title: string
  imdb?: string
  tmdb: number
  year?: number
  genre?: string
  type: "movie" | "tv"
  seasons?: number[]
}

export async function searchMedia(query: string): Promise<Media[]> {
  if (!query.trim()) return []

  // Use IndexedDB search to find both movies and TV shows
  return searchMediaInDB(query)
}

export function getProviderUrl(mediaId: string, mediaType: "movie" | "tv", season?: number, episode?: number): string {
  // Use a try-catch block to handle potential localStorage errors
  let provider = "embed.su"
  try {
    const savedProvider = localStorage.getItem("selectedProvider")
    if (savedProvider) {
      provider = savedProvider
    }
  } catch (error) {
    console.error("Error accessing localStorage:", error)
  }

  if (mediaType === "tv" && season !== undefined && episode !== undefined) {
    // TV show URL with season and episode
    switch (provider) {
      case "vidsrc":
        return `https://vidsrc.cc/v2/embed/tv/${mediaId}/${season}/${episode}`
      case "autoembed":
        return `https://player.autoembed.cc/embed/tv/${mediaId}/${season}/${episode}`
      case "2embed.cc":
        return `https://www.2embed.cc/embedtv/${mediaId}&s=${season}&e=${episode}`
      case "2embed.skin":
        return `https://www.2embed.skin/embedtv/${mediaId}&s=${season}&e=${episode}`
      case "vidsrc.xyz":
        return `https://vidsrc.xyz/embed/tv?imdb=${mediaId}&season=${season}&episode=${episode}`
      case "embed.su":
      default:
        return `https://embed.su/embed/tv/${mediaId}/${season}/${episode}`
    }
  } else {
    // Movie URL
    switch (provider) {
      case "vidsrc":
        return `https://vidsrc.cc/v2/embed/movie/${mediaId}`
      case "autoembed":
        return `https://player.autoembed.cc/embed/movie/${mediaId}`
      case "2embed.cc":
        return `https://www.2embed.cc/embed/${mediaId}`
      case "2embed.skin":
        return `https://www.2embed.skin/embed/${mediaId}`
      case "vidsrc.xyz":
        return `https://vidsrc.xyz/embed/movie/${mediaId}`
      case "embed.su":
      default:
        return `https://embed.su/embed/movie/${mediaId}`
    }
  }
}

// Get TV show details by TMDB ID
export async function getTVShowDetails(tmdbId: number): Promise<any> {
  return getTVShowByTMDB(tmdbId)
}
