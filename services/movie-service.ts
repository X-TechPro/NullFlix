import { getTVShowByTMDB } from "@/utils/db"
import { searchViaIMDB, findTMDBByIMDBId } from "@/services/tmdb-service"
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
 * Generate query variations to handle symbols that IMDB/TMDB may interpret differently
 */
function generateQueryVariations(query: string): string[] {
  const variations = new Set<string>();
  const lowerQuery = query.toLowerCase();

  // Add original query
  variations.add(query);

  // Symbol <-> word mappings
  const mappings: [RegExp, string][] = [
    [/\+/g, " plus "],
    [/ plus /gi, " + "],
    [/&/g, " and "],
    [/ and /gi, " & "],
    [/#/g, " number "],
    [/ number /gi, " # "],
    [/\$/g, " dollar "],
    [/ dollar /gi, " $ "],
    [/%/g, " percent "],
    [/ percent /gi, " % "],
    [/@/g, " at "],
    [/ at /gi, " @ "],
  ];

  mappings.forEach(([regex, replacement]) => {
    const transformed = query.replace(regex, replacement);
    if (transformed !== query) {
      variations.add(transformed);
    }
  });

  return Array.from(variations);
}

/**
 * Revamped searchMedia with hybrid scoring:
 * 1. Search IMDB API with query variations for better symbol handling
 * 2. Use TMDB's Find by External ID to get TMDB data (fully parallel)
 * 3. Rerank using Fuse.js similarity + TMDB popularity/vote data
 */
export async function searchMedia(query: string): Promise<Media[]> {
  if (!query.trim()) return [];

  try {
    // Step 1: Generate query variations for symbol handling
    const variations = generateQueryVariations(query);

    // Step 2: Search IMDB API for all variations in parallel
    const allImdbResultsGroups = await Promise.all(
      variations.map((v) => searchViaIMDB(v))
    );

    // Flatten and deduplicate by IMDB ID
    const imdbResultsMap = new Map<string, any>();
    allImdbResultsGroups.forEach((results) => {
      if (results && Array.isArray(results)) {
        results.forEach((item) => {
          if (item.id) {
            imdbResultsMap.set(item.id, item);
          }
        });
      }
    });

    const imdbResults = Array.from(imdbResultsMap.values());
    if (imdbResults.length === 0) return [];

    // Step 3: Get TMDB data for all IMDB IDs in FULLY PARALLEL (no batching)
    const tmdbPromises = imdbResults.map(async (imdbItem) => {
      const tmdbData = await findTMDBByIMDBId(imdbItem.id);
      return tmdbData;
    });

    const tmdbResultsAll = await Promise.all(tmdbPromises);

    // Filter out nulls and deduplicate by TMDB ID
    const tmdbResultsMap = new Map<string, any>();
    tmdbResultsAll.forEach((item) => {
      if (item && item.id) {
        tmdbResultsMap.set(item.id.toString(), item);
      }
    });

    const tmdbResults = Array.from(tmdbResultsMap.values());
    if (tmdbResults.length === 0) return [];

    // Step 4: Initialize Fuse.js for fuzzy matching on TMDB results
    const fuse = new Fuse(tmdbResults, {
      keys: ["title", "name", "original_title", "original_name"],
      includeScore: true,
      threshold: 0.4,
    });

    const fuseResults = fuse.search(query);
    const fuseScoreMap = new Map<string, number>();

    fuseResults.forEach((res) => {
      if (res.item.id) {
        const idStr = res.item.id.toString();
        const currentBest = fuseScoreMap.get(idStr) ?? 1;
        if ((res.score ?? 1) < currentBest) {
          fuseScoreMap.set(idStr, res.score ?? 1);
        }
      }
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
        const isExactMatch = variations.some(
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
          ? `https://image.tmdb.org/t/p/w780/${media.poster_path}`
          : undefined,
      } as Media;
    });
  } catch (error) {
    console.error("Error searching with IMDB/TMDB API:", error);
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
