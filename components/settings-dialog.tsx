"use client"

// Set default TMDB API key for first-time users on page load
if (typeof window !== "undefined") {
  if (!localStorage.getItem("tmdbApiKey")) {
    localStorage.setItem("tmdbApiKey", "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2ZWFjNjM1ODA4YmRjMDJkZjI2ZDMwMjk0MGI0Y2EzNyIsIm5iZiI6MTc0ODY4NTIxNy43Mjg5OTk5LCJzdWIiOiI2ODNhZDFhMTkyMWI4N2IxYzk1Mzc4ODQiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.w-oWdRIxwlXKTpP42Yo87Mld5sqp8uNFpDHgrqB6a3U")
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
import { ThemeProvider as ThemeColorProvider, useThemeColor, THEME_COLORS_META } from "@/components/theme-color-context"
import type { ThemeColor } from "@/components/theme-color-context"
import { url } from "inspector"

interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const { theme, setTheme } = useThemeColor()
  const [activeTab, setActiveTab] = useState("providers")
  const [tmdbApiKey, setTmdbApiKey] = useState("")
  const [bioApiKey, setBioApiKey] = useState("")
  const [selectedProvider, setSelectedProvider] = useState<string>(
    typeof window !== "undefined" && localStorage.getItem("selectedProvider")
      ? localStorage.getItem("selectedProvider") as string
      : "videasy"
  )
  const [selectedServer, setSelectedServer] = useState<string>(
    typeof window !== "undefined" && localStorage.getItem("selectedServer")
      ? localStorage.getItem("selectedServer") as string
      : ""
  )
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [downloadStatus, setDownloadStatus] = useState("")
  const [enableDiscover, setEnableDiscover] = useState<boolean>(
    typeof window !== "undefined" && localStorage.getItem("enableDiscover") === "true"
  )
  const [discoverEnabled, setDiscoverEnabled] = useState(
    typeof window !== "undefined" && localStorage.getItem("discover") === "true"
  )

  // Provider dictionary
  const providers = [
    {
      id: "snayer",
      name: "Snayer - Showbox",
      url: "https://snayer.vercel.app/",
      description: "Elite player (BETA) 🔥",
    },
    {
      id: "videasy",
      name: "VidEasy",
      url: "https://videasy.net/",
      description: "🥇 Good quality 🔥",
    },
    {
      id: "vidfast",
      name: "VidFast",
      url: "https://vidfast.pro/",
      description: "🥈 Modern UI 👍",
    },
    {
      id: "vidrock",
      name: "VidRock",
      url: "https://vidrock.net/",
      description: "🥉 Modern UI 👍",
    },
    {
      id: "pstream",
      name: "P-Stream",
      url: "https://pstream.mov/",
      description: "Best 🔥",
    },
    {
      id: "vidking",
      name: "VidKing",
      url: "https://vidking.net/",
      description: "Modern UI 👍",
    },
    {
      id: "uembed",
      name: "UEmbed",
      url: "https://uembed.xyz/",
      description: "Good 🔥",
    },
    {
      id: "vidplus",
      name: "VidPlus",
      url: "https://vidplus.to/",
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
      id: "vidsrc-embed.ru",
      name: "Vidsrc-Embed.Ru",
      url: "https://vidsrc-embed.ru/",
      description: "Multiple servers available",
      hasServers: true,
      servers: [
        { id: "vidsrc-embed.ru", name: "vidsrc-embed.ru" },
        { id: "vidsrc-embed.su", name: "vidsrc-embed.su" },
        { id: "vidsrcme.su", name: "vidsrcme.su" },
        { id: "vsrc.su", name: "vsrc.su" },
      ],
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

      const savedEnableDiscover = localStorage.getItem("enableDiscover")
      if (savedEnableDiscover !== null) {
        setEnableDiscover(savedEnableDiscover === "true")
      }

      const savedTheme = localStorage.getItem("theme")
      if (savedTheme) {
        setTheme(savedTheme as ThemeColor)
      }
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

  const handleToggleDiscover = (checked: boolean) => {
    setDiscoverEnabled(checked)
    if (typeof window !== "undefined") {
      localStorage.setItem("discover", checked ? "true" : "false")
      window.dispatchEvent(new Event("storage")) // trigger update in other tabs/components
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
            <Settings2 className="w-5 h-5 text-[color:var(--theme-primary-light)]" />
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
              <TabsTrigger value="providers" className="flex-1 data-[state=active]:bg-[color:var(--theme-primary)] data-[state=active]:text-white">
                Providers
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex-1 data-[state=active]:bg-[color:var(--theme-primary)] data-[state=active]:text-white">
                Settings
              </TabsTrigger>
              <TabsTrigger value="about" className="flex-1 data-[state=active]:bg-[color:var(--theme-primary)] data-[state=active]:text-white">
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
                        className={`w-full text-left rounded-lg border p-3 transition-colors ${selectedProvider === provider.id
                          ? "border-[color:var(--theme-primary-light)] bg-[color:var(--theme-container-bg-on)]"
                          : "border-gray-700 bg-gray-800 hover:border-[color:var(--theme-button-hover)]"
                          }`}
                      >
                        <div className="font-semibold text-white">{provider.name}</div>
                        <div className="text-xs text-[color:var(--theme-primary-light)] truncate">
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
                              className={`px-3 py-1 rounded-md border text-sm transition-colors ${selectedServer === server.id
                                ? "border-[color:var(--theme-primary-light)] bg-[color:var(--theme-container-bg-on)] text-white"
                                : "border-gray-700 bg-gray-800 text-gray-300 hover:border-[color:var(--theme-button-hover)]"
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

                <div className="p-3 bg-[color:var(--theme-note-bg)] border border-[color:var(--theme-note-border)] rounded-lg text-xs text-[color:var(--theme-primary-lighter)]">
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
                <div className="flex items-center justify-between p-3 bg-[color:var(--theme-note-bg)] border border-[color:var(--theme-note-border)] rounded-lg mb-4 text-[color:var(--theme-primary-lighter)]">
                  <Label className="text-white text-base font-medium">Enable Discover</Label>
                  <Switch checked={discoverEnabled} onCheckedChange={handleToggleDiscover} />
                </div>

                {/* Theme Selector */}
                <div className="space-y-2">
                  <Label className="text-white text-base font-medium">Theme Color</Label>
                  <div className="flex gap-3 flex-wrap">
                    {Object.entries(THEME_COLORS_META).map(([key, value]) => (
                      <button
                        key={key}
                        type="button"
                        aria-label={key}
                        onClick={() => setTheme(key as ThemeColor)}
                        className={`w-9 h-9 rounded-full border-4 flex items-center justify-center transition-all duration-200 focus:outline-none ${theme === key
                          ? 'border-[color:var(--theme-primary-dark)] scale-110 shadow-lg'
                          : ''
                          }`}
                        style={{
                          background: value['--theme-primary'],
                          borderColor: value['--theme-primary-light'],
                          opacity: theme === key ? 1 : 0.8,
                          transform: theme === key ? 'scale(1.1)' : 'scale(1)',
                        }}
                      >
                        {theme === key && (
                          <Check className="text-white" size={20} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

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
                      className="bg-[color:var(--theme-primary)] hover:bg-[color:var(--theme-button-hover)] text-white"
                      onClick={handleSaveTmdb}
                    >
                      Save
                    </Button>
                  </div>
                  <div className="p-3 bg-[color:var(--theme-note-bg)] border border-[color:var(--theme-note-border)] rounded-lg text-xs text-[color:var(--theme-primary-lighter)] mb-2">
                    <div className="flex gap-2">
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <p>
                        TMDB API provides movie information and posters. Without it, the site won't work.
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    Get a free API key at{" "}
                    <a
                      href="https://www.themoviedb.org/settings/api"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[color:var(--theme-primary-light)] hover:underline"
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
                        className="bg-[color:var(--theme-primary)] hover:bg-[color:var(--theme-button-hover)] text-white"
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
                        className="text-[color:var(--theme-primary-light)] hover:underline"
                      >
                        browserless.io
                      </a>
                    </p>
                    <div className="p-3 bg-[color:var(--theme-note-bg)] border border-[color:var(--theme-note-border)] rounded-lg text-xs text-[color:var(--theme-primary-lighter)] mt-2">
                      <div className="flex gap-2">
                        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <p>
                          Browserless.io API is used for advanced scraping (Snayer). Without it, some features may be limited or unavailable.
                          You have 1000 free API calls per month. If you run out, you can switch providers.
                        </p>
                      </div>
                    </div>
                    <hr className="my-2 border-gray-700" />
                    {/* Obliterate Everything Button */}
                    <div className="mt-4">
                      <Button
                        type="button"
                        className="w-full bg-red-700 hover:bg-red-800 text-white flex items-center justify-center gap-2 border border-red-900 shadow-lg"
                        onClick={() => {
                          localStorage.clear()
                          window.location.reload()
                        }}
                      >
                        <span className="flex items-center">
                          <svg viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" className="w-6 h-6 mr-2" fill="none">
                            <g>
                              <path fill="#CCD6DD" d="M24.187 9.657l5.658-5.654L32 6.16l-5.658 5.655z" />
                              <circle fill="#31373D" cx="14" cy="22" r="14" />
                              <path fill="#31373D" d="M19 11.342l5.658-5.657l5.657 5.658L24.657 17z" />
                              <circle fill="#F18F26" cx="32" cy="4" r="4" />
                              <circle fill="#FDCB58" cx="32" cy="4" r="2" />
                            </g>
                          </svg>
                          Obliterate Everything
                        </span>
                      </Button>
                      <div className="p-3 bg-red-900/20 border border-red-800/50 rounded-lg text-xs text-red-300 mt-2 flex gap-2 items-start">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                        <p>
                          <b>Warning:</b> This will wipe <b>all your settings and bookmarks</b>.<br />
                          Only use this if you encounter bugs or want to reset everything.
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
                  <b>NullFlix's Repo:</b> <a href="https://github.com/X-TechPro/NullFlix" className="text-[color:var(--theme-primary-light)] hover:underline">https://github.com/X-TechPro/NullFlix</a><br />
                  <b>Snayer's Repo:</b> <a href="https://github.com/X-TechPro/snayer" className="text-[color:var(--theme-primary-light)] hover:underline">https://github.com/X-TechPro/snayer</a><br />
                  <b>Telegram:</b> <a href="https://t.me/nullflix" className="text-[color:var(--theme-primary-light)] hover:underline">https://t.me/nullflix</a>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  &copy; {new Date().getFullYear()} NullFlix. This project is for educational/demo purposes only.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="sticky bottom-0 flex justify-end p-4 bg-gray-800 border-t border-gray-700">
          <Button onClick={onClose} className="bg-[color:var(--theme-primary)] hover:bg-[color:var(--theme-button-hover)] text-white">
            <Check size={16} className="mr-2" />
            Close
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
