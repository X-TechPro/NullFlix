// IndexedDB utility functions for movie database storage

// Database configuration
const DB_NAME = "nullflix-db"
const DB_VERSION = 2 // Increased version for schema update
const MOVIE_STORE = "movies"
const TV_STORE = "tvshows"
const META_STORE = "meta"

// Initialize the database
export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = (event) => {
      console.error("IndexedDB error:", event)
      reject("Could not open IndexedDB")
    }

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      const oldVersion = event.oldVersion

      // Create movies object store if it doesn't exist
      if (!db.objectStoreNames.contains(MOVIE_STORE)) {
        const movieStore = db.createObjectStore(MOVIE_STORE, { keyPath: "id" })
        movieStore.createIndex("imdb", "imdb", { unique: false })
        movieStore.createIndex("title", "title", { unique: false })
        movieStore.createIndex("year", "year", { unique: false })
        movieStore.createIndex("genre", "genre", { unique: false })
      }

      // Create TV shows object store if it doesn't exist (new in version 2)
      if (!db.objectStoreNames.contains(TV_STORE) && oldVersion < 2) {
        const tvStore = db.createObjectStore(TV_STORE, { keyPath: "id" })
        tvStore.createIndex("tmdb", "tmdb", { unique: false })
        tvStore.createIndex("title", "title", { unique: false })
        tvStore.createIndex("year", "year", { unique: false })
        tvStore.createIndex("genre", "genre", { unique: false })
      }

      // Create meta object store for storing metadata
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: "key" })
      }
    }
  })
}

// Store movies in batches to avoid transaction limits
export async function storeMovies(movies: any[]): Promise<void> {
  const db = await initDB()
  const BATCH_SIZE = 100 // Process 100 movies at a time

  // Store metadata
  const metaTransaction = db.transaction([META_STORE], "readwrite")
  const metaStore = metaTransaction.objectStore(META_STORE)
  metaStore.put({ key: "movieCount", value: movies.length })
  metaStore.put({ key: "lastUpdated", value: new Date().toISOString() })

  // Process movies in batches
  let validMovieCount = 0

  for (let i = 0; i < movies.length; i += BATCH_SIZE) {
    const batch = movies.slice(i, i + BATCH_SIZE)
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([MOVIE_STORE], "readwrite")

      transaction.oncomplete = () => resolve()
      transaction.onerror = (event) => {
        console.error("Transaction error:", event)
        reject(event)
      }

      const store = transaction.objectStore(MOVIE_STORE)

      batch.forEach((movie, index) => {
        // Ensure each movie has the required properties
        if (!movie) return

        // Create a valid movie object with an id field
        const validMovie = {
          id: movie.imdb || `movie-${i + index}`, // Use imdb as id or generate one
          imdb: movie.imdb || `unknown-${i + index}`,
          title: movie.title || "Unknown Title",
          tmdb: movie.tmdb || 0,
          year: movie.year || null,
          genre: movie.genre || null,
          type: "movie",
        }

        try {
          store.put(validMovie)
          validMovieCount++
        } catch (err) {
          console.error("Error storing movie:", err, movie)
        }
      })
    })
  }

  // Update the actual count of valid movies
  const finalMetaTransaction = db.transaction([META_STORE], "readwrite")
  const finalMetaStore = finalMetaTransaction.objectStore(META_STORE)
  finalMetaStore.put({ key: "movieCount", value: validMovieCount })

  db.close()
}

// Store TV shows in batches
export async function storeTVShows(tvShows: any[]): Promise<void> {
  const db = await initDB()
  const BATCH_SIZE = 100 // Process 100 TV shows at a time

  // Store metadata
  const metaTransaction = db.transaction([META_STORE], "readwrite")
  const metaStore = metaTransaction.objectStore(META_STORE)
  metaStore.put({ key: "tvCount", value: tvShows.length })
  metaStore.put({ key: "tvLastUpdated", value: new Date().toISOString() })

  // Process TV shows in batches
  let validTVCount = 0

  for (let i = 0; i < tvShows.length; i += BATCH_SIZE) {
    const batch = tvShows.slice(i, i + BATCH_SIZE)
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([TV_STORE], "readwrite")

      transaction.oncomplete = () => resolve()
      transaction.onerror = (event) => {
        console.error("Transaction error:", event)
        reject(event)
      }

      const store = transaction.objectStore(TV_STORE)

      batch.forEach((show, index) => {
        // Ensure each TV show has the required properties
        if (!show) return

        // Create a valid TV show object with an id field
        const validShow = {
          id: `tv-${show.tmdb || i + index}`,
          tmdb: show.tmdb || 0,
          title: show.title || "Unknown Title",
          year: show.year || null,
          genre: show.genre || null,
          seasons: show.seasons || [],
          type: "tv",
        }

        try {
          store.put(validShow)
          validTVCount++
        } catch (err) {
          console.error("Error storing TV show:", err, show)
        }
      })
    })
  }

  // Update the actual count of valid TV shows
  const finalMetaTransaction = db.transaction([META_STORE], "readwrite")
  const finalMetaStore = finalMetaTransaction.objectStore(META_STORE)
  finalMetaStore.put({ key: "tvCount", value: validTVCount })

  db.close()
}

