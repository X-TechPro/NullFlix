import { storeMovies, storeTVShows, getMetadata } from "@/utils/db"

// Base URL for all data
const BASE_URL = "https://embed.su/list"

// Logger utility
const logger = {
  logs: [],
  maxLogs: 50,

  log(level: string, message: string, details: any = {}) {
    const logEntry = {
      level,
      timestamp: new Date().toISOString(),
      message,
      ...details,
    }

    console[level](logEntry)
    this.logs.push(logEntry)

    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }
  },

  info(message: string, details?: any) {
    this.log("info", message, details)
  },

  error(message: string, error: Error, details: any = {}) {
    this.log("error", message, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      ...details,
    })
  },
}

/**
 * Fetches data from the API and stores it in IndexedDB
 * @param type The type of data to fetch ('movie' or 'tv')
 * @param onProgress Optional callback for progress updates
 * @param onComplete Optional callback for completion status
 */
export async function fetchAndStoreData(
  type: "movie" | "tv",
  onProgress: (message: string, type: string) => void,
  onComplete: (success: boolean, count?: number) => void,
): Promise<void> {
  const operationId = Date.now().toString()
  logger.info(`Starting ${type} fetch operation`, { operationId })

  try {
    onProgress(`Fetching ${type} data from server...`, "loading")

    // Use the server API to fetch data
    const response = await fetch(`/api/download-data?type=${type}`)
    const result = await response.json()

    if (!result.success || !Array.isArray(result.data)) {
      throw new Error(result.error || `Failed to fetch ${type} data from server`)
    }

    const data = result.data
    onProgress(`Processing ${data.length} ${type === "movie" ? "movies" : "TV shows"}...`, "loading")

    // Store the data in IndexedDB
    if (type === "movie") {
      await storeMovies(data)
      localStorage.setItem("movieDatabaseDownloaded", "true")
    } else {
      await storeTVShows(data)
      localStorage.setItem("tvDatabaseDownloaded", "true")
    }

    // Get the actual count of stored items
    const count = await getMetadata(type === "movie" ? "movieCount" : "tvCount")

    onProgress(`Successfully stored ${count} ${type === "movie" ? "movies" : "TV shows"}!`, "success")
    onComplete(true, count)

    // Create a downloadable version
    await createDownloadableData(type)
  } catch (err) {
    const error = err as Error
    logger.error(`${type} operation failed`, error, {
      operationId,
      message: error.message,
      stack: error.stack,
    })

    onProgress(`Error: ${error.message}. Please try again later.`, "error")
    onComplete(false)
  }
}

// Specific functions for movies and TV shows
export function fetchAndStoreMovies(
  onProgress: (message: string, type: string) => void,
  onComplete: (success: boolean, count?: number) => void,
): Promise<void> {
  return fetchAndStoreData("movie", onProgress, onComplete)
}

export function fetchAndStoreTVShows(
  onProgress: (message: string, type: string) => void,
  onComplete: (success: boolean, count?: number) => void,
): Promise<void> {
  return fetchAndStoreData("tv", onProgress, onComplete)
}

/**
 * Creates a downloadable file for the specified data type
 */
export async function createDownloadableData(type: "movie" | "tv"): Promise<void> {
  try {
    const fileName = `${type}-database.json`

    // Use the server API to get the data
    const response = await fetch(`/api/download-data?type=${type}`)
    const result = await response.json()

    if (!result.success || !Array.isArray(result.data)) {
      throw new Error(result.error || `Failed to fetch ${type} data from server`)
    }

    // Create a blob and download link
    const blob = new Blob([JSON.stringify(result.data)], { type: "application/json" })
    const blobUrl = URL.createObjectURL(blob)

    // Create a temporary link and trigger download
    const link = document.createElement("a")
    link.href = blobUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()

    // Clean up
    document.body.removeChild(link)
    URL.revokeObjectURL(blobUrl)
  } catch (error) {
    console.error(`Error creating downloadable ${type} data:`, error)
    throw error
  }
}
