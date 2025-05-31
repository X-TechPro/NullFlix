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

// Search movies and TV shows in memory
export async function searchMediaInDB(query: string): Promise<any[]> {
  const normalizedQuery = query.toLowerCase().trim()
  const wholeWordRegex = new RegExp(`\\b${normalizedQuery}\\b`, "i")
  const startsWithRegex = new RegExp(`\\b${normalizedQuery}\\w*`, "i")
  const containsRegex = new RegExp(`${normalizedQuery}`, "i")
  const exactTitleRegex = new RegExp(`^${normalizedQuery}$`, "i")

  const scoreMedia = (media: any) => {
    const title = media.title?.toLowerCase() ?? ""
    const genre = media.genre?.toLowerCase() ?? ""
    const year = media.year?.toString() ?? ""
    const id = media.id?.toLowerCase() ?? ""
    const haystack = `${title} ${genre} ${year} ${id}`
    const wordCount = title.trim().split(/\s+/).length

    let baseScore = 0
    if (exactTitleRegex.test(title)) baseScore = 120
    else if (wholeWordRegex.test(title)) baseScore = 100
    else if (startsWithRegex.test(title)) baseScore = 80
    else if (containsRegex.test(title)) baseScore = 50
    else if (wholeWordRegex.test(haystack)) baseScore = 40
    else if (containsRegex.test(haystack)) baseScore = 20

    const penalty = wordCount * 2
    const finalScore = baseScore - penalty

    return { media, score: finalScore }
  }

  const scoredMovies = movies.map(scoreMedia).filter(({ score }) => score > 0)
  const scoredTVShows = tvShows.map(scoreMedia).filter(({ score }) => score > 0)

  return [...scoredMovies, ...scoredTVShows]
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map(({ media }) => media)
}

// Get metadata from memory
export async function getMetadata(key: string): Promise<any> {
  return meta[key] ?? null
}

// Check if the database has been initialized with movies
export async function isDatabaseInitialized(): Promise<boolean> {
  return !!(meta["movieCount"] && meta["movieCount"] > 0)
}

// Check if the TV database has been initialized
export async function isTVDatabaseInitialized(): Promise<boolean> {
  return !!(meta["tvCount"] && meta["tvCount"] > 0)
}

// Clear the in-memory database
export async function clearDatabase(): Promise<void> {
  movies = []
  tvShows = []
  meta = {}
}
