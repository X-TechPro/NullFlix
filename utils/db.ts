// All IndexedDB/database logic removed for browserless/in-memory operation

// In-memory stores as placeholders
let movies: any[] = []
let tvShows: any[] = []
let meta: Record<string, any> = {}

// No-op for DB initialization
export function initDB(): Promise<void> {
  return Promise.resolve()
}

// Store movies in memory
export async function storeMovies(newMovies: any[]): Promise<void> {
  movies = newMovies.map((movie, i) => ({
    id: movie.tmdb || `movie-${i}`,
    title: movie.title || "Unknown Title",
    tmdb: movie.tmdb || 0,
    year: movie.year || null,
    genre: movie.genre || null,
    type: "movie",
  }))
  meta["movieCount"] = movies.length
  meta["lastUpdated"] = new Date().toISOString()
}

// Store TV shows in memory
export async function storeTVShows(newTVShows: any[]): Promise<void> {
  tvShows = newTVShows.map((show, i) => ({
    id: `tv-${show.tmdb || i}`,
    tmdb: show.tmdb || 0,
    title: show.title || "Unknown Title",
    year: show.year || null,
    genre: show.genre || null,
    seasons: show.seasons || [],
    type: "tv",
  }))
  meta["tvCount"] = tvShows.length
  meta["tvLastUpdated"] = new Date().toISOString()
}

// Get all movies from memory
export async function getAllMovies(): Promise<any[]> {
  return movies
}

// Get all TV shows from memory
export async function getAllTVShows(): Promise<any[]> {
  return tvShows
}

// Get a specific TV show by TMDB ID from memory
export async function getTVShowByTMDB(tmdbId: number): Promise<any> {
  const found = tvShows.find(show => show.tmdb === tmdbId)
  if (found) return found
  // Return default if not found
  return {
    id: `tv-${tmdbId}`,
    tmdb: tmdbId,
    title: `TV Show (ID: ${tmdbId})`,
    type: "tv",
    seasons: Array.from({ length: 10 }, (_, i) => i + 1),
  }
}

// Get metadata from memory
export async function getMetadata(key: string): Promise<any> {
  return meta[key] ?? null
}

// Clear the in-memory database
export async function clearDatabase(): Promise<void> {
  movies = []
  tvShows = []
  meta = {}
}
