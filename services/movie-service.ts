import { getTVShowByTMDB } from "@/utils/db"
import { searchMoviesViaTMDB } from "@/services/tmdb-service"
import Fuse from "fuse.js"

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
  | "videasy"
  | "vidfast"
  | "vidrock"
  | "vidking"
  | "pstream"
  | "uembed"
  | "vidplus"
  | "2embed"
  | "vidsrc-embed.ru"

export type ProviderServer =
  | "2embed.cc"
  | "2embed.skin"
  | "vidsrc-embed.ru"
  | "vidsrc-embed.su"
  | "vidsrcme.su"
  | "vsrc.su"

/**
 * Revamped searchMedia with hybrid scoring:
 * Blends Fuse.js similarity, TMDB popularity, and vote count.
 */
export async function searchMedia(query: string): Promise<Media[]> {
  if (!query.trim()) return [];

  try {
    // Generate query variations to handle TMDB's sensitivity to symbols
    const variations = new Set<string>();
    const lowerQuery = query.toLowerCase();
    variations.add(query);

    if (query.includes("+")) {
      variations.add(query.replace(/\+/g, " plus "));
    }
    if (lowerQuery.includes("plus")) {
      variations.add(query.replace(/plus/gi, " + "));
    }
    if (query.includes("&")) {
      variations.add(query.replace(/&/g, " and "));
    }
    if (lowerQuery.includes("and")) {
      variations.add(query.replace(/and/gi, " & "));
    }

    // 3rd variation: Just words, no punctuation/symbols (e.g. "WALL·E" -> "WALL E")
    const wordsOnly = query.replace(/[^a-zA-Z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
    if (wordsOnly && wordsOnly !== query) {
      variations.add(wordsOnly);
    }

    // 4th strategy: "Anchor search" - combat TMDB brittleness.
    // TMDB fails "five night at freddy's" (0 results), but "freddy" finds it.
    // We search for the 2 longest unique words (min 4 chars) as fallbacks.
    const tokens = wordsOnly.split(" ").filter(t => t.length >= 4);
    if (tokens.length > 0) {
      const anchors = Array.from(new Set(tokens))
        .sort((a, b) => b.length - a.length)
        .slice(0, 2);
      anchors.forEach(a => variations.add(a));
    }

    // Limit to 5 parallel variations max to keep it fast
    const variationsArray = Array.from(variations).slice(0, 5);

    // Run searches in parallel for all variations
    const allResultsGroups = await Promise.all(
      variationsArray.map((q) => searchMoviesViaTMDB(q))
    );

    // Flatten and deduplicate by TMDB ID
    const tmdbResultsMap = new Map<string, any>();
    allResultsGroups.forEach((results) => {
      if (results && Array.isArray(results)) {
        results.forEach((item) => {
          if (item.id) {
            tmdbResultsMap.set(item.id.toString(), item);
          }
        });
      }
    });

    const tmdbResults = Array.from(tmdbResultsMap.values());
    if (tmdbResults.length === 0) return [];

    // Initialize Fuse.js for fuzzy matching on results returned by TMDB
    const fuse = new Fuse(tmdbResults, {
      keys: ["title", "name"],
      includeScore: true,
      threshold: 0.4,
    });

    const fuseResults = fuse.search(query);
    const fuseScoreMap = new Map<string, number>();

    // For each variation, perform a Fuse search and keep the best score for each item
    variationsArray.forEach((v) => {
      const results = fuse.search(v);
      results.forEach((res) => {
        if (res.item.id) {
          const idStr = res.item.id.toString();
          const currentBest = fuseScoreMap.get(idStr) ?? 1;
          if ((res.score ?? 1) < currentBest) {
            fuseScoreMap.set(idStr, res.score ?? 1);
          }
        }
      });
    });

    const scored = tmdbResults
      .map((item: any) => {
        // fuseScore from Fuse.js (converted to similarity: 1 - fuseScore)
        const fScore = fuseScoreMap.get(item.id.toString()) ?? 1;
        const fuseSimilarity = 1 - fScore;

        // popularity from TMDB (higher is better) normalized (cap at 100)
        const popularityNorm = Math.min((item.popularity || 0) / 100, 1);

        // vote_count (more votes = more recognized) normalized (cap at 1000)
        const voteCountNorm = Math.min((item.vote_count || 0) / 1000, 1);

        // Simple formula: (fuseSimilarity * 0.5) + (popularityNorm * 0.3) + (voteCountNorm * 0.2)
        let finalScore =
          fuseSimilarity * 0.5 + popularityNorm * 0.3 + voteCountNorm * 0.2;

        // exact_match bonus if title equals query or any variation (case-insensitive)
        const rawTitle = (item.title || item.name || "").toLowerCase().trim();
        const isExactMatch = variationsArray.some(
          (v) => v.toLowerCase().trim() === rawTitle
        );

        if (isExactMatch) {
          finalScore += 0.2; // Bonus for exact match
        }

        return { media: item, score: finalScore };
      })
      .sort((a, b) => b.score - a.score);

    return scored.map(({ media }) => {
      const releaseDate = media.release_date || media.first_air_date || "";
      return {
        id: media.id?.toString() || "",
        title: media.title || media.name || "",
        tmdb: media.id?.toString() || "",
        year: releaseDate ? Number(releaseDate.slice(0, 4)) : undefined,
        genre: Array.isArray(media.genre_ids) ? media.genre_ids.join(",") : "",
        type: media.media_type === "tv" ? "tv" : "movie",
        poster: media.poster_path
          ? `https://image.tmdb.org/t/p/w500/${media.poster_path}`
          : undefined,
      } as Media;
    });
  } catch (error) {
    console.error("Error searching with TMDB API:", error);
    return [];
  }
}

export function getProviderUrl(mediaId: string, mediaType: "movie" | "tv", season?: number, episode?: number, title?: string): string {
  // Use a try-catch block to handle potential localStorage errors
  let provider: Provider = "snayer"
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
      case "snayer": {
        const bioapi = localStorage.getItem("bioapi") || ""
        return `https://snayer.vercel.app/api/showbox?tmdb=${mediaId}&s=${season}&e=${episode}&type=2&api=${bioapi}`
      }
      case "videasy":
        return `https://player.videasy.net/tv/${mediaId}/${season}/${episode}`
      case "vidfast":
        return `https://vidfast.pro/tv/${mediaId}/${season}/${episode}?theme=0099ff`
      case "vidrock":
        return `https://vidrock.net/tv/${mediaId}/${season}/${episode}`
      case "vidking":
        return `https://vidking.net/embed/tv/${mediaId}/${season}/${episode}?color=008cff`
      case "pstream":
        return `https://iframe.pstream.mov/embed/tmdb-tv-${mediaId}/${season}/${episode}`
      case "uembed":
        return `https://uembed.xyz/?id=${mediaId}&season=${season}&episode=${episode}`
      case "vidplus":
        return `https://player.vidplus.to/embed/tv/${mediaId}/${season}/${episode}`
      case "2embed":
        if (server === "2embed.skin") {
          return `https://www.2embed.skin/embedtv/${mediaId}&s=${season}&e=${episode}`
        } else {
          return `https://www.2embed.cc/embedtv/${mediaId}&s=${season}&e=${episode}`
        }
      case "vidsrc-embed.ru":
        const vidsrcDomain = server || "vidsrc-embed.ru"
        return `https://${vidsrcDomain}/embed/tv/${mediaId}/${season}/${episode}`
      default:
        return `https://snayer.vercel.app/api/showbox?tmdb=${mediaId}&s=${season}&e=${episode}&type=2`
    }
  } else {
    // Movie URL
    switch (provider) {
      case "snayer": {
        const bioapi = localStorage.getItem("bioapi") || ""
        return `https://snayer.vercel.app/api/showbox?tmdb=${mediaId}&api=${bioapi}`
      }
      case "videasy":
        return `https://player.videasy.net/movie/${mediaId}`
      case "vidfast":
        return `https://vidfast.pro/movie/${mediaId}?theme=0099ff`
      case "vidrock":
        return `https://vidrock.net/movie/${mediaId}`
      case "vidking":
        return `https://vidking.net/embed/movie/${mediaId}?color=008cff`
      case "pstream":
        return `https://iframe.pstream.mov/media/tmdb-movie-${mediaId}`
      case "uembed":
        return `https://uembed.xyz/?id=${mediaId}`
      case "vidplus":
        return `https://player.vidplus.to/embed/movie/${mediaId}`
      case "2embed":
        if (server === "2embed.skin") {
          return `https://www.2embed.skin/embed/${mediaId}`
        } else {
          return `https://www.2embed.cc/embed/${mediaId}`
        }
      case "vidsrc-embed.ru":
        const vidsrcDomain = server || "vidsrc-embed.ru"
        return `https://${vidsrcDomain}/embed/movie/${mediaId}`
      default:
        return `https://snayer.vercel.app/api/showbox?tmdb=${mediaId}`
    }
  }
}

// Get TV show details by TMDB ID
export async function getTVShowDetails(tmdbId: number): Promise<any> {
  return getTVShowByTMDB(tmdbId)
}
