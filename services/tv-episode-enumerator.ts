// TV Episode Enumerator Service
// This service tests URLs to find valid seasons and episodes for TV shows

// Cache key format: tv-episodes-{tmdbId}
const TV_CACHE_PREFIX = "tv-episodes-"

interface TVShowStructure {
  tmdbId: number
  seasons: {
    [seasonNumber: number]: number[] // Array of valid episode numbers
  }
  lastUpdated: string
}

// Check if a URL is valid (returns 200 OK)
async function isValidUrl(url: string): Promise<boolean> {
  try {
    // Use a HEAD request to minimize data transfer
    const response = await fetch(url, { method: "HEAD" })
    return response.ok
  } catch (error) {
    return false
  }
}

// Get the base URL for a TV show
function getTVShowBaseUrl(tmdbId: number, provider = "embed.su"): string {
  // Get the provider from localStorage
  try {
    const savedProvider = localStorage.getItem("selectedProvider")
    if (savedProvider) {
      provider = savedProvider
    }
  } catch (error) {
    console.error("Error accessing localStorage:", error)
  }

  switch (provider) {
    case "vidsrc":
      return `https://vidsrc.cc/v2/embed/tv/${tmdbId}`
    case "autoembed":
      return `https://player.autoembed.cc/embed/tv/${tmdbId}`
    case "2embed.cc":
      return `https://www.2embed.cc/embedtv/${tmdbId}`
    case "2embed.skin":
      return `https://www.2embed.skin/embedtv/${tmdbId}`
    case "vidsrc.xyz":
      return `https://vidsrc.xyz/embed/tv?imdb=${tmdbId}`
    case "snayer": {
      const bioapi = localStorage.getItem("bioapi") || ""
      return `https://snayer.vercel.app/api/stream?imdb=${tmdbId}&api=${bioapi}`
    }
    case "embed.su":
    default:
      return `https://embed.su/embed/tv/${tmdbId}`
  }
}

// Get URL for a specific episode
function getEpisodeUrl(tmdbId: number, season: number, episode: number, provider = "embed.su"): string {
  // Get the provider from localStorage
  try {
    const savedProvider = localStorage.getItem("selectedProvider")
    if (savedProvider) {
      provider = savedProvider
    }
  } catch (error) {
    console.error("Error accessing localStorage:", error)
  }

  switch (provider) {
    case "vidsrc":
      return `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${season}/${episode}`
    case "autoembed":
      return `https://player.autoembed.cc/embed/tv/${tmdbId}/${season}/${episode}`
    case "2embed.cc":
      return `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`
    case "2embed.skin":
      return `https://www.2embed.skin/embedtv/${tmdbId}&s=${season}&e=${episode}`
    case "vidsrc.xyz":
      return `https://vidsrc.xyz/embed/tv?imdb=${tmdbId}&season=${season}&episode=${episode}`
    case "snayer": {
      const bioapi = localStorage.getItem("bioapi") || ""
      return `https://snayer.vercel.app/api/stream?imdb=${tmdbId}&season=${season}&episode=${episode}&api=${bioapi}`
    }
    case "embed.su":
    default:
      return `https://embed.su/embed/tv/${tmdbId}/${season}/${episode}`
  }
}

// Get cached TV show structure
export function getCachedTVStructure(tmdbId: number): TVShowStructure | null {
  try {
    const cached = localStorage.getItem(`${TV_CACHE_PREFIX}${tmdbId}`)
    if (cached) {
      return JSON.parse(cached)
    }
  } catch (error) {
    console.error("Error reading TV structure from cache:", error)
  }
  return null
}

// Save TV show structure to cache
function saveTVStructureToCache(structure: TVShowStructure): void {
  try {
    localStorage.setItem(`${TV_CACHE_PREFIX}${structure.tmdbId}`, JSON.stringify(structure))
  } catch (error) {
    console.error("Error saving TV structure to cache:", error)
  }
}

