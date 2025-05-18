/**
 * Utility for handling local file uploads as a fallback
 */

import { storeMovies, storeTVShows } from "@/utils/db"

// Function to handle movie database file upload
export async function handleMovieDatabaseUpload(
  file: File,
  onProgress: (message: string, type: string) => void,
): Promise<number> {
  return new Promise((resolve, reject) => {
    onProgress("Reading uploaded movie database file...", "loading")

    const reader = new FileReader()

    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string
        const data = JSON.parse(content)

        if (!Array.isArray(data)) {
          throw new Error("Invalid data format: Expected an array")
        }

        onProgress(`Processing ${data.length} movies...`, "loading")

        // Store movies in IndexedDB
        await storeMovies(data)

        // Save to localStorage that we've stored the movies
        localStorage.setItem("movieDatabaseDownloaded", "true")

        onProgress(`Successfully imported ${data.length} movies!`, "success")
        resolve(data.length)
      } catch (error) {
        onProgress(`Error processing file: ${error instanceof Error ? error.message : "Unknown error"}`, "error")
        reject(error)
      }
    }

    reader.onerror = () => {
      onProgress("Error reading file", "error")
      reject(new Error("FileReader error"))
    }

    reader.readAsText(file)
  })
}

// Function to handle TV database file upload
export async function handleTVDatabaseUpload(
  file: File,
  onProgress: (message: string, type: string) => void,
): Promise<number> {
  return new Promise((resolve, reject) => {
    onProgress("Reading uploaded TV database file...", "loading")

    const reader = new FileReader()

    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string
        const data = JSON.parse(content)

        if (!Array.isArray(data)) {
          throw new Error("Invalid data format: Expected an array")
        }

        onProgress(`Processing ${data.length} TV shows...`, "loading")

        // Store TV shows in IndexedDB
        await storeTVShows(data)

        // Save to localStorage that we've stored the TV shows
        localStorage.setItem("tvDatabaseDownloaded", "true")

        onProgress(`Successfully imported ${data.length} TV shows!`, "success")
        resolve(data.length)
      } catch (error) {
        onProgress(`Error processing file: ${error instanceof Error ? error.message : "Unknown error"}`, "error")
        reject(error)
      }
    }

    reader.onerror = () => {
      onProgress("Error reading file", "error")
      reject(new Error("FileReader error"))
    }

    reader.readAsText(file)
  })
}

// Function to validate a database file before upload
export function validateDatabaseFile(file: File): Promise<{ valid: boolean; message: string }> {
  return new Promise((resolve) => {
    // Check file type
    if (!file.name.endsWith(".json")) {
      resolve({ valid: false, message: "File must be a JSON file" })
      return
    }

    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      resolve({ valid: false, message: "File is too large (max 50MB)" })
      return
    }

    // Read the first few bytes to validate JSON structure
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        const sample = content.slice(0, 1000) // Just check the beginning

        // Check if it starts with an array
        if (!sample.trim().startsWith("[")) {
          resolve({ valid: false, message: "Invalid JSON format: Expected an array" })
          return
        }

        // Try to parse a small sample
        JSON.parse(sample + "...]") // Add closing to make it valid JSON

        resolve({ valid: true, message: "File appears to be valid" })
      } catch (error) {
        resolve({ valid: false, message: "Invalid JSON format" })
      }
    }

    reader.onerror = () => {
      resolve({ valid: false, message: "Error reading file" })
    }

    // Read just the beginning of the file
    const blob = file.slice(0, 1000)
    reader.readAsText(blob)
  })
}
