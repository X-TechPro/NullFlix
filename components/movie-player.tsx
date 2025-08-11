"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { X } from "lucide-react"
import { getProviderUrl } from "@/services/movie-service"

interface MoviePlayerProps {
  mediaId: string
  mediaType: "movie" | "tv"
  season?: number
  episode?: number
  title?: string
  onClose: () => void
}

export default function MoviePlayer({ mediaId, mediaType, season, episode, title, onClose }: MoviePlayerProps) {
  const [embedUrl, setEmbedUrl] = useState("");
  const [provider, setProvider] = useState<string | null>(null);

  useEffect(() => {
    // Get provider from localStorage (sync with getProviderUrl logic)
    let prov: string | null = null;
    try {
      prov = localStorage.getItem("selectedProvider");
    } catch (e) {
      prov = null;
    }
    setProvider(prov || "videasy");
    setEmbedUrl(getProviderUrl(mediaId, mediaType, season, episode, title));
  }, [mediaId, mediaType, season, episode, title]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-5xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl movie-player-container"
      >
        <button
          onClick={onClose}
          className="absolute z-10 p-2 text-white bg-black/50 rounded-full top-4 right-4 hover:bg-black/80"
        >
          <X size={20} />
        </button>

        {embedUrl && (
          <iframe
            src={embedUrl}
            className="w-full h-full border-0"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            {...(
              ["videasy", "vidrock"].includes(provider ?? "")
                ? { sandbox: "allow-scripts allow-same-origin allow-forms" }
                : {}
            )}
          ></iframe>
        )}
      </motion.div>
    </div>
  );
}
