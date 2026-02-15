import { getTVShowByTMDB } from "@/utils/db"
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
 * Levenshtein distance helper for fuzzy matching
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () =>
    Array.from({ length: b.length + 1 }, () => 0)
  );
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

/**
 * Revamped searchMedia with fuzzy matching and token-based scoring.
 */
export async function searchMedia(query: string): Promise<Media[]> {
  if (!query.trim()) return [];

  // Normalization: lowercase, handle & -> and, + -> plus, keep alphanum, collapse spaces
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/\+/g, ' plus ')
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const normalizedQ = normalize(query);
  if (!normalizedQ) return [];

  const qTokens = normalizedQ.split(/\s+/);

  try {
    // Search both original and normalized in parallel if they differ
    const searchQueries = [query];
    const lowerQuery = query.toLowerCase().trim();
    if (normalizedQ !== lowerQuery && normalizedQ !== lowerQuery.replace(/\+/g, '')) {
      searchQueries.push(normalizedQ);
    }

    const allResults = await Promise.all(searchQueries.map(q => searchMoviesViaTMDB(q)));

    // Flatten and deduplicate
    const tmdbResults: any[] = [];
    const seenIds = new Set<string>();

    for (const results of allResults) {
      for (const item of results) {
        const id = item.id.toString();
        if (!seenIds.has(id)) {
          tmdbResults.push(item);
          seenIds.add(id);
        }
      }
    }

    if (tmdbResults.length === 0) return [];

    const scored = tmdbResults
      .map((item: any) => {
        const rawTitle =
          item.media_type === 'movie'
            ? (item.title || '')
            : (item.name || '');

        const normalizedTitle = normalize(rawTitle);
        const tTokens = normalizedTitle.split(/\s+/);

        // Calculate token match scores
        let matchedTokensCount = 0;
        let partialMatchCount = 0;
        let fuzzyMatchedTokensCount = 0;

        for (const qt of qTokens) {
          if (tTokens.includes(qt)) {
            matchedTokensCount++;
          } else {
            // Partial match (e.g. "f" matches "fplus")
            const hasPartial = tTokens.some(tt => tt.includes(qt) || qt.includes(tt));
            if (hasPartial) {
              partialMatchCount++;
            } else if (qt.length > 3) {
              // Fuzzy match for longer tokens
              const hasCloseMatch = tTokens.some(tt => {
                const dist = levenshteinDistance(qt, tt);
                return dist === 1 || (qt.length > 6 && dist <= 2);
              });
              if (hasCloseMatch) fuzzyMatchedTokensCount++;
            }
          }
        }

        const tokenMatchRatio = (matchedTokensCount + partialMatchCount + fuzzyMatchedTokensCount) / qTokens.length;
        const includesExact = normalizedTitle.includes(normalizedQ);
        const isExact = normalizedTitle === normalizedQ;

        // Be more lenient for matches
        if (tokenMatchRatio < 0.3 && !includesExact) {
          return { media: item, score: Number.NEGATIVE_INFINITY };
        }

        let score = 0;

        // 1) Heavily weight exact and starts-with matches
        if (isExact) {
          score += 2000;
        } else if (normalizedTitle.startsWith(normalizedQ)) {
          score += 1000;
        } else if (includesExact) {
          score += 500;
        }

        // 2) Token match weight
        score += matchedTokensCount * 200;
        score += partialMatchCount * 100;
        score += fuzzyMatchedTokensCount * 50;

        // 3) Penalty for extra words beyond the query: -15 per extra word
        const extraWords = Math.max(0, tTokens.length - qTokens.length);
        score -= extraWords * 15;

        // 4) Popularity bonus: cap at +50
        if (typeof item.popularity === 'number' && item.popularity > 1) {
          score += Math.min(item.popularity, 50);
        }

        // 5) Release year bonus (favor newer content slightly)
        const releaseDate = item.release_date || item.first_air_date || '';
        if (releaseDate.startsWith('202')) {
          score += 50;
        }

        return { media: item, score };
      })
      .filter((s) => s.score > Number.NEGATIVE_INFINITY)
      .sort((a, b) => b.score - a.score);

    return scored.map(({ media }) => {
      const releaseDate = media.release_date || media.first_air_date || '';
      return {
        id: media.id?.toString() || '',
        title: media.title || media.name || '',
        tmdb: media.id?.toString() || '',
        year: releaseDate ? Number(releaseDate.slice(0, 4)) : undefined,
        genre: Array.isArray(media.genre_ids) ? media.genre_ids.join(',') : '',
        type: media.media_type === 'tv' ? 'tv' : 'movie',
        poster: media.poster_path
          ? `https://image.tmdb.org/t/p/w500/${media.poster_path}`
          : undefined,
      } as Media;
    });
  } catch (error) {
    console.error('Error searching with TMDB API:', error);
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
