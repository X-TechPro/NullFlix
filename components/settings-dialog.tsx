"use client"

// Set default TMDB API key for first-time users on page load
if (typeof window !== "undefined") {
  if (!localStorage.getItem("tmdbApiKey")) {
    localStorage.setItem("tmdbApiKey", "YOUR_TMDB_API_KEY")
  }
  if (!localStorage.getItem("bioapi")) {
    localStorage.setItem("bioapi", "2SOcK4TddDM1mqEbacc7db55c60d542e17a65e2f19de8f8af")
  }
}

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
  const [tmdbApiKey, setTmdbApiKey] = useState("")
  const [bioApiKey, setBioApiKey] = useState("")
  const [selectedProvider, setSelectedProvider] = useState<string>(
    typeof window !== "undefined" && localStorage.getItem("selectedProvider")
      ? localStorage.getItem("selectedProvider") as string
      : "pstream"
  )
  const [selectedServer, setSelectedServer] = useState<string>(
    typeof window !== "undefined" && localStorage.getItem("selectedServer")
      ? localStorage.getItem("selectedServer") as string
      : ""
  )
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [downloadStatus, setDownloadStatus] = useState("")
  const [hasDatabase, setHasDatabase] = useState(false)
  const [hasTVDatabase, setHasTVDatabase] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  // Provider dictionary
  const providers = [
    {
      id: "snayer",
      name: "Snayer",
      url: "https://snayer.vercel.app/",
      description: "Clean and open source scraper (Recommended)",
    },
    {
      id: "pstream",
      name: "P-Stream",
      url: "https://pstream.org/",
      description: "Best 🔥 (Recommended)",
    },
    {
      id: "uembed",
      name: "UEmbed",
      url: "https://uembed.site/",
      description: "Good 🔥",
    },
    {
      id: "vidsrc.co",
      name: "Vidsrc.co",
      url: "https://vidsrc.co/",
      description: "Good 👍",
    },
    {
      id: "vidfast",
      name: "VidFast",
      url: "https://vidfast.pro/",
      description: "Fast and modern UI 👍",
    },
    {
      id: "spenembed",
      name: "SpenEmbed",
      url: "https://spencerdevs.xyz/",
      description: "Slick UI",
    },
    {
      id: "vidora",
      name: "Vidora",
      url: "https://vidora.su/",
      description: "Slick UI",
    },
    {
      id: "embed.su",
      name: "Embed.su",
      url: "https://embed.su/",
      description: "Good",
    },
    {
      id: "vidsrc.cc",
      name: "Vidsrc.cc",
      url: "https://vidsrc.cc/",
      description: "Good 👍",
    },
    {
      id: "autoembed",
      name: "Autoembed",
      url: "https://autoembed.cc/",
      description: "Good 👍",
    },
    {
      id: "2embed",
      name: "2Embed",
      url: "https://2embed.cc/",
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
      url: "https://vidsrc.xyz/",
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
      id: "vidsrc.su",
      name: "Vidsrc.su",
      url: "https://vidsrc.su/",
      description: "Worst provider. Doesn't work for now.",
    },
  ]

  // Load settings from localStorage on component mount
  useEffect(() => {
    try {
      const savedTmdbApiKey = localStorage.getItem("tmdbApiKey")
      if (savedTmdbApiKey !== null) {
        setTmdbApiKey(savedTmdbApiKey)
      }

      const savedProvider = localStorage.getItem("selectedProvider")
      if (savedProvider) {
        setSelectedProvider(savedProvider)
      }

      const savedServer = localStorage.getItem("selectedServer")
      if (savedServer) {
        setSelectedServer(savedServer)
      }

      const savedBioApiKey = localStorage.getItem("bioapi")
      if (savedBioApiKey !== null) {
        setBioApiKey(savedBioApiKey)
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

  // Save TMDB settings manually
  const handleSaveTmdb = () => {
    try {
      localStorage.setItem("tmdbApiKey", tmdbApiKey)
    } catch (e) {
      console.error("Error saving TMDB settings:", e)
    }
  }

  const handleSaveBioApi = () => {
    try {
      localStorage.setItem("bioapi", bioApiKey)
    } catch (e) {
      console.error("Error saving Browserless.io API key:", e)
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
              <TabsTrigger value="settings" className="flex-1 data-[state=active]:bg-sky-600">
                Settings
              </TabsTrigger>
              <TabsTrigger value="about" className="flex-1 data-[state=active]:bg-sky-600">
                About
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

            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tmdb-api-key" className="text-white">
                    TMDB API Key
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="tmdb-api-key"
                      value={tmdbApiKey}
                      onChange={(e) => setTmdbApiKey(e.target.value)}
                      placeholder="Enter your TMDB API key"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <Button
                      type="button"
                      className="bg-sky-600 hover:bg-sky-700 text-white"
                      onClick={handleSaveTmdb}
                    >
                      Save
                    </Button>
                  </div>
                  <div className="p-3 bg-blue-900/20 border border-blue-800/30 rounded-lg text-xs text-blue-300 mb-2">
                    <div className="flex gap-2">
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <p>
                        TMDB API provides movie information and posters. Without it, the site won't work.
                        You get 1000 free requests per day.
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    Get a free API key at{" "}
                    <a
                      href="https://www.themoviedb.org/settings/api"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:underline"
                    >
                      themoviedb.org
                    </a>
                  </p>
                  <hr className="my-2 border-gray-700" />
                  <div className="space-y-2">
                    <Label htmlFor="browserless-api-key" className="text-white">
                      Browserless.io API Key
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="browserless-api-key"
                        value={bioApiKey}
                        onChange={e => setBioApiKey(e.target.value)}
                        placeholder="Enter your Browserless.io API key"
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                      <Button
                        type="button"
                        className="bg-sky-600 hover:bg-sky-700 text-white"
                        onClick={handleSaveBioApi}
                      >
                        Save
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400">
                      Get a free API key at{" "}
                      <a
                        href="https://www.browserless.io/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-400 hover:underline"
                      >
                        browserless.io
                      </a>
                    </p>
                    <div className="p-3 bg-blue-900/20 border border-blue-800/30 rounded-lg text-xs text-blue-300 mt-2">
                      <div className="flex gap-2">
                        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <p>
                          Browserless.io API is used for advanced scraping (Snayer). Without it, some features may be limited or unavailable.
                          You have 1000 free API calls per month. If you run out, you can switch providers.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="about" className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">About NullFlix</h3>
                <p className="text-gray-300 text-sm">
                  NullFlix is a free and open source movie streaming platform designed for simplicity and accessibility.<br />
                  Built with Next.js and Tailwind CSS.<br />
                  <br />
                  <b>NullFlix's Repo:</b> <a href="https://github.com/X-TechPro/NullFlix" className="text-sky-400 hover:underline">https://github.com/X-TechPro/NullFlix</a><br />
                  <b>Snayer's Repo:</b> <a href="https://github.com/X-TechPro/snayer" className="text-sky-400 hover:underline">https://github.com/X-TechPro/snayer</a><br />
                  <b>Telegram:</b> <a href="https://t.me/nullflix" className="text-sky-400 hover:underline">https://t.me/nullflix</a>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  &copy; {new Date().getFullYear()} NullFlix. This project is for educational/demo purposes only.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="sticky bottom-0 flex justify-end p-4 bg-gray-800 border-t border-gray-700">
          <Button onClick={onClose} className="bg-sky-600 hover:bg-sky-700 text-white">
            <Check size={16} className="mr-2" />
            Close
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