// Helper to find valid seasons
async function findValidSeasons(
  tmdbId: number,
  provider: string,
  maxSeason: number,
  onProgress: (message: string, progress: number) => void
): Promise<number[]> {
  const validSeasons: number[] = []
  let firstFound = false
  for (let season = 1; season <= maxSeason; season++) {
    const episodeUrl = getEpisodeUrl(tmdbId, season, 1, provider)
    const isValid = await isValidUrl(episodeUrl)
    if (isValid) {
      validSeasons.push(season)
      firstFound = true
    }
    onProgress(`Checking season ${season}...`, (season / maxSeason) * 50)
    // Stop early if no valid seasons found after 5 tries
    if (season >= 5 && !firstFound) break
    // Stop if found at least one and now hit an invalid one (after first block)
    if (firstFound && !isValid) break
  }
  return validSeasons
}

// Helper to find valid episodes for a season
async function findValidEpisodes(
  tmdbId: number,
  season: number,
  provider: string,
  maxEpisode: number
): Promise<number[]> {
  const validEpisodes: number[] = []
  let firstFound = false
  for (let episode = 1; episode <= maxEpisode; episode++) {
    const episodeUrl = getEpisodeUrl(tmdbId, season, episode, provider)
    const isValid = await isValidUrl(episodeUrl)
    if (isValid) {
      validEpisodes.push(episode)
      firstFound = true
    }
    // Stop early if no valid episodes found after 10 tries
    if (episode >= 10 && !firstFound) break
    // Stop if found at least one and now hit an invalid one (after first block)
    if (firstFound && !isValid) break
  }
  return validEpisodes.length ? validEpisodes : Array.from({ length: 10 }, (_, j) => j + 1)
}

// Enumerate episodes for a TV show
export async function enumerateTVShow(
  tmdbId: number,
  onProgress: (message: string, progress: number) => void,
): Promise<TVShowStructure> {
  // Check cache first
  const cached = getCachedTVStructure(tmdbId)
  if (cached) {
    // If cache is less than 7 days old, use it
    const lastUpdated = new Date(cached.lastUpdated)
    const now = new Date()
    const daysDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24)

    if (daysDiff < 7) {
      onProgress("Using cached episode data", 100)
      return cached
    }
  }

  // Initialize structure
  const structure: TVShowStructure = {
    tmdbId,
    seasons: {},
    lastUpdated: new Date().toISOString(),
  }

  const maxSeason = 20
  const maxEpisode = 30

  // Get the current provider
  let provider = "embed.su"
  try {
    const savedProvider = localStorage.getItem("selectedProvider")
    if (savedProvider) provider = savedProvider
  } catch (error) {
    console.error("Error accessing localStorage:", error)
  }

  onProgress("Finding available seasons...", 0)

  // Find valid seasons
  let validSeasons: number[] = []
  if (
    provider === "2embed.cc" ||
    provider === "2embed.skin" ||
    provider === "vidsrc.xyz"
  ) {
    validSeasons = await findValidSeasons(tmdbId, provider, maxSeason, onProgress)
  } else {
    validSeasons = await findValidSeasons(tmdbId, provider, maxSeason, onProgress)
  }

  // If no seasons found, create default structure
  if (!validSeasons.length) {
    for (let i = 1; i <= 3; i++) {
      structure.seasons[i] = Array.from({ length: 10 }, (_, j) => j + 1)
    }
    saveTVStructureToCache(structure)
    onProgress("No seasons found, using default structure", 100)
    return structure
  }

  // Find valid episodes for each season
  const totalSeasons = validSeasons.length
  for (let i = 0; i < totalSeasons; i++) {
    const season = validSeasons[i]
    onProgress(`Finding episodes for season ${season}...`, 50 + (i / totalSeasons) * 50)
    structure.seasons[season] = await findValidEpisodes(tmdbId, season, provider, maxEpisode)
  }

  // Save to cache
  saveTVStructureToCache(structure)
  onProgress("Episode enumeration complete", 100)

  return structure
}

// Get all seasons for a TV show
export function getAllSeasons(structure: TVShowStructure): number[] {
  return Object.keys(structure.seasons)
    .map(Number)
    .sort((a, b) => a - b)
}

// Get all episodes for a season
export function getEpisodesForSeason(structure: TVShowStructure, season: number): number[] {
  return structure.seasons[season] || []
}
