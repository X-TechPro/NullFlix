"use client"

// Set default TMDB API key for first-time users on page load
if (typeof window !== "undefined") {
  if (!localStorage.getItem("tmdbApiKey")) {
    localStorage.setItem("tmdbApiKey", "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2ZWFjNjM1ODA4YmRjMDJkZjI2ZDMwMjk0MGI0Y2EzNyIsIm5iZiI6MTc0ODY4NTIxNy43Mjg5OTk5LCJzdWIiOiI2ODNhZDFhMTkyMWI4N2IxYzk1Mzc4ODQiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.w-oWdRIxwlXKTpP42Yo87Mld5sqp8uNFpDHgrqB6a3U")
  }
  if (!localStorage.getItem("sdapi")) {
    localStorage.setItem("sdapi", "b62beb535a71454fa80fa5351da9088a12adfbb4a2f")
  }
}

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { X, Check, AlertTriangle, Info, Settings, Crown } from "lucide-react"
import { Label } from "@/components/ui/label"
import { ThemeProvider as ThemeColorProvider, useThemeColor, THEME_COLORS_META } from "@/components/theme-color-context"
import type { ThemeColor } from "@/components/theme-color-context"

interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
}

// Theme color mapping
const THEME_COLOR_VALUES: Record<string, string> = {
  sky: "#0ea5e9",
  blue: "#3b82f6",
  purple: "#a855f7",
  pink: "#ec4899",
  red: "#ef4444",
  orange: "#f97316",
  green: "#22c55e",
  teal: "#14b8a6",
  yellow: "#eab308",
}

