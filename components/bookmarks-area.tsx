"use client"

import { motion } from "framer-motion"
import { ArrowLeft, Film, Bookmark, Tv } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

interface BookmarksAreaProps {
  bookmarks: any[]
  toggleBookmark: (media: any) => void
  isBookmarked: (id: string, tmdbId?: number) => boolean
  onMediaSelect: (media: any) => void
  onBack: () => void // New prop for handling back navigation
}

export default function BookmarksArea({
  bookmarks,
  toggleBookmark,
  isBookmarked,
  onMediaSelect,
  onBack,
}: BookmarksAreaProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="py-8"
    >
      <Button
        variant="ghost"
        className="mb-6 text-[color:var(--theme-secondary-lighter)] hover:text-white hover:bg-[color:var(--theme-hover)]"
        onClick={onBack} // Use the onBack prop instead of reloading
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to search
      </Button>

      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-2 mb-6"
      >
        <Bookmark className="w-5 h-5 text-[color:var(--theme-primary-light)]" />
        <h2 className="text-2xl font-bold text-white">Your Bookmarks</h2>
      </motion.div>

      {bookmarks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="p-12 text-center"
        >
          <p className="text-[color:var(--theme-secondary-lighter)]">You haven't bookmarked any media yet.</p>
          <p className="mt-2 text-[color:var(--theme-secondary-lighter)]">
            Search for movies or TV shows and click the bookmark icon to save them here.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {bookmarks.map((item, index) => (
            <motion.div
              key={item.id || item.imdbID || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden bg-gray-800/80 border-gray-700/30 backdrop-blur-md hover:shadow-lg hover:shadow-[color:var(--theme-shadow)] transition-all duration-300 group relative">
                <div
                  className="relative aspect-[2/3] w-full overflow-hidden cursor-pointer"
                  onClick={() => onMediaSelect(item)}
                >
                  {((item.poster)) ? (
                    <Image
                      src={item.poster}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      unoptimized
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-blue-900/40 to-sky-900/40">
                      {item.type === "tv" || item.mediaType === "tv" ? (
                        <Tv className="w-16 h-16 text-[color:var(--theme-secondary-lighter)]" />
                      ) : (
                        <Film className="w-16 h-16 text-[color:var(--theme-secondary-lighter)]" />
                      )}
                    </div>
                  )}
                  <motion.button
                    className="absolute top-2 right-2 p-2 rounded-full bg-[color:var(--theme-primary)] text-white transition-colors duration-300"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleBookmark(item)
                    }}
                    whileHover={{ scale: 1.1, boxShadow: "0 0 8px var(--theme-primary)" }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Bookmark className="w-4 h-4" fill="currentColor" />
                  </motion.button>
                </div>
                <CardContent className="p-4 cursor-pointer" onClick={() => onMediaSelect(item)}>
                  <h3 className="text-lg font-medium text-white line-clamp-1">{item.title || item.Title}</h3>
                  <p className="text-sm text-[color:var(--theme-secondary-lighter)]">{item.year || item.Year}</p>
                  <div className="flex items-center mt-2">
                    <span
                      className={`px-2 py-1 text-xs ${
                        item.type === "tv" || item.mediaType === "tv"
                          ? "text-[color:var(--theme-secondary-light)] bg-black/50 border border-slate-700"
                          : "text-[color:var(--theme-secondary-light)] bg-black/50 border border-slate-700"
                      } rounded-full`}
                    >
                      {item.type === "tv" || item.mediaType === "tv" ? "TV Series" : item.Type || "Movie"}
                    </span>

                    {/* Show TMDB ID information */}
                    {(item.tmdbID || item.tmdb || item.tmdbId) && (
                      <span className="px-2 py-1 text-xs text-[color:var(--theme-secondary-light)] bg-black/50 border border-slate-700 rounded-full ml-2">
                        TMDB: {item.tmdbID || item.tmdb || item.tmdbId}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