// Get all movies from the database
export async function getAllMovies(): Promise<any[]> {
  const db = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([MOVIE_STORE], "readonly")
    const store = transaction.objectStore(MOVIE_STORE)
    const request = store.getAll()

    request.onsuccess = () => {
      resolve(request.result)
      db.close()
    }

    request.onerror = (event) => {
      reject(event)
      db.close()
    }
  })
}

// Get all TV shows from the database
export async function getAllTVShows(): Promise<any[]> {
  const db = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TV_STORE], "readonly")
    const store = transaction.objectStore(TV_STORE)
    const request = store.getAll()

    request.onsuccess = () => {
      resolve(request.result)
      db.close()
    }

    request.onerror = (event) => {
      reject(event)
      db.close()
    }
  })
}

// Get a specific TV show by TMDB ID
export async function getTVShowByTMDB(tmdbId: number): Promise<any> {
  const db = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TV_STORE], "readonly")
    const store = transaction.objectStore(TV_STORE)
    const index = store.index("tmdb")
    const request = index.get(tmdbId)

    request.onsuccess = () => {
      if (request.result) {
        resolve(request.result)
      } else {
        // If not found, create a default TV show object with the TMDB ID
        // This ensures we can still generate episode links even if we don't have the show data
        resolve({
          id: `tv-${tmdbId}`,
          tmdb: tmdbId,
          title: `TV Show (ID: ${tmdbId})`,
          type: "tv",
          seasons: Array.from({ length: 10 }, (_, i) => i + 1), // Default to 10 seasons
        })
      }
      db.close()
    }

    request.onerror = (event) => {
      reject(event)
      db.close()
    }
  })
}

// Search movies and TV shows in the database
export async function searchMediaInDB(query: string): Promise<any[]> {
  const db = await initDB()
  const movies = await getAllMovies()
  const tvShows = await getAllTVShows()
  db.close()

  const normalizedQuery = query.toLowerCase().trim()

  const wholeWordRegex = new RegExp(`\\b${normalizedQuery}\\b`, "i")
  const startsWithRegex = new RegExp(`\\b${normalizedQuery}\\w*`, "i")
  const containsRegex = new RegExp(`${normalizedQuery}`, "i")
  const exactTitleRegex = new RegExp(`^${normalizedQuery}$`, "i")

  // Function to score a media item
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

    // Penalize longer titles (less relevant context)
    const penalty = wordCount * 2
    const finalScore = baseScore - penalty

    return { media, score: finalScore }
  }

  // Score and filter movies
  const scoredMovies = movies.map(scoreMedia).filter(({ score }) => score > 0)

  // Score and filter TV shows
  const scoredTVShows = tvShows.map(scoreMedia).filter(({ score }) => score > 0)

  // Combine and sort by score
  return [...scoredMovies, ...scoredTVShows]
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map(({ media }) => media)
}

// Get metadata from the database
export async function getMetadata(key: string): Promise<any> {
  const db = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([META_STORE], "readonly")
    const store = transaction.objectStore(META_STORE)
    const request = store.get(key)

    request.onsuccess = () => {
      resolve(request.result ? request.result.value : null)
      db.close()
    }

    request.onerror = (event) => {
      reject(event)
      db.close()
    }
  })
}

// Check if the database has been initialized with movies
export async function isDatabaseInitialized(): Promise<boolean> {
  try {
    const movieCount = await getMetadata("movieCount")
    return movieCount !== null && movieCount > 0
  } catch (error) {
    console.error("Error checking database initialization:", error)
    return false
  }
}

// Check if the TV database has been initialized
export async function isTVDatabaseInitialized(): Promise<boolean> {
  try {
    const tvCount = await getMetadata("tvCount")
    return tvCount !== null && tvCount > 0
  } catch (error) {
    console.error("Error checking TV database initialization:", error)
    return false
  }
}

// Clear the database (useful for troubleshooting)
export async function clearDatabase(): Promise<void> {
  const db = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([MOVIE_STORE, TV_STORE, META_STORE], "readwrite")

    transaction.oncomplete = () => {
      db.close()
      resolve()
    }

    transaction.onerror = (event) => {
      db.close()
      reject(event)
    }

    const movieStore = transaction.objectStore(MOVIE_STORE)
    const tvStore = transaction.objectStore(TV_STORE)
    const metaStore = transaction.objectStore(META_STORE)

    movieStore.clear()
    tvStore.clear()
    metaStore.clear()
  })
}