export default function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const { theme, setTheme } = useThemeColor()
  const [activeTab, setActiveTab] = useState("providers")
  const [tmdbApiKey, setTmdbApiKey] = useState("")
  const [SDApiKey, setSDApiKey] = useState("")
  const [selectedProvider, setSelectedProvider] = useState<string>(
    typeof window !== "undefined" && localStorage.getItem("selectedProvider")
      ? localStorage.getItem("selectedProvider") as string
      : "veox"
  )
  const [selectedServer, setSelectedServer] = useState<string>(
    typeof window !== "undefined" && localStorage.getItem("selectedServer")
      ? localStorage.getItem("selectedServer") as string
      : ""
  )
  const [discoverEnabled, setDiscoverEnabled] = useState(
    typeof window !== "undefined" && localStorage.getItem("discover") === "true"
  )

  // Provider dictionary
  const providers = [
    {
      id: "veox",
      name: "Veox",
      url: "https://veox-self.vercel.app/",
      description: "Elite player 🔥",
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
      id: "snayer",
      name: "Snayer - Showbox [DEPRECATED]",
      url: "https://snayer.vercel.app/",
      description: "Elite player (BETA) 🔥",
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

      const savedSDApiKey = localStorage.getItem("sdapi")
      if (savedSDApiKey !== null) {
        setSDApiKey(savedSDApiKey)
      }

      const savedDiscover = localStorage.getItem("discover")
      if (savedDiscover !== null) {
        setDiscoverEnabled(savedDiscover === "true")
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

  const handleSaveSDApi = () => {
    try {
      localStorage.setItem("sdapi", SDApiKey)
    } catch (e) {
      console.error("Error saving Scrape.do API key:", e)
    }
  }

  const handleToggleDiscover = (checked: boolean) => {
    setDiscoverEnabled(checked)
    if (typeof window !== "undefined") {
      localStorage.setItem("discover", checked ? "true" : "false")
      window.dispatchEvent(new Event("storage"))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-2 md:p-4 bg-black/70 backdrop-blur-sm">
      <style jsx global>{`
        .settings-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .settings-scrollbar::-webkit-scrollbar-track {
          background: #1e293b;
          border-radius: 4px;
        }

        .settings-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 4px;
        }

        .settings-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-800 border border-slate-700 rounded-3xl overflow-hidden w-full max-w-2xl max-h-[95vh] md:max-h-[90vh] flex flex-col shadow-2xl relative"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 md:p-6 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 md:w-6 md:h-6 text-sky-400" />
            <h2 className="text-xl md:text-2xl font-bold text-white">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 transition-colors rounded-full hover:bg-slate-700 hover:text-white"
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1 settings-scrollbar">
          {/* Custom Tabs */}
          <div className="flex gap-1 mb-4 md:mb-6 bg-slate-700/50 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("providers")}
              className={`flex-1 py-2 px-3 md:px-4 rounded-lg text-sm md:text-base font-medium transition-all ${activeTab === "providers"
                ? "bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-md"
                : "text-slate-400 hover:text-white"
                }`}
            >
              Providers
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex-1 py-2 px-3 md:px-4 rounded-lg text-sm md:text-base font-medium transition-all ${activeTab === "settings"
                ? "bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-md"
                : "text-slate-400 hover:text-white"
                }`}
            >
              Settings
            </button>
            <button
              onClick={() => setActiveTab("about")}
              className={`flex-1 py-2 px-3 md:px-4 rounded-lg text-sm md:text-base font-medium transition-all ${activeTab === "about"
                ? "bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-md"
                : "text-slate-400 hover:text-white"
                }`}
            >
              About
            </button>
          </div>

          {/* Providers Tab */}
          {activeTab === "providers" && (
            <div className="space-y-4">
              <div className="space-y-3 md:space-y-4">
                <Label className="text-white text-base md:text-lg font-medium block mb-3">Video Provider</Label>
                <div className="flex flex-col gap-3">
                  {providers.map((provider) => (
                    <button
                      key={provider.id}
                      type="button"
                      onClick={() => {
                        setSelectedProvider(provider.id)
                        if (!provider.hasServers) setSelectedServer("")
                      }}
                      className={`relative w-full text-left rounded-xl border p-3 md:p-4 transition-all ${selectedProvider === provider.id
                        ? "border-sky-400 bg-slate-700/50"
                        : "border-slate-600 bg-slate-700/50 hover:border-sky-400"
                        }`}
                    >
                      <div className="pr-12">
                        <div className="font-semibold text-white text-sm md:text-base">{provider.name}</div>
                        <div className="text-xs text-sky-400 truncate">
                          <a href={provider.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {provider.url}
                          </a>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">{provider.description}</div>
                      </div>
                      {provider.id === "veox" && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <Crown
                            className="w-6 h-6 md:w-7 md:h-7 drop-shadow-md"
                            style={{ color: THEME_COLORS_META[theme as keyof typeof THEME_COLORS_META]?.['--theme-primary'] || '#0ea5e9' }}
                          />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Server selection for providers with servers */}
                {(() => {
                  const selected = providers.find((p) => p.id === selectedProvider)
                  if (selected && selected.hasServers && selected.servers) {
                    return (
                      <div className="mt-4">
                        <Label className="text-white text-base md:text-lg font-medium block mb-2">Server</Label>
                        <div className="flex flex-wrap gap-2">
                          {selected.servers.map((server: any) => (
                            <button
                              key={server.id}
                              type="button"
                              onClick={() => setSelectedServer(server.id)}
                              className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${selectedServer === server.id
                                ? "border-sky-400 bg-slate-700 text-white"
                                : "border-slate-600 bg-slate-700/50 text-slate-300 hover:border-sky-400"
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

                <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-xl text-xs text-sky-200 flex gap-2 items-start mt-4">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>
                    If a provider doesn't work, try another one. Different providers may have different content
                    availability.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-4">
              <div className="space-y-4">
                {/* Enable Discover Toggle */}
                <div className="flex items-center justify-between p-3 md:p-4 bg-sky-500/10 border border-sky-500/30 rounded-xl text-sky-200">
                  <Label className="text-white text-base md:text-lg font-medium">Enable Discover</Label>
                  <button
                    onClick={() => handleToggleDiscover(!discoverEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-slate-800 transition-colors ${discoverEnabled
                      ? "bg-gradient-to-r from-sky-500/30 to-blue-600/30 shadow-inner"
                      : "bg-slate-800/40"
                      }`}
                  >
                    <span
                      className={`pointer-events-none block h-5 w-5 rounded-full bg-blue-300 shadow-lg ring-0 transition-transform ${discoverEnabled ? "translate-x-5" : "translate-x-0"
                        }`}
                    />
                  </button>
                </div>

                {/* Theme Selector */}
                <div className="space-y-2">
                  <Label className="text-white text-base md:text-lg font-medium block">Theme Color</Label>
                  <div className="flex gap-3 flex-wrap">
                    {Object.entries(THEME_COLORS_META).map(([key, value]) => (
                      <button
                        key={key}
                        type="button"
                        aria-label={key}
                        onClick={() => setTheme(key as ThemeColor)}
                        className={`w-9 h-9 rounded-full border-4 flex items-center justify-center transition-all duration-200 focus:outline-none ${theme === key
                          ? "scale-110 shadow-lg"
                          : "opacity-80 hover:opacity-100"
                          }`}
                        style={{
                          background: value['--theme-primary'],
                          borderColor: theme === key ? '#0284c7' : value['--theme-primary-light'],
                        }}
                      >
                        {theme === key && (
                          <Check className="text-white" size={20} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* TMDB API Key */}
                <div className="space-y-2">
                  <Label htmlFor="tmdb-api-key" className="text-white text-base md:text-lg font-medium block">
                    TMDB API Key
                  </Label>
                  <div className="flex gap-2">
                    <input
                      id="tmdb-api-key"
                      value={tmdbApiKey}
                      onChange={(e) => setTmdbApiKey(e.target.value)}
                      placeholder="Enter your TMDB API key"
                      className="flex h-10 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 text-sm md:text-base"
                    />
                    <button
                      type="button"
                      onClick={handleSaveTmdb}
                      className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white font-medium shadow-lg transition-all duration-200 transform hover:scale-105 px-4 py-2 text-sm md:text-base"
                    >
                      Save
                    </button>
                  </div>
                  <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-xl text-xs text-sky-200 flex gap-2 items-start">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>
                      TMDB API provides movie information and posters. Without it, the site won't work.
                    </p>
                  </div>
                  <p className="text-xs text-slate-400">
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

                  <hr className="my-4 border-slate-700" />

                  {/* Scrape.do API Key */}
                  <div className="space-y-2">
                    <Label htmlFor="scrapedo-api-key" className="text-white text-base md:text-lg font-medium block">
                      Scrape.do API Key
                    </Label>
                    <div className="flex gap-2">
                      <input
                        id="scrapedo-api-key"
                        value={SDApiKey}
                        onChange={(e) => setSDApiKey(e.target.value)}
                        placeholder="Enter your Scrape.do API key"
                        className="flex h-10 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 text-sm md:text-base"
                      />
                      <button
                        type="button"
                        onClick={handleSaveSDApi}
                        className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white font-medium shadow-lg transition-all duration-200 transform hover:scale-105 px-4 py-2 text-sm md:text-base"
                      >
                        Save
                      </button>
                    </div>
                    <p className="text-xs text-slate-400">
                      Get a free API key at{" "}
                      <a
                        href="https://scrape.do/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-400 hover:underline"
                      >
                        scrape.do
                      </a>
                    </p>
                    <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-xl text-xs text-sky-200 flex gap-2 items-start mt-2">
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <p>
                        Scrape.do API is used for advanced scraping (Veox). Without it, some features may be limited or unavailable.
                        You have 1000 free API calls per month. If you run out, you can switch providers.
                      </p>
                    </div>

                    <hr className="my-4 border-slate-700" />

                    {/* Obliterate Everything Button */}
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          localStorage.clear()
                          window.location.reload()
                        }}
                        className="w-full bg-red-700 hover:bg-red-800 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 border border-red-900 shadow-lg transition-all duration-200"
                      >
                        <svg viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" className="w-6 h-6" fill="none">
                          <g>
                            <path fill="#CCD6DD" d="M24.187 9.657l5.658-5.654L32 6.16l-5.658 5.655z" />
                            <circle fill="#31373D" cx="14" cy="22" r="14" />
                            <path fill="#31373D" d="M19 11.342l5.658-5.657l5.657 5.658L24.657 17z" />
                            <circle fill="#F18F26" cx="32" cy="4" r="4" />
                            <circle fill="#FDCB58" cx="32" cy="4" r="2" />
                          </g>
                        </svg>
                        Obliterate Everything
                      </button>
                      <div className="p-3 bg-red-900/20 border border-red-800/50 rounded-xl text-xs text-red-300 mt-2 flex gap-2 items-start">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                        <p>
                          <strong>Warning:</strong> This will wipe <strong>all your settings and bookmarks</strong>.<br />
                          Only use this if you encounter bugs or want to reset everything.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* About Tab */}
          {activeTab === "about" && (
            <div className="space-y-3">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-white mb-2">About NullFlix</h3>
                <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                  NullFlix is a free and open source movie streaming platform designed for simplicity and accessibility.<br />
                  Built with Next.js and Tailwind CSS.
                </p>
                <div className="mt-4 space-y-1 text-sm text-slate-300">
                  <p>
                    <strong className="text-white">NullFlix's Repo:</strong>{" "}
                    <a
                      href="https://github.com/X-TechPro/NullFlix"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:underline"
                    >
                      https://github.com/X-TechPro/NullFlix
                    </a>
                  </p>
                  <p>
                    <strong className="text-white">Veox's Repo:</strong>{" "}
                    <a
                      href="https://github.com/X-TechPro/Veox"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:underline"
                    >
                      https://github.com/X-TechPro/Veox
                    </a>
                  </p>
                  <p>
                    <strong className="text-white">Telegram:</strong>{" "}
                    <a
                      href="https://t.me/nullflix"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:underline"
                    >
                      https://t.me/nullflix
                    </a>
                  </p>
                </div>
                <p className="text-xs text-slate-500 mt-4">
                  &copy; {new Date().getFullYear()} NullFlix. This project is for educational/demo purposes only.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex justify-end p-4 md:p-6 bg-slate-800 border-t border-slate-700">
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white font-medium shadow-lg transition-all duration-200 transform hover:scale-105 px-6 py-2 md:px-8 md:py-3 text-sm md:text-base"
          >
            <Check className="w-4 h-4 mr-2" />
            Close
          </button>
        </div>
      </motion.div>
    </div>
  )
}
