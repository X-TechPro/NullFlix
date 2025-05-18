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

  // Get the current provider
  let provider = "embed.su"
  try {
    const savedProvider = localStorage.getItem("selectedProvider")
    if (savedProvider) {
      provider = savedProvider
    }
  } catch (error) {
    console.error("Error accessing localStorage:", error)
  }

  const maxSeason = 20 // Limit to 20 seasons for performance
  let seasonFound = false

  // Find valid seasons
  onProgress("Finding available seasons...", 0)

  // Different providers have different URL structures, so we need to handle them differently
  if (provider === "2embed.cc" || provider === "2embed.skin") {
    // For 2embed providers, we'll check each season directly
    for (let season = 1; season <= maxSeason; season++) {
      const episodeUrl = getEpisodeUrl(tmdbId, season, 1, provider)
      const isValid = await isValidUrl(episodeUrl)

      if (isValid) {
        seasonFound = true
        structure.seasons[season] = []
      }

      onProgress(`Checking season ${season}...`, (season / maxSeason) * 50)

      // If we've found at least one season and now hit an invalid one,
      // we can assume we've found all seasons
      if (season > 5 && !seasonFound) {
        break
      }
    }
  } else if (provider === "vidsrc.xyz") {
    // For vidsrc.xyz, we'll check each season directly
    for (let season = 1; season <= maxSeason; season++) {
      const episodeUrl = getEpisodeUrl(tmdbId, season, 1, provider)
      const isValid = await isValidUrl(episodeUrl)

      if (isValid) {
        seasonFound = true
        structure.seasons[season] = []
      }

      onProgress(`Checking season ${season}...`, (season / maxSeason) * 50)

      // If we've found at least one season and now hit an invalid one,
      // we can assume we've found all seasons
      if (season > 5 && !seasonFound) {
        break
      }
    }
  } else {
    // For other providers, we'll use the original approach
    let currentSeason = 1

    while (currentSeason <= maxSeason) {
      const episodeUrl = getEpisodeUrl(tmdbId, currentSeason, 1, provider)
      const isValid = await isValidUrl(episodeUrl)

      if (isValid) {
        seasonFound = true
        structure.seasons[currentSeason] = []
        currentSeason++
      } else {
        // If we've found at least one season and now hit an invalid one,
        // we can assume we've found all seasons
        if (seasonFound) {
          break
        }
        // If we haven't found any seasons yet, keep looking
        currentSeason++

        // If we've checked 5 seasons and found nothing, stop
        if (currentSeason > 5 && !seasonFound) {
          break
        }
      }

      onProgress(`Checking season ${currentSeason}...`, (currentSeason / maxSeason) * 50)
    }
  }

  // If no seasons found, create default structure
  if (!seasonFound) {
    // Default to 3 seasons with 10 episodes each
    for (let i = 1; i <= 3; i++) {
      structure.seasons[i] = Array.from({ length: 10 }, (_, j) => j + 1)
    }
    saveTVStructureToCache(structure)
    onProgress("No seasons found, using default structure", 100)
    return structure
  }

  // Find valid episodes for each season
  const seasons = Object.keys(structure.seasons).map(Number)
  const totalSeasons = seasons.length

  for (let i = 0; i < totalSeasons; i++) {
    const season = seasons[i]
    let currentEpisode = 1
    const maxEpisode = 30 // Limit to 30 episodes per season for performance
    let episodeFound = false

    onProgress(`Finding episodes for season ${season}...`, 50 + (i / totalSeasons) * 50)

    while (currentEpisode <= maxEpisode) {
      const episodeUrl = getEpisodeUrl(tmdbId, season, currentEpisode, provider)
      const isValid = await isValidUrl(episodeUrl)

      if (isValid) {
        episodeFound = true
        structure.seasons[season].push(currentEpisode)
        currentEpisode++
      } else {
        // If we've found at least one episode and now hit an invalid one,
        // we can assume we've found all episodes for this season
        if (episodeFound) {
          break
        }
        // If we haven't found any episodes yet, keep looking
        currentEpisode++

        // If we've checked 10 episodes and found nothing, stop
        if (currentEpisode > 10 && !episodeFound) {
          break
        }
      }
    }

    // If no episodes found for this season, add default episodes
    if (!episodeFound) {
      structure.seasons[season] = Array.from({ length: 10 }, (_, j) => j + 1)
    }
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
