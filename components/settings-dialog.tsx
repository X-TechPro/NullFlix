"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Check,
  AlertCircle,
  Loader2,
  Trash2,
  Film,
  Bomb,
  Database,
  Server,
  Upload,
  Download,
  Save,
  Info,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import {
  storeMovies,
  storeTVShows,
  getMetadata,
  isDatabaseInitialized,
  isTVDatabaseInitialized,
  clearDatabase,
} from "@/utils/db"
import { fetchAndStoreMovies, fetchAndStoreTVShows, createDownloadableData } from "@/services/data-service"
import { handleMovieDatabaseUpload, handleTVDatabaseUpload } from "@/utils/file-upload-handler"
import type { Provider, ProviderServer } from "@/services/movie-service"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"

interface ProgressIndicatorProps {
  type: string
  message: string
  progress?: number
}

function ProgressIndicator({ type, message, progress }: ProgressIndicatorProps) {
  return (
    <div
      className={`mt-4 p-3 rounded text-sm flex items-start gap-2 w-[95%] mx-auto
        ${
          type === "loading"
            ? "bg-blue-900/30 border border-blue-800/50 text-blue-300"
            : type === "success"
              ? "bg-green-900/30 border border-green-800/50 text-green-300"
              : "bg-red-900/30 border border-red-800/50 text-red-300"
        }`}
    >
      {type === "loading" ? (
        <Loader2 size={16} className="mt-0.5 flex-shrink-0 animate-spin" />
      ) : type === "success" ? (
        <Check size={16} className="mt-0.5 flex-shrink-0" />
      ) : (
        <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
      )}
      <div className="flex-1">
        <div>{message}</div>

        {/* Show progress bar if progress is provided */}
        {progress !== undefined && type === "loading" && (
          <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
            <div
              className="bg-sky-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Show retry button for errors */}
        {type === "error" && (
          <button
            className="mt-2 text-xs bg-red-900/50 hover:bg-red-800/50 text-red-300 px-2 py-1 rounded"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        )}
      </div>
    </div>
  )
}

interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const [selectedProvider, setSelectedProvider] = useState<Provider>("pstream")
  const [selectedServer, setSelectedServer] = useState<ProviderServer | null>(null)
  const [isDownloadingMovies, setIsDownloadingMovies] = useState(false)
  const [isDownloadingTV, setIsDownloadingTV] = useState(false)
  const [isDirectFetchingMovies, setIsDirectFetchingMovies] = useState(false)
  const [isDirectFetchingTV, setIsDirectFetchingTV] = useState(false)
  const [moviesDownloadComplete, setMoviesDownloadComplete] = useState(false)
  const [tvDownloadComplete, setTVDownloadComplete] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [movieCount, setMovieCount] = useState<number | null>(null)
  const [tvCount, setTVCount] = useState<number | null>(null)
  const [downloadProgress, setDownloadProgress] = useState<string | null>(null)
  const [downloadProgressType, setDownloadProgressType] = useState<string>("loading")
  const [isClearing, setIsClearing] = useState(false)
  const [isObliterating, setIsObliterating] = useState(false)
  const [isUploadingMovies, setIsUploadingMovies] = useState(false)
  const [isUploadingTV, setIsUploadingTV] = useState(false)
  const [showServerMenu, setShowServerMenu] = useState<string | null>(null)
  const [omdbEnabled, setOmdbEnabled] = useState(false)
  const [omdbApiKey, setOmdbApiKey] = useState("")
  const [isSavingApiKey, setIsSavingApiKey] = useState(false)
  const [apiKeySaved, setApiKeySaved] = useState(false)
  const [omdbSaveSuccess, setOmdbSaveSuccess] = useState(false)

  // Refs for file inputs
  const movieFileInputRef = useRef<HTMLInputElement>(null)
  const tvFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Load saved provider from localStorage
    const savedProvider = localStorage.getItem("selectedProvider") as Provider
    if (savedProvider) {
      setSelectedProvider(savedProvider)
    }

    // Load saved server from localStorage
    const savedServer = localStorage.getItem("selectedServer") as ProviderServer
    if (savedServer) {
      setSelectedServer(savedServer)
    } else {
      // Set default servers based on provider
      if (savedProvider === "2embed") {
        setSelectedServer("2embed.cc")
      } else if (savedProvider === "vidsrc.xyz") {
        setSelectedServer("vidsrc.xyz")
      }
    }

    // Load OMDB settings
    const savedOmdbEnabled = localStorage.getItem("omdbEnabled") === "true"
    setOmdbEnabled(savedOmdbEnabled)

    const savedOmdbApiKey = localStorage.getItem("omdbApiKey") || ""
    setOmdbApiKey(savedOmdbApiKey)

    // Check if database is already initialized
    const checkDatabase = async () => {
      const moviesInitialized = await isDatabaseInitialized()
      setMoviesDownloadComplete(moviesInitialized)

      const tvInitialized = await isTVDatabaseInitialized()
      setTVDownloadComplete(tvInitialized)

      if (moviesInitialized) {
        const count = await getMetadata("movieCount")
        setMovieCount(count)
      }

      if (tvInitialized) {
        const count = await getMetadata("tvCount")
        setTVCount(count)
      }
    }

    checkDatabase()
  }, [])

  const handleProviderSelect = (provider: Provider) => {
    setSelectedProvider(provider)
    localStorage.setItem("selectedProvider", provider)

    // Set default server when provider changes
    if (provider === "2embed" && !selectedServer) {
      setSelectedServer("2embed.cc")
      localStorage.setItem("selectedServer", "2embed.cc")
    } else if (provider === "vidsrc.xyz" && !selectedServer) {
      setSelectedServer("vidsrc.xyz")
      localStorage.setItem("selectedServer", "vidsrc.xyz")
    }
  }

  const handleServerSelect = (server: ProviderServer) => {
    setSelectedServer(server)
    localStorage.setItem("selectedServer", server)
    setShowServerMenu(null) // Close the menu after selection
  }

  const toggleServerMenu = (providerId: string) => {
    if (showServerMenu === providerId) {
      setShowServerMenu(null)
    } else {
      setShowServerMenu(providerId)
    }
  }

  const handleOmdbToggle = (checked: boolean) => {
    setOmdbEnabled(checked)
    localStorage.setItem("omdbEnabled", checked.toString())

    // Reset saved state when toggling
    setApiKeySaved(false)
  }

  const handleSaveApiKey = () => {
    setIsSavingApiKey(true)

    // Simulate API call to validate key
    setTimeout(() => {
      localStorage.setItem("omdbApiKey", omdbApiKey)
      setIsSavingApiKey(false)
      setApiKeySaved(true)

      // Reset saved state after 3 seconds
      setTimeout(() => {
        setApiKeySaved(false)
      }, 3000)
    }, 500)
  }

  const handleClearDatabase = async () => {
    if (window.confirm("Are you sure you want to clear the movie and TV database? This cannot be undone.")) {
      setIsClearing(true)
      try {
        await clearDatabase()
        localStorage.removeItem("movieDatabaseDownloaded")
        localStorage.removeItem("tvDatabaseDownloaded")
        setMoviesDownloadComplete(false)
        setTVDownloadComplete(false)
        setMovieCount(null)
        setTVCount(null)
      } catch (error) {
        console.error("Error clearing database:", error)
      } finally {
        setIsClearing(false)
      }
    }
  }

  const handleObliterateEverything = async () => {
    if (
      window.confirm(
        "⚠️ WARNING: This will delete EVERYTHING - all databases, bookmarks, cached TV show data, and settings. This action cannot be undone. Are you absolutely sure?",
      )
    ) {
      setIsObliterating(true)
      try {
        // Clear IndexedDB databases
        await clearDatabase()

        // Clear all localStorage items
        localStorage.clear()

        // Clear all TV show enumeration caches
        const keys = Object.keys(localStorage)
        for (const key of keys) {
          if (key.startsWith("tv-episodes-")) {
            localStorage.removeItem(key)
          }
        }

        // Reset all state
        setMoviesDownloadComplete(false)
        setTVDownloadComplete(false)
        setMovieCount(null)
        setTVCount(null)
        setSelectedProvider("pstream")
        setSelectedServer(null)
        setOmdbEnabled(false)
        setOmdbApiKey("")

        // Show success message
        alert("All data has been obliterated. The app will now reload.")

        // Reload the page to reset everything
        window.location.reload()
      } catch (error) {
        console.error("Error obliterating data:", error)
        alert("An error occurred while obliterating data. Please try again.")
      } finally {
        setIsObliterating(false)
      }
    }
  }

  // Updated progress handler that sets both message and type
  const handleProgress = (message: string, type: string) => {
    setDownloadProgress(message)
    setDownloadProgressType(type)

    if (type === "error") {
      setDownloadError(message)
    } else {
      setDownloadError(null)
    }
  }

  // Direct browser fetch and storage for movies
  const handleDirectMovieSetup = async () => {
    setIsDirectFetchingMovies(true)

    await fetchAndStoreMovies(handleProgress, (success, count) => {
      if (success) {
        setMoviesDownloadComplete(true)
        setMovieCount(count || 0)
      }
      setIsDirectFetchingMovies(false)
    })
  }

  // Direct browser fetch and storage for TV shows
  const handleDirectTVSetup = async () => {
    setIsDirectFetchingTV(true)

    await fetchAndStoreTVShows(handleProgress, (success, count) => {
      if (success) {
        setTVDownloadComplete(true)
        setTVCount(count || 0)
      }
      setIsDirectFetchingTV(false)
    })
  }

  // Replace the handleCreateDownloadableMovies function with this simplified version
  const handleCreateDownloadableMovies = async () => {
    try {
      await createDownloadableData("movie")
    } catch (error) {
      console.error("Error creating downloadable movies:", error)
    }
  }

  // Replace the handleCreateDownloadableTV function with this simplified version
  const handleCreateDownloadableTV = async () => {
    try {
      await createDownloadableData("tv")
    } catch (error) {
      console.error("Error creating downloadable TV shows:", error)
    }
  }

  // Server-side download with wget for movies
  const handleDownloadMovieDatabase = async () => {
    setIsDownloadingMovies(true)
    setDownloadError(null)
    setDownloadProgress("Downloading movie database via server...")
    setDownloadProgressType("loading")

    try {
      // Call the API with wget flag
      const response = await fetch("/api/download-data?type=movie&useWget=true")
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to download database")
      }

      const movieData = result.data

      if (!Array.isArray(movieData)) {
        throw new Error("Invalid data format received")
      }

      setDownloadProgress(`Processing ${movieData.length} movies...`)

      // Store movies in IndexedDB
      await storeMovies(movieData)
      localStorage.setItem("movieDatabaseDownloaded", "true")

      // Get the actual count of stored movies
      const count = await getMetadata("movieCount")
      setMovieCount(count)
      setMoviesDownloadComplete(true)
      setDownloadProgress(null)

      // Create a downloadable version
      await createDownloadableData("movie")
    } catch (error) {
      console.error("Error downloading database:", error)
      setDownloadError(error instanceof Error ? error.message : "Failed to download database")
      setDownloadProgress(null)
      setMoviesDownloadComplete(false)
    } finally {
      setIsDownloadingMovies(false)
    }
  }

  // Server-side download with wget for TV shows
  const handleDownloadTVDatabase = async () => {
    setIsDownloadingTV(true)
    setDownloadError(null)
    setDownloadProgress("Downloading TV series database via server...")
    setDownloadProgressType("loading")

    try {
      // Call the API with wget flag
      const response = await fetch("/api/download-data?type=tv&useWget=true")
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to download TV database")
      }

      const tvData = result.data

      if (!Array.isArray(tvData)) {
        throw new Error("Invalid TV data format received")
      }

      setDownloadProgress(`Processing ${tvData.length} TV series...`)

      // Store TV shows in IndexedDB
      await storeTVShows(tvData)
      localStorage.setItem("tvDatabaseDownloaded", "true")

      // Get the actual count of stored TV shows
      const count = await getMetadata("tvCount")
      setTVCount(count)
      setTVDownloadComplete(true)
      setDownloadProgress(null)

      // Create a downloadable version
      await createDownloadableData("tv")
    } catch (error) {
      console.error("Error downloading TV database:", error)
      setDownloadError(error instanceof Error ? error.message : "Failed to download TV database")
      setDownloadProgress(null)
      setTVDownloadComplete(false)
    } finally {
      setIsDownloadingTV(false)
    }
  }

  // Handle movie file upload
  const handleMovieFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploadingMovies(true)
    setDownloadProgress("Validating movie database file...")
    setDownloadProgressType("loading")

    try {
      // Process the file
      const count = await handleMovieDatabaseUpload(file, handleProgress)

      // Update state
      setMoviesDownloadComplete(true)
      setMovieCount(count)
    } catch (error) {
      console.error("Error uploading movie database:", error)
      setDownloadError(error instanceof Error ? error.message : "Failed to upload database")
      setDownloadProgressType("error")
    } finally {
      setIsUploadingMovies(false)

      // Reset the file input
      if (movieFileInputRef.current) {
        movieFileInputRef.current.value = ""
      }
    }
  }

  // Handle TV file upload
  const handleTVFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploadingTV(true)
    setDownloadProgress("Validating TV database file...")
    setDownloadProgressType("loading")

    try {
      // Process the file
      const count = await handleTVDatabaseUpload(file, handleProgress)

      // Update state
      setTVDownloadComplete(true)
      setTVCount(count)
    } catch (error) {
      console.error("Error uploading TV database:", error)
      setDownloadError(error instanceof Error ? error.message : "Failed to upload database")
      setDownloadProgressType("error")
    } finally {
      setIsUploadingTV(false)

      // Reset the file input
      if (tvFileInputRef.current) {
        tvFileInputRef.current.value = ""
      }
    }
  }

  // Trigger file input click
  const triggerMovieFileInput = () => {
    movieFileInputRef.current?.click()
  }

  const triggerTVFileInput = () => {
    tvFileInputRef.current?.click()
  }

  const providers = [
    {
      id: "pstream" as Provider,
      name: "P-Stream",
      url: "https://iframe.pstream.org/media/tmdb-movie-",
      description: "Best movie provider 🔥",
    },
    {
      id: "embed.su" as Provider,
      name: "Embed.su",
      url: "https://embed.su/embed/movie/",
      description: "Second best",
    },
    {
      id: "vidsrc.co" as Provider,
      name: "Vidsrc.co",
      url: "https://player.vidsrc.co/embed/movie/",
      description: "Good provider 👍",
    },
    {
      id: "vidsrc.cc" as Provider,
      name: "Vidsrc.cc",
      url: "https://vidsrc.cc/v2/embed/movie/",
      description: "Normal",
    },
    {
      id: "autoembed" as Provider,
      name: "Autoembed",
      url: "https://player.autoembed.cc/embed/movie/",
      description: "Normal",
    },
    {
      id: "2embed" as Provider,
      name: "2Embed",
      url: "https://www.2embed.cc/embed/",
      description: "Multiple servers available",
      hasServers: true,
      servers: [
        { id: "2embed.cc" as ProviderServer, name: "2embed.cc" },
        { id: "2embed.skin" as ProviderServer, name: "2embed.skin" },
      ],
    },
    {
      id: "vidsrc.xyz" as Provider,
      name: "Vidsrc.xyz",
      url: "https://vidsrc.xyz/embed/movie?imdb=",
      description: "Multiple servers available",
      hasServers: true,
      servers: [
        { id: "vidsrc.xyz" as ProviderServer, name: "vidsrc.xyz" },
        { id: "vidsrc.in" as ProviderServer, name: "vidsrc.in" },
        { id: "vidsrc.pm" as ProviderServer, name: "vidsrc.pm" },
        { id: "vidsrc.me" as ProviderServer, name: "vidsrc.me" },
        { id: "vidsrc.net" as ProviderServer, name: "vidsrc.net" },
      ],
    },
    {
      id: "uembed" as Provider,
      name: "UEmbed",
      url: "https://uembed.site/?id=",
      description: "Meh. Why not",
    },
    {
      id: "vidsrc.su" as Provider,
      name: "Vidsrc.su",
      url: "https://vidsrc.su/embed/movie/",
      description: "Worst provider. Might not work",
    },
  ]

  const handleDownloadMovies = async () => {
    setIsDownloadingMovies(true)
    setDownloadProgress("Downloading movies...")
    setDownloadProgressType("loading")
    setDownloadError(null)

    try {
      const response = await fetch("/api/download-data?type=movie&useWget=true")
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to download movies")
      }

      const movieData = result.data

      if (!Array.isArray(movieData)) {
        throw new Error("Invalid movie data format received")
      }

      setDownloadProgress(`Processing ${movieData.length} movies...`)

      // Store movies in IndexedDB
      await storeMovies(movieData)
      localStorage.setItem("movieDatabaseDownloaded", "true")

      // Get the actual count of stored movies
      const count = await getMetadata("movieCount")
      setMovieCount(count)
      setMoviesDownloadComplete(true)
      setDownloadProgress(null)

      // Create a downloadable version
      await createDownloadableData("movie")
    } catch (error) {
      console.error("Download error:", error)
      setDownloadError(error instanceof Error ? error.message : "Unknown error occurred")
      setDownloadProgressType("error")
      setDownloadProgress(null)
    } finally {
      setIsDownloadingMovies(false)
    }
  }

  const handleDownloadTV = async () => {
    setIsDownloadingTV(true)
    setDownloadProgress("Downloading TV shows...")
    setDownloadProgressType("loading")
    setDownloadError(null)

    try {
      const response = await fetch("/api/download-data?type=tv&useWget=true")
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to download TV shows")
      }

      const tvData = result.data

      if (!Array.isArray(tvData)) {
        throw new Error("Invalid TV data format received")
      }

      setDownloadProgress(`Processing ${tvData.length} TV shows...`)

      // Store TV shows in IndexedDB
      await storeTVShows(tvData)
      localStorage.setItem("tvDatabaseDownloaded", "true")

      // Get the actual count of stored TV shows
      const count = await getMetadata("tvCount")
      setTVCount(count)
      setTVDownloadComplete(true)
      setDownloadProgress(null)

      // Create a downloadable version
      await createDownloadableData("tv")
    } catch (error) {
      console.error("Download error:", error)
      setDownloadError(error instanceof Error ? error.message : "Unknown error occurred")
      setDownloadProgressType("error")
      setDownloadProgress(null)
    } finally {
      setIsDownloadingTV(false)
    }
  }

  const handleSaveOmdbApiKey = () => {
    localStorage.setItem("omdbApiKey", omdbApiKey)
    setApiKeySaved(true)
    setTimeout(() => setApiKeySaved(false), 3000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative w-[90%] max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg bg-gray-800 shadow-xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between p-3 sm:p-4 bg-gray-800 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 transition-colors rounded-full hover:bg-gray-700 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <Tabs defaultValue="database" className="p-3 sm:p-6">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="database" className="data-[state=active]:bg-sky-900/50">
              <Database className="w-4 h-4 mr-2" />
              Database
            </TabsTrigger>
            <TabsTrigger value="providers" className="data-[state=active]:bg-sky-900/50">
              <Film className="w-4 h-4 mr-2" />
              Providers
            </TabsTrigger>
            <TabsTrigger value="api" className="data-[state=active]:bg-sky-900/50">
              <ExternalLink className="w-4 h-4 mr-2" />
              API
            </TabsTrigger>
          </TabsList>

          <TabsContent value="database" className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Movie Database</CardTitle>
                <CardDescription>Download the movie database for offline use</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-4">
                  {/* Direct browser setup button - Primary method */}
                  <Button
                    onClick={handleDirectMovieSetup}
                    disabled={isDirectFetchingMovies || isDownloadingMovies || isUploadingMovies}
                    className={`w-full mx-auto flex items-center justify-center gap-2 min-h-[2.5rem] py-2 px-3 ${
                      moviesDownloadComplete
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-sky-600 hover:bg-sky-700 text-white"
                    }`}
                  >
                    {isDirectFetchingMovies ? (
                      <>
                        <Loader2 size={16} className="animate-spin mr-2 flex-shrink-0" />
                        <span className="text-center">Setting up movies...</span>
                      </>
                    ) : moviesDownloadComplete ? (
                      <>
                        <Check size={16} className="flex-shrink-0 mr-2" />
                        <span className="text-center whitespace-normal">
                          Movies Downloaded {movieCount && `(${movieCount})`}
                        </span>
                      </>
                    ) : (
                      <>
                        <Database size={16} className="flex-shrink-0 mr-2" />
                        <span className="text-center">Setup Movie Database</span>
                      </>
                    )}
                  </Button>

                  {/* Server-side download button - Fallback method */}
                  {!moviesDownloadComplete && (
                    <Button
                      onClick={handleDownloadMovieDatabase}
                      disabled={isDownloadingMovies || isDirectFetchingMovies || isUploadingMovies}
                      variant="outline"
                      className="w-full mx-auto mt-2 flex items-center justify-center gap-2 min-h-[2.5rem] py-2 px-3 bg-gray-700/50 hover:bg-gray-700 text-gray-300 border-gray-600"
                    >
                      {isDownloadingMovies ? (
                        <>
                          <Loader2 size={16} className="animate-spin mr-2 flex-shrink-0" />
                          <span className="text-center">Downloading via server...</span>
                        </>
                      ) : (
                        <>
                          <Server size={16} className="flex-shrink-0 mr-2" />
                          <span className="text-center">Download via server (fallback)</span>
                        </>
                      )}
                    </Button>
                  )}

                  {/* File upload button */}
                  <div className="mt-2 flex gap-2">
                    <Button
                      onClick={triggerMovieFileInput}
                      disabled={isUploadingMovies || isDirectFetchingMovies || isDownloadingMovies}
                      variant="outline"
                      className="flex-1 flex items-center justify-center gap-2 min-h-[2.5rem] py-2 px-3 bg-gray-700/50 hover:bg-gray-700 text-gray-300 border-gray-600"
                    >
                      {isUploadingMovies ? (
                        <>
                          <Loader2 size={16} className="animate-spin mr-2 flex-shrink-0" />
                          <span className="text-center">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={16} className="flex-shrink-0 mr-2" />
                          <span className="text-center">Upload Database File</span>
                        </>
                      )}
                    </Button>

                    {moviesDownloadComplete && (
                      <Button
                        onClick={handleCreateDownloadableMovies}
                        variant="outline"
                        className="flex items-center justify-center gap-2 min-h-[2.5rem] py-2 px-3 bg-gray-700/50 hover:bg-gray-700 text-gray-300 border-gray-600"
                      >
                        <Download size={16} className="flex-shrink-0" />
                      </Button>
                    )}

                    {/* Hidden file input */}
                    <input
                      type="file"
                      ref={movieFileInputRef}
                      onChange={handleMovieFileUpload}
                      accept=".json"
                      className="hidden"
                    />
                  </div>

                  {/* TV Series Database Section */}
                  {/* Direct browser setup button - Primary method */}
                  <Button
                    onClick={handleDirectTVSetup}
                    disabled={isDirectFetchingTV || isDownloadingTV || isUploadingTV}
                    className={`w-full mx-auto mt-3 flex items-center justify-center gap-2 min-h-[2.5rem] py-2 px-3 ${
                      tvDownloadComplete
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-sky-600 hover:bg-sky-700 text-white"
                    }`}
                  >
                    {isDirectFetchingTV ? (
                      <>
                        <Loader2 size={16} className="animate-spin mr-2 flex-shrink-0" />
                        <span className="text-center">Setting up TV shows...</span>
                      </>
                    ) : tvDownloadComplete ? (
                      <>
                        <Check size={16} className="flex-shrink-0 mr-2" />
                        <span className="text-center whitespace-normal">
                          TV Series Downloaded {tvCount && `(${tvCount})`}
                        </span>
                      </>
                    ) : (
                      <>
                        <Database size={16} className="flex-shrink-0 mr-2" />
                        <span className="text-center">Setup TV Series Database</span>
                      </>
                    )}
                  </Button>

                  {/* Server-side download button - Fallback method */}
                  {!tvDownloadComplete && (
                    <Button
                      onClick={handleDownloadTVDatabase}
                      disabled={isDownloadingTV || isDirectFetchingTV || isUploadingTV}
                      variant="outline"
                      className="w-full mx-auto mt-2 flex items-center justify-center gap-2 min-h-[2.5rem] py-2 px-3 bg-gray-700/50 hover:bg-gray-700 text-gray-300 border-gray-600"
                    >
                      {isDownloadingTV ? (
                        <>
                          <Loader2 size={16} className="animate-spin mr-2 flex-shrink-0" />
                          <span className="text-center">Downloading via server...</span>
                        </>
                      ) : (
                        <>
                          <Server size={16} className="flex-shrink-0 mr-2" />
                          <span className="text-center">Download via server (fallback)</span>
                        </>
                      )}
                    </Button>
                  )}

                  {/* File upload button */}
                  <div className="mt-2 flex gap-2">
                    <Button
                      onClick={triggerTVFileInput}
                      disabled={isUploadingTV || isDirectFetchingTV || isDownloadingTV}
                      variant="outline"
                      className="flex-1 flex items-center justify-center gap-2 min-h-[2.5rem] py-2 px-3 bg-gray-700/50 hover:bg-gray-700 text-gray-300 border-gray-600"
                    >
                      {isUploadingTV ? (
                        <>
                          <Loader2 size={16} className="animate-spin mr-2 flex-shrink-0" />
                          <span className="text-center">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={16} className="flex-shrink-0 mr-2" />
                          <span className="text-center">Upload Database File</span>
                        </>
                      )}
                    </Button>

                    {tvDownloadComplete && (
                      <Button
                        onClick={handleCreateDownloadableTV}
                        variant="outline"
                        className="flex items-center justify-center gap-2 min-h-[2.5rem] py-2 px-3 bg-gray-700/50 hover:bg-gray-700 text-gray-300 border-gray-600"
                      >
                        <Download size={16} className="flex-shrink-0" />
                      </Button>
                    )}

                    {/* Hidden file input */}
                    <input
                      type="file"
                      ref={tvFileInputRef}
                      onChange={handleTVFileUpload}
                      accept=".json"
                      className="hidden"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-gray-700 pt-4">
                <p className="text-xs text-gray-400">
                  The database will be stored in your browser's IndexedDB storage. This allows for fast searching
                  without needing to download the data each time.
                </p>
              </CardFooter>
            </Card>

            <AnimatePresence>
              {downloadProgress && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Alert variant="default" className="bg-blue-900/30 border-blue-800 text-white">
                    <Info className="h-4 w-4" />
                    <AlertDescription>{downloadProgress}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
              {downloadError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Alert variant="destructive" className="bg-red-900/30 border-red-800 text-white">
                    <Info className="h-4 w-4" />
                    <AlertDescription>{downloadError}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="providers" className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Video Providers</CardTitle>
                <CardDescription>Select your preferred video provider</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {providers.map((provider) => (
                    <div key={provider.id} className="relative">
                      <Button
                        variant={selectedProvider === provider.id ? "default" : "outline"}
                        className={`w-full justify-between ${
                          selectedProvider === provider.id
                            ? "bg-sky-600 hover:bg-sky-700 text-white"
                            : "bg-gray-700 hover:bg-gray-600 text-gray-200"
                        }`}
                        onClick={() => handleProviderSelect(provider.id)}
                      >
                        {provider.name}
                        {(provider.id === "2embed" || provider.id === "vidsrc.xyz") && (
                          <button
                            className="ml-1 p-1 rounded-full hover:bg-gray-600"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleServerMenu(provider.id)
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="m6 9 6 6 6-6" />
                            </svg>
                          </button>
                        )}
                      </Button>

                      {/* Server selection dropdown */}
                      {showServerMenu === provider.id && (
                        <div className="absolute z-10 mt-1 w-full bg-gray-700 rounded-md shadow-lg">
                          {provider.id === "2embed" && (
                            <div className="py-1">
                              {provider.servers?.map((server) => (
                                <Button
                                  key={server.id}
                                  variant="ghost"
                                  className={`block px-4 py-2 text-sm w-full text-left hover:bg-gray-600 ${
                                    selectedServer === server.id ? "bg-sky-900/50 text-white" : "text-gray-200"
                                  }`}
                                  onClick={() => handleServerSelect(server.id)}
                                >
                                  {server.name}
                                </Button>
                              ))}
                            </div>
                          )}

                          {provider.id === "vidsrc.xyz" && (
                            <div className="py-1">
                              {provider.servers?.map((server) => (
                                <Button
                                  key={server.id}
                                  variant="ghost"
                                  className={`block px-4 py-2 text-sm w-full text-left hover:bg-gray-600 ${
                                    selectedServer === server.id ? "bg-sky-900/50 text-white" : "text-gray-200"
                                  }`}
                                  onClick={() => handleServerSelect(server.id)}
                                >
                                  {server.name}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t border-gray-700 pt-4">
                <p className="text-xs text-gray-400">
                  Your selected provider will be used to stream movies and TV shows. Some providers may work better than
                  others depending on your location and network.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">OMDB API</CardTitle>
                <CardDescription>Enable OMDB API to get detailed movie information and posters</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="omdb-toggle" className="text-white">
                      Enable OMDB API
                    </Label>
                    <Switch
                      id="omdb-toggle"
                      checked={omdbEnabled}
                      onCheckedChange={handleOmdbToggle}
                      className="data-[state=checked]:bg-sky-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="omdb-api-key" className={`${!omdbEnabled ? "text-gray-500" : "text-white"}`}>
                      API Key
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="omdb-api-key"
                        type="text"
                        placeholder="Enter your OMDB API key"
                        value={omdbApiKey}
                        onChange={(e) => setOmdbApiKey(e.target.value)}
                        disabled={!omdbEnabled}
                        className={`flex-1 bg-gray-800 border-gray-700 text-white ${!omdbEnabled ? "opacity-50" : ""}`}
                      />
                      <Button
                        onClick={handleSaveOmdbApiKey}
                        disabled={!omdbEnabled || !omdbApiKey || isSavingApiKey}
                        className={`bg-sky-600 hover:bg-sky-700 text-white ${!omdbEnabled || !omdbApiKey ? "opacity-50" : ""}`}
                      >
                        {isSavingApiKey ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : apiKeySaved ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <a
                      href="https://www.omdbapi.com/apikey.aspx"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:text-sky-300 text-sm flex items-center"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Get a free API key
                    </a>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-gray-700 pt-4">
                <p className="text-xs text-gray-400">
                  The OMDB API provides detailed movie information including posters, ratings, and plot summaries. The
                  free plan is limited to 1,000 requests per day. If this limit is reached, the app will fall back to
                  the downloaded database.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        {downloadProgress && (
          <ProgressIndicator
            type={downloadProgressType}
            message={downloadProgress}
            progress={downloadProgressType === "loading" ? 50 : undefined}
          />
        )}

        {/* Database Management Section */}
        <div className="mt-6 w-[95%] mx-auto">
          <h3 className="text-lg font-medium text-white mb-3">Database Management</h3>

          {(moviesDownloadComplete || tvDownloadComplete) && (
            <Button
              onClick={handleClearDatabase}
              disabled={isClearing}
              variant="outline"
              className="w-full mx-auto mb-3 border-red-800/50 text-red-400 hover:bg-red-900/20 hover:text-red-300"
            >
              {isClearing ? (
                <Loader2 size={16} className="animate-spin mr-2 flex-shrink-0" />
              ) : (
                <Trash2 size={16} className="mr-2 flex-shrink-0" />
              )}
              <span className="text-center">Clear All Databases</span>
            </Button>
          )}

          {/* Obliterate Everything Button */}
          <Button
            onClick={handleObliterateEverything}
            disabled={isObliterating}
            variant="outline"
            className="w-full mx-auto border-red-900 bg-red-900/30 text-red-300 hover:bg-red-900/50 hover:text-red-100"
          >
            {isObliterating ? (
              <Loader2 size={16} className="animate-spin mr-2 flex-shrink-0" />
            ) : (
              <Bomb size={16} className="mr-2 flex-shrink-0" />
            )}
            <span className="text-center font-bold">OBLITERATE EVERYTHING</span>
          </Button>
          <p className="text-xs text-red-400/70 mt-1 text-center">
            Deletes all data: bookmarks, databases, cached TV shows, and settings
          </p>
        </div>

        <div className="flex justify-end mt-4 sm:mt-6 w-full">
          <Button onClick={onClose} className="bg-sky-600 hover:bg-sky-700 text-white">
            Close
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
