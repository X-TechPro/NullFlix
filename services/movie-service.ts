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

export type Provider =
  | "pstream"
  | "embed.su"
  | "vidsrc.cc"
  | "autoembed"
  | "2embed"
  | "vidsrc.xyz"
  | "vidsrc.su"
  | "vidsrc.co"
  | "uembed"

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

  // Use IndexedDB search to find both movies and TV shows
  return searchMediaInDB(query)
}

export function getProviderUrl(mediaId: string, mediaType: "movie" | "tv", season?: number, episode?: number): string {
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
