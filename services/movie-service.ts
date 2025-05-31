import { searchMediaInDB, getTVShowByTMDB, isDatabaseInitialized, isTVDatabaseInitialized } from "@/utils/db"
import { searchMoviesViaOMDB as omdbSearchMoviesViaOMDB } from "@/services/omdb-service"

export interface Media {
  id: string
  title: string
  imdb?: string
  tmdb: string // changed from number to string
  year?: number
  genre?: string
  type: "movie" | "tv"
  seasons?: number[]
  poster?: string // Add this field for movie posters
}

export type Provider =
  | "snayer"
  | "pstream"
  | "embed.su"
  | "vidsrc.cc"
  | "autoembed"
  | "2embed"
  | "vidsrc.xyz"
  | "vidsrc.su"
  | "vidsrc.co"
  | "uembed"
  | "spenembed"
  | "vidora"
  | "vidfast"

export type ProviderServer =
  | "2embed.cc"
  | "2embed.skin"
  | "vidsrc.xyz"
  | "vidsrc.in"
  | "vidsrc.pm"
  | "vidsrc.me"
  | "vidsrc.net"

export async function searchMedia(query: string): Promise<Media[]> {
  if (!query.trim()) return []

  // Check if OMDB API is enabled
  const isOMDBEnabled = localStorage.getItem("omdbEnabled") === "true"
  const apiKey = localStorage.getItem("omdbApiKey")

  // If OMDB API is enabled and we have an API key, try to use it first
  if (isOMDBEnabled && apiKey) {
    try {
      console.log("Searching with OMDB API...")
      const omdbResults = await omdbSearchMoviesViaOMDB(query)

      if (omdbResults.length > 0) {
        // Convert OMDB results to our Media format
        const formattedResults: Media[] = omdbResults.map((result) => ({
          id: result.imdbID,
          title: result.Title,
          imdb: result.imdbID,
          tmdb: result.imdbID, // Use imdbID as tmdb for OMDB results
          year: Number.parseInt(result.Year) || undefined,
          type: result.Type === "series" ? "tv" : "movie",
          poster: result.Poster !== "N/A" ? result.Poster : undefined,
        }))

        return formattedResults
      }
    } catch (error) {
      console.error("Error searching with OMDB API:", error)
      // Fall back to local database search if available
    }
  }

  // Try to use IndexedDB search as fallback
  try {
    // Check if database is initialized before searching
    const moviesInitialized = await isDatabaseInitialized()
    const tvInitialized = await isTVDatabaseInitialized()

    if (moviesInitialized || tvInitialized) {
      return searchMediaInDB(query)
    } else {
      // No local database and OMDB failed or returned no results
      return []
    }
  } catch (error) {
    console.error("Error searching local database:", error)
    return []
  }
}

export function getProviderUrl(mediaId: string, mediaType: "movie" | "tv", season?: number, episode?: number, title?: string): string {
  // Use a try-catch block to handle potential localStorage errors
  let provider: Provider = "pstream"
  let server: ProviderServer | null = null

  try {
    const savedProvider = localStorage.getItem("selectedProvider")
    if (savedProvider) {
      provider = savedProvider as Provider
    }

    const savedServer = localStorage.getItem("selectedServer")
    if (savedServer) {
      server = savedServer as ProviderServer
    }
  } catch (error) {
    console.error("Error accessing localStorage:", error)
  }

  if (mediaType === "tv" && season !== undefined && episode !== undefined) {
    // TV show URL with season and episode
    switch (provider) {
      case "pstream":
        return `https://iframe.pstream.org/embed/tmdb-tv-${mediaId}/${season}/${episode}`
      case "vidsrc.cc":
        return `https://vidsrc.cc/v2/embed/tv/${mediaId}/${season}/${episode}`
      case "autoembed":
        return `https://player.autoembed.cc/embed/tv/${mediaId}/${season}/${episode}`
      case "2embed":
        if (server === "2embed.skin") {
          return `https://www.2embed.skin/embedtv/${mediaId}&s=${season}&e=${episode}`
        } else {
          return `https://www.2embed.cc/embedtv/${mediaId}&s=${season}&e=${episode}`
        }
      case "vidsrc.xyz":
        const vidsrcDomain = server || "vidsrc.xyz"
        return `https://${vidsrcDomain}/embed/tv?imdb=${mediaId}&season=${season}&episode=${episode}`
      case "vidsrc.su":
        return `https://vidsrc.su/embed/tv/${mediaId}/${season}/${episode}`
      case "vidsrc.co":
        return `https://player.vidsrc.co/embed/tv/${mediaId}/${season}/${episode}`
      case "uembed":
        return `https://uembed.site/?id=${mediaId}&season=${season}&episode=${episode}`
      case "spenembed":
        return `https://spencerdevs.xyz/tv/${mediaId}/${season}/${episode}?theme=0099ff`
      case "vidora":
        return `https://vidora.su/tv/${mediaId}/${season}/${episode}?colour=0099ff&autoplay=true&autonextepisode=true`
      case "snayer": {
        const bioapi = localStorage.getItem("bioapi") || ""
        const snayerTitle = localStorage.getItem("snayerTitle") || ""
        return `https://snayer.vercel.app/api/tv?imdb=${mediaId}&s=${season}&e=${episode}&api=${bioapi}&title=${snayerTitle}`
      }
      case "vidfast":
        return `https://vidfast.pro/tv/${mediaId}/${season}/${episode}?theme=0099ff`
      case "embed.su":
      default:
        return `https://embed.su/embed/tv/${mediaId}/${season}/${episode}`
    }
  } else {
    // Movie URL
    switch (provider) {
      case "pstream":
        return `https://iframe.pstream.org/media/tmdb-movie-${mediaId}`
      case "vidsrc.cc":
        return `https://vidsrc.cc/v2/embed/movie/${mediaId}`
      case "autoembed":
        return `https://player.autoembed.cc/embed/movie/${mediaId}`
      case "2embed":
        if (server === "2embed.skin") {
          return `https://www.2embed.skin/embed/${mediaId}`
        } else {
          return `https://www.2embed.cc/embed/${mediaId}`
        }
      case "vidsrc.xyz":
        const vidsrcDomain = server || "vidsrc.xyz"
        return `https://${vidsrcDomain}/embed/movie?imdb=${mediaId}`
      case "vidsrc.su":
        return `https://vidsrc.su/embed/movie/${mediaId}`
      case "vidsrc.co":
        return `https://player.vidsrc.co/embed/movie/${mediaId}`
      case "uembed":
        return `https://uembed.site/?id=${mediaId}`
      case "spenembed":
        return `https://spencerdevs.xyz/movie/${mediaId}?theme=0099ff`
      case "vidora":
        return `https://vidora.su/movie/${mediaId}?colour=0099ff&autoplay=true&autonextepisode=true`
      case "snayer": {
        const bioapi = localStorage.getItem("bioapi") || ""
        const snayerTitle = localStorage.getItem("snayerTitle") || ""
        return `https://snayer.vercel.app/api/movie?imdb=${mediaId}&api=${bioapi}&title=${snayerTitle}`
      }
      case "vidfast":
        return `https://vidfast.pro/movie/${mediaId}?theme=0099ff`
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
