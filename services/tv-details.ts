// TMDB TV Details Service
// Fetches all seasons and episodes for a TV series from TMDB

export interface TVSeasonEpisode {
  episode_number: number;
  name: string;
  overview: string;
  still_path: string | null;
}

export interface TVSeasonDetails {
  season_number: number;
  name: string;
  overview: string;
  poster_path: string | null;
  episodes: TVSeasonEpisode[];
}

export interface TVShowFullDetails {
  id: number;
  name: string;
  number_of_episodes: number;
  number_of_seasons: number;
  seasons: TVSeasonDetails[];
}

// Helper to get TMDB API key
function getTMDBApiKey(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("tmdbApiKey")
  }
  return null
}

async function fetchTMDB(url: string): Promise<any | null> {
  const apiKey = getTMDBApiKey()
  if (!apiKey) return null
  try {
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    })
    return await response.json()
  } catch (error) {
    console.error("TMDB API fetch error:", error)
    return null
  }
}

// Main function to get all TV show details, including all seasons and episodes
export async function getFullTVShowDetails(seriesId: string | number): Promise<TVShowFullDetails | null> {
  // 1. Get main TV show details
  const showUrl = `https://api.themoviedb.org/3/tv/${seriesId}`
  const showData = await fetchTMDB(showUrl)
  if (!showData) return null

  // 2. For each season, fetch its episodes
  const seasons: TVSeasonDetails[] = []
  if (Array.isArray(showData.seasons)) {
    for (const season of showData.seasons) {
      if (!season.season_number || season.season_number === 0) continue // skip specials/invalid
      const seasonUrl = `https://api.themoviedb.org/3/tv/${seriesId}/season/${season.season_number}`
      const seasonData = await fetchTMDB(seasonUrl)
      if (!seasonData) continue
      const episodes: TVSeasonEpisode[] = Array.isArray(seasonData.episodes)
        ? seasonData.episodes.map((ep: any) => ({
            episode_number: ep.episode_number,
            name: ep.name,
            overview: ep.overview,
            still_path: ep.still_path || null,
          }))
        : []
      if (episodes.length === 0) continue // skip empty seasons
      seasons.push({
        season_number: season.season_number,
        name: seasonData.name,
        overview: seasonData.overview,
        poster_path: seasonData.poster_path || null,
        episodes,
      })
    }
  }

  return {
    id: showData.id,
    name: showData.name,
    number_of_episodes: showData.number_of_episodes,
    number_of_seasons: showData.number_of_seasons,
    seasons,
  }
}

// Helper: get all season numbers from the structure
export function getAllSeasons(structure: TVShowFullDetails): number[] {
  if (!structure || !Array.isArray(structure.seasons)) return [];
  return structure.seasons.map((s) => s.season_number)
}

// Helper: get all episodes for a season (returns array of episode objects)
export function getEpisodesForSeason(structure: TVShowFullDetails, seasonNumber: number) {
  if (!structure || !Array.isArray(structure.seasons)) return [];
  const season = structure.seasons.find((s) => s.season_number === seasonNumber)
  return season ? season.episodes : []
}

// Helper: cache structure in localStorage
export function getCachedTVStructure(tmdbId: string): TVShowFullDetails | null {
  if (typeof window === "undefined") return null
  const cached = localStorage.getItem(`tv-episodes-${tmdbId}`)
  if (!cached) return null
  try {
    return JSON.parse(cached)
  } catch {
    return null
  }
}

// Helper: save structure to cache
export function setCachedTVStructure(tmdbId: string, structure: TVShowFullDetails) {
  if (typeof window === "undefined") return
  localStorage.setItem(`tv-episodes-${tmdbId}`, JSON.stringify(structure))
}
