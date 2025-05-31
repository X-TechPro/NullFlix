import { searchMediaInDB, getTVShowByTMDB, isDatabaseInitialized, isTVDatabaseInitialized } from "@/utils/db"
import { searchMoviesViaTMDB } from "@/services/tmdb-service"

export interface Media {
  id: string
  title: string
  tmdb: string // TMDB id as string
  year?: number
  genre?: string
  type: "movie" | "tv"
  seasons?: number[]
  poster?: string
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

  // Use TMDB API for search
  try {
    const tmdbResults = await searchMoviesViaTMDB(query)
    if (tmdbResults.length > 0) {
      // Grading system: exact match > prefix match > contains > others
      const normalizedQuery = query.toLowerCase().trim()
      const scoreMedia = (item: any) => {
        const title = (item.title || item.name || "").toLowerCase()
        if (!title) return 0
        if (title === normalizedQuery) return 120
        if (title.startsWith(normalizedQuery)) return 100
        if (title.includes(normalizedQuery)) return 80
        return 40
      }
      // Score and sort, then map to Media[]
      const scored = tmdbResults
        .map((result: any) => ({
          score: scoreMedia(result),
          id: result.id?.toString() || "",
          title: result.title || result.name || "",
          tmdb: result.id?.toString() || "",
          year: result.release_date ? Number(result.release_date.slice(0, 4)) : undefined,
          genre: Array.isArray(result.genre_ids) ? result.genre_ids.join(",") : "",
          type: result.media_type === "tv" ? "tv" as const : "movie" as const,
          poster: result.poster_path ? `https://image.tmdb.org/t/p/w500/${result.poster_path}` : undefined,
        }))
        .filter((media) => media.score > 0)
        .sort((a, b) => b.score - a.score)
      return scored.map(({score, ...media}) => media)
    }
  } catch (error) {
    console.error("Error searching with TMDB API:", error)
  }

  // Try to use IndexedDB search as fallback
  try {
    const moviesInitialized = await isDatabaseInitialized()
    const tvInitialized = await isTVDatabaseInitialized()
    if (moviesInitialized || tvInitialized) {
      return searchMediaInDB(query)
    } else {
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
        return `https://${vidsrcDomain}/embed/tv?tmdb=${mediaId}&season=${season}&episode=${episode}`
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
        return `https://snayer.vercel.app/api/tv?tmdb=${mediaId}&s=${season}&e=${episode}&api=${bioapi}&title=${snayerTitle}`
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
        return `https://${vidsrcDomain}/embed/movie?tmdb=${mediaId}`
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
        return `https://snayer.vercel.app/api/movie?tmdb=${mediaId}&api=${bioapi}&title=${snayerTitle}`
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
