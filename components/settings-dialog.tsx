"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { X, Download, Check, AlertTriangle, Info, RefreshCw, Trash2, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { isDatabaseInitialized, isTVDatabaseInitialized, clearDatabase } from "@/utils/db"

interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState("providers")
  const [omdbApiKey, setOmdbApiKey] = useState("")
  const [selectedProvider, setSelectedProvider] = useState<string>("embed.su")
  const [selectedServer, setSelectedServer] = useState<string>("")
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [downloadStatus, setDownloadStatus] = useState("")
  const [hasDatabase, setHasDatabase] = useState(false)
  const [hasTVDatabase, setHasTVDatabase] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  // Provider dictionary
  const providers = [
    {
      id: "pstream",
      name: "P-Stream",
      url: "https://iframe.pstream.org/media/tmdb-movie-",
      description: "Best movie provider 🔥",
    },
    {
      id: "embed.su",
      name: "Embed.su",
      url: "https://embed.su/embed/movie/",
      description: "Second best",
    },
    {
      id: "vidsrc.co",
      name: "Vidsrc.co",
      url: "https://player.vidsrc.co/embed/movie/",
      description: "Good provider 👍",
    },
    {
      id: "vidsrc.cc",
      name: "Vidsrc.cc",
      url: "https://vidsrc.cc/v2/embed/movie/",
      description: "Normal",
    },
    {
      id: "autoembed",
      name: "Autoembed",
      url: "https://player.autoembed.cc/embed/movie/",
      description: "Normal",
    },
    {
      id: "2embed",
      name: "2Embed",
      url: "https://www.2embed.cc/embed/",
      description: "Multiple servers available",
      hasServers: true,
      servers: [
        { id: "2embed.cc", name: "2embed.cc" },
        { id: "2embed.skin", name: "2embed.skin" },
      ],
    },
    {
      id: "vidsrc.xyz",
      name: "Vidsrc.xyz",
      url: "https://vidsrc.xyz/embed/movie?imdb=",
      description: "Multiple servers available",
      hasServers: true,
      servers: [
        { id: "vidsrc.xyz", name: "vidsrc.xyz" },
        { id: "vidsrc.in", name: "vidsrc.in" },
        { id: "vidsrc.pm", name: "vidsrc.pm" },
        { id: "vidsrc.me", name: "vidsrc.me" },
        { id: "vidsrc.net", name: "vidsrc.net" },
      ],
    },
    {
      id: "uembed",
      name: "UEmbed",
      url: "https://uembed.site/?id=",
      description: "Meh. Why not",
    },
    {
      id: "vidsrc.su",
      name: "Vidsrc.su",
      url: "https://vidsrc.su/embed/movie/",
      description: "Worst provider. Might not work",
    },
  ]

  // Load settings from localStorage on component mount
  useEffect(() => {
    try {
      // Set default OMDB API key for first-time users
      if (typeof window !== "undefined" && !localStorage.getItem("omdbApiKey")) {
        localStorage.setItem("omdbApiKey", "9f603783")
        setOmdbApiKey("9f603783")
      }
      const savedOmdbApiKey = localStorage.getItem("omdbApiKey")
      if (savedOmdbApiKey !== null) {
        setOmdbApiKey(savedOmdbApiKey)
      }

      const savedProvider = localStorage.getItem("selectedProvider")
      if (savedProvider) {
        setSelectedProvider(savedProvider)
      }

      const savedServer = localStorage.getItem("selectedServer")
      if (savedServer) {
        setSelectedServer(savedServer)
      }

      // Check if database is initialized
      const checkDatabase = async () => {
        const moviesInitialized = await isDatabaseInitialized()
        const tvInitialized = await isTVDatabaseInitialized()
        setHasDatabase(moviesInitialized)
        setHasTVDatabase(tvInitialized)
      }

      checkDatabase()
    } catch (e) {
      console.error("Error loading settings:", e)
    }
  }, [])

  // Only save provider/server automatically
  useEffect(() => {
    try {
      localStorage.setItem("selectedProvider", selectedProvider)
      if (selectedServer) {
        localStorage.setItem("selectedServer", selectedServer)
      }
    } catch (e) {
      console.error("Error saving settings:", e)
    }
  }, [selectedProvider, selectedServer])

  // Save OMDB settings manually
  const handleSaveOmdb = () => {
    try {
      localStorage.setItem("omdbApiKey", omdbApiKey)
    } catch (e) {
      console.error("Error saving OMDB settings:", e)
    }
  }

  const handleDownloadDatabase = async () => {
    setIsDownloading(true)
    setDownloadProgress(0)
    setDownloadStatus("Preparing to download movie database...")

    try {
      const response = await fetch("/api/download-data")
      const reader = response.body?.getReader()

      if (!reader) {
        throw new Error("Failed to get reader from response")
      }

      const contentLength = Number(response.headers.get("Content-Length")) || 0
      let receivedLength = 0
      const chunks = []

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        chunks.push(value)
        receivedLength += value.length

        // Calculate progress
        const progress = contentLength ? Math.round((receivedLength / contentLength) * 100) : 0
        setDownloadProgress(progress)
        setDownloadStatus(`Downloading movie database... ${progress}%`)
      }

      // Concatenate chunks
      const allChunks = new Uint8Array(receivedLength)
      let position = 0
      for (const chunk of chunks) {
        allChunks.set(chunk, position)
        position += chunk.length
      }

      // Parse the JSON data
      const jsonString = new TextDecoder("utf-8").decode(allChunks)
      const data = JSON.parse(jsonString)

      // Process the data
      setDownloadStatus("Processing movie data...")
      await processMovieData(data)

      setDownloadStatus("Database download and processing complete!")
      setHasDatabase(true)
      setHasTVDatabase(true)
    } catch (error) {
      console.error("Error downloading database:", error)
      setDownloadStatus(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setTimeout(() => {
        setIsDownloading(false)
        setDownloadProgress(0)
      }, 2000)
    }
  }

  const processMovieData = async (data: any) => {
    try {
      // Import the database utility functions
      const { storeMovies, storeTVShows } = await import("@/utils/db")

      // Store movies
      if (data.movies && data.movies.length > 0) {
        setDownloadStatus(`Storing ${data.movies.length} movies in database...`)
        await storeMovies(data.movies)
      }

      // Store TV shows
      if (data.tvShows && data.tvShows.length > 0) {
        setDownloadStatus(`Storing ${data.tvShows.length} TV shows in database...`)
        await storeTVShows(data.tvShows)
      }

      return true
    } catch (error) {
      console.error("Error processing movie data:", error)
      throw error
    }
  }

  const handleClearDatabase = async () => {
    setIsClearing(true)
    try {
      await clearDatabase()
      setHasDatabase(false)
      setHasTVDatabase(false)
      setDownloadStatus("Database cleared successfully.")
    } catch (error) {
      console.error("Error clearing database:", error)
      setDownloadStatus(`Error clearing database: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsClearing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-gray-800 rounded-lg shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-sky-400" />
            <h2 className="text-xl font-bold text-white">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 transition-colors rounded-full hover:bg-gray-700 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4">
          <Tabs
            defaultValue="providers"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="w-full mb-4 bg-gray-700">
              <TabsTrigger value="providers" className="flex-1 data-[state=active]:bg-sky-600">
                Providers
              </TabsTrigger>
              <TabsTrigger value="general" className="flex-1 data-[state=active]:bg-sky-600">
                OMDB API
              </TabsTrigger>
            </TabsList>

            <TabsContent value="providers" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-white mb-2 block">Video Provider</Label>
                  <div className="flex flex-col gap-3">
                    {providers.map((provider) => (
                      <button
                        key={provider.id}
                        type="button"
                        onClick={() => {
                          setSelectedProvider(provider.id)
                          // Reset server if provider changes
                          if (!provider.hasServers) setSelectedServer("")
                        }}
                        className={`w-full text-left rounded-lg border p-3 transition-colors ${
                          selectedProvider === provider.id
                            ? "border-sky-500 bg-sky-950/40"
                            : "border-gray-700 bg-gray-800 hover:border-sky-700"
                        }`}
                      >
                        <div className="font-semibold text-white">{provider.name}</div>
                        <div className="text-xs text-sky-400 truncate">
                          <a href={provider.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {provider.url}
                          </a>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">{provider.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Server selection for providers with servers */}
                {(() => {
                  const selected = providers.find((p) => p.id === selectedProvider)
                  if (selected && selected.hasServers && selected.servers) {
                    return (
                      <div>
                        <Label className="text-white mb-2 block">Server</Label>
                        <div className="flex flex-wrap gap-2">
                          {selected.servers.map((server: any) => (
                            <button
                              key={server.id}
                              type="button"
                              onClick={() => setSelectedServer(server.id)}
                              className={`px-3 py-1 rounded-md border text-sm transition-colors ${
                                selectedServer === server.id
                                  ? "border-sky-500 bg-sky-900 text-white"
                                  : "border-gray-700 bg-gray-800 text-gray-300 hover:border-sky-700"
                              }`}
                            >
                              {server.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  }
                  return null
                })()}

                <div className="p-3 bg-blue-900/20 border border-blue-800/30 rounded-lg text-xs text-blue-300">
                  <div className="flex gap-2">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>
                      If a provider doesn't work, try another one. Different providers may have different content
                      availability.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="general" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="omdb-api-key" className="text-white">
                    OMDB API Key
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="omdb-api-key"
                      value={omdbApiKey}
                      onChange={(e) => setOmdbApiKey(e.target.value)}
                      placeholder="Enter your OMDB API key"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <Button
                      type="button"
                      className="bg-sky-600 hover:bg-sky-700 text-white"
                      onClick={handleSaveOmdb}
                    >
                      Save
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400">
                    Get a free API key at{" "}
                    <a
                      href="https://www.omdbapi.com/apikey.aspx"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:underline"
                    >
                      omdbapi.com
                    </a>
                  </p>
                </div>

                <div className="p-3 bg-blue-900/20 border border-blue-800/30 rounded-lg text-xs text-blue-300">
                  <div className="flex gap-2">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>
                      OMDB API provides movie information and posters. Without it, you'll need to download the database
                      for basic functionality.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="sticky bottom-0 flex justify-end p-4 bg-gray-800 border-t border-gray-700">
          <Button onClick={onClose} className="bg-sky-600 hover:bg-sky-700 text-white">
            <Check size={16} className="mr-2" />
            Save & Close
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
