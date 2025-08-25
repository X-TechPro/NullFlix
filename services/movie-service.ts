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
  | "snayerm"
  | "snayer"
  | "videasy"
  | "vidrock"
  | "pstream"
  | "1anime"
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
  | "superembed"

export type ProviderServer =
  | "2embed.cc"
  | "2embed.skin"
  | "vidsrc.xyz"
  | "vidsrc.in"
  | "vidsrc.pm"
  | "vidsrc.me"
  | "vidsrc.net"

/**
 * Revamped searchMedia with:
 * 1) Penalty for extra words beyond the query: -5 per extra word.
 * 2) Popularity bonus capped at a maximum of +15.
 * 3) Runtime bonus/penalty still applied as before.
 */
export async function searchMedia(query: string): Promise<Media[]> {
  if (!query.trim()) return [];

  // Normalization helper: lowercase, replace non-alphanum with space, collapse spaces, trim
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/&/g, 'and') // Replace & with 'and'
      .replace(/[^a-z0-9]+/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const q = query.toLowerCase().trim();
  const normalizedQ = normalize(query);
  const queryWordCount = normalizedQ.split(/\s+/).length;
  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  try {
    const tmdbResults = await searchMoviesViaTMDB(query);
    if (!tmdbResults || tmdbResults.length === 0) return [];

    const scored = tmdbResults
      .map((item: any) => {
        //  — Use "title" if movie, "name" if TV
        const rawTitle =
          item.media_type === 'movie'
            ? (item.title || '')
            : (item.name || '');
        const title = rawTitle.toLowerCase().trim();
        const normalizedTitle = normalize(rawTitle);

        // Drop if normalized query isn't anywhere in normalized title
        if (!normalizedTitle.includes(normalizedQ)) {
          return { media: item, score: Number.NEGATIVE_INFINITY };
        }

        let score = 0;

        // 1) Starts-with boost (normalized)
        if (normalizedTitle.startsWith(normalizedQ)) {
          score += 100;
        }

        // 2) Whole-word boost (if not startsWith)
        const wholeWordRe = new RegExp(`\\b${escapeRegex(normalizedQ)}\\b`);
        if (wholeWordRe.test(normalizedTitle) && !normalizedTitle.startsWith(normalizedQ)) {
          score += 50;
        }

        // 3) Partial-only match penalty (e.g. "carson" when q="cars")
        if (!wholeWordRe.test(normalizedTitle)) {
          score -= 80;
        }

        // 4) Penalty for extra words beyond the query:
        //    titleWordCount – queryWordCount = extraWords; each extra = -5
        const titleWordCount = normalizedTitle.split(/\s+/).length;
        const extraWords = titleWordCount - queryWordCount;
        if (extraWords > 0) {
          score -= extraWords * 5;
        }

        // 5) Popularity bonus: +1 for every 0.5 pop > 2.0, capped at +15
        if (typeof item.popularity === 'number' && item.popularity > 2) {
          const rawBonus = Math.floor((item.popularity - 2) / 0.5);
          const bonus = Math.min(rawBonus, 15);
          score += bonus;
        }

        // 6) Runtime bonus/penalty (only for movies)
        if (item.media_type === 'movie' && typeof item.runtime === 'number') {
          const rt = item.runtime;
          if (rt > 100) {
            score += 50;
          } else if (rt > 70 && rt < 99) {
            score += 30;
          } else if (rt < 49) {
            score -= 50;
          }
          // 50 <= rt <= 69 or 99 <= rt <= 100 → no change
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
      case "pstream":
        return `https://iframe.pstream.org/embed/tmdb-tv-${mediaId}/${season}/${episode}`
      case "1anime":
        return `https://flix.1ani.me/embed/tmdb-tv-${mediaId}/${season}/${episode}`
      case "videasy":
        return `https://player.videasy.net/tv/${mediaId}/${season}/${episode}`
      case "vidrock":
        return `https://vidrock.net/tv/${mediaId}/${season}/${episode}`
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
        return `https://player.vidpro.top/embed/tv/${mediaId}/${season}/${episode}`
      case "uembed":
        return `https://uembed.site/?id=${mediaId}&season=${season}&episode=${episode}`
      case "spenembed":
        return `https://spencerdevs.xyz/tv/${mediaId}/${season}/${episode}?theme=0099ff`
      case "vidora":
        return `https://vidora.su/tv/${mediaId}/${season}/${episode}?colour=0099ff&autoplay=true&autonextepisode=true`
      case "snayer": {
        const bioapi = localStorage.getItem("bioapi") || ""
        return `https://snayer.vercel.app/api/showbox?tmdb=${mediaId}&s=${season}&e=${episode}&type=2&api=${bioapi}`
      }
      case "snayerm": {
        const snayerTitle = localStorage.getItem("snayerTitle") || ""
        return `https://snayer.vercel.app/api/madplay?tmdb=${mediaId}&s=${season}&e=${episode}&title=${snayerTitle}`
      }
      case "vidfast":
        return `https://vidfast.pro/tv/${mediaId}/${season}/${episode}?theme=0099ff`
      case "superembed":
        return `https://multiembed.mov/directstream.php?video_id=${mediaId}&tmdb=1&s=${season}&e=${episode}`
      case "embed.su":
      default:
        return `https://embed.su/embed/tv/${mediaId}/${season}/${episode}`
    }
  } else {
    // Movie URL
    switch (provider) {
      case "pstream":
        return `https://iframe.pstream.org/media/tmdb-movie-${mediaId}`
      case "1anime":
        return `https://flix.1ani.me/embed/tmdb-movie-${mediaId}`
      case "videasy":
        return `https://player.videasy.net/movie/${mediaId}`
      case "vidrock":
        return `https://vidrock.net/movie/${mediaId}`
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
        return `https://player.vidpro.top/embed/movie/${mediaId}`
      case "uembed":
        return `https://uembed.site/?id=${mediaId}`
      case "spenembed":
        return `https://spencerdevs.xyz/movie/${mediaId}?theme=0099ff`
      case "vidora":
        return `https://vidora.su/movie/${mediaId}?colour=0099ff&autoplay=true&autonextepisode=true`
      /*
      case "snayer": {
        const bioapi = localStorage.getItem("bioapi") || ""
        const snayerTitle = localStorage.getItem("snayerTitle") || ""
        return `https://snayer.vercel.app/api/movie?tmdb=${mediaId}&api=${bioapi}&title=${snayerTitle}`
      }
      */
      case "snayer": {
        const bioapi = localStorage.getItem("bioapi") || ""
        return `https://snayer.vercel.app/api/showbox?tmdb=${mediaId}&api=${bioapi}`
      }
      case "snayerm": {
        const snayerTitle = localStorage.getItem("snayerTitle") || ""
        return `https://snayer.vercel.app/api/madplay?tmdb=${mediaId}&title=${snayerTitle}`
      }
      case "vidfast":
        return `https://vidfast.pro/movie/${mediaId}?theme=0099ff`
      case "superembed":
        return `https://multiembed.mov/directstream.php?video_id=${mediaId}&tmdb=1`
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
