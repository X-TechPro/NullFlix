"use client"

import { useState, useEffect, useRef } from "react"
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
  // Snayer popup states
  const [showScrapePopup, setShowScrapePopup] = useState(false);
  const [scrapeProgress, setScrapeProgress] = useState(0);
  const [scrapeStatus, setScrapeStatus] = useState<'processing' | 'complete' | 'failed'>('processing');
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const checkRef = useRef<number | null>(null);
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    // Get provider from localStorage (sync with getProviderUrl logic)
    let prov: string | null = null;
    try {
      prov = localStorage.getItem("selectedProvider");
    } catch (e) {
      prov = null;
    }
    const resolved = prov || "videasy";
    setProvider(resolved);
    setEmbedUrl(getProviderUrl(mediaId, mediaType, season, episode, title));
  }, [mediaId, mediaType, season, episode, title]);

  // Start/stop scraping popup when provider is snayer
  useEffect(() => {
    // Only show for snayer
    if (provider === 'snayer') {
      // initialize
      setShowScrapePopup(true);
      setScrapeProgress(0);
      setScrapeStatus('processing');

      // progress interval ~ every 3s increase by 12 until 100
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
      intervalRef.current = window.setInterval(() => {
        setScrapeProgress((p) => {
          const np = Math.min(100, p + 12);
          if (np >= 100 && intervalRef.current) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
            // mark complete locally — actual completion will wait for iframe onLoad
            setScrapeStatus('complete');
          }
          return np;
        });
      }, 3000) as unknown as number;

      // timeout -> mark failed
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        // If iframe didn't call onLoad within timeout, mark failed
        setScrapeStatus('failed');
        if (intervalRef.current) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        if (checkRef.current) {
          window.clearInterval(checkRef.current);
          checkRef.current = null;
        }
      }, 35000) as unknown as number;

      // start periodic fetch check every 5s to detect JSON error or page readiness
      if (checkRef.current) {
        window.clearInterval(checkRef.current);
      }
      checkRef.current = window.setInterval(async () => {
        try {
          // attempt to fetch the embed URL; some endpoints return JSON with error
          const res = await fetch(embedUrl, { cache: 'no-store' });
          const ct = res.headers.get('content-type') || '';
          if (ct.includes('application/json')) {
            const json = await res.json();
            if (json && json.error === 'Failed to retrieve showbox JSON') {
              // explicit error from backend -> failed
              setScrapeStatus('failed');
              if (intervalRef.current) {
                window.clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
              if (timeoutRef.current) {
                window.clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
              }
              if (checkRef.current) {
                window.clearInterval(checkRef.current);
                checkRef.current = null;
              }
            }
          } else if (res.ok) {
            // non-json ok response likely means page/html is ready -> complete
            setScrapeStatus('complete');
            setScrapeProgress(100);
            if (intervalRef.current) {
              window.clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            if (timeoutRef.current) {
              window.clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            if (checkRef.current) {
              window.clearInterval(checkRef.current);
              checkRef.current = null;
            }
            // hide after short delay for UX
            window.setTimeout(() => setShowScrapePopup(false), 800);
          }
        } catch (e) {
          // network error — ignore and retry on next tick
        }
      }, 5000) as unknown as number;
    } else {
      // ensure popup hidden for other providers
      setShowScrapePopup(false);
      setScrapeProgress(0);
      setScrapeStatus('processing');
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (checkRef.current) {
        window.clearInterval(checkRef.current);
        checkRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (checkRef.current) {
        window.clearInterval(checkRef.current);
        checkRef.current = null;
      }
    };
  }, [provider, embedUrl]);

  // Retry handler reloads iframe and restarts progress
  function handleRetry() {
    // bump key to force iframe reload
    setIframeKey((k) => k + 1);
    setScrapeProgress(0);
    setScrapeStatus('processing');
    setShowScrapePopup(true);

    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    intervalRef.current = window.setInterval(() => {
      setScrapeProgress((p) => {
        const np = Math.min(100, p + 12);
        if (np >= 100 && intervalRef.current) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
          setScrapeStatus('complete');
        }
        return np;
      });
    }, 2000) as unknown as number;

    timeoutRef.current = window.setTimeout(() => {
      setScrapeStatus('failed');
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (checkRef.current) {
        window.clearInterval(checkRef.current);
        checkRef.current = null;
      }
    }, 35000) as unknown as number;

    // start periodic fetch check every 5s to detect JSON error or page readiness
    if (checkRef.current) {
      window.clearInterval(checkRef.current);
    }
    checkRef.current = window.setInterval(async () => {
      try {
        const res = await fetch(embedUrl, { cache: 'no-store' });
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const json = await res.json();
          if (json && json.error === 'Failed to retrieve showbox JSON') {
            setScrapeStatus('failed');
            if (intervalRef.current) {
              window.clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            if (timeoutRef.current) {
              window.clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            if (checkRef.current) {
              window.clearInterval(checkRef.current);
              checkRef.current = null;
            }
          }
        } else if (res.ok) {
          setScrapeStatus('complete');
          setScrapeProgress(100);
          if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          if (checkRef.current) {
            window.clearInterval(checkRef.current);
            checkRef.current = null;
          }
          window.setTimeout(() => setShowScrapePopup(false), 800);
        }
      } catch (e) {
        // ignore and retry
      }
    }, 5000) as unknown as number;
  }

  // iframe load handler
  function handleIframeLoad() {
    // If we previously timed out and marked failed, keep failed. Otherwise mark complete and hide popup.
    if (scrapeStatus === 'failed') return;
    setScrapeStatus('complete');
    setScrapeProgress(100);
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // allow a short delay for UX then hide
    window.setTimeout(() => {
      setShowScrapePopup(false);
    }, 800);
  }

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
            key={iframeKey}
            src={embedUrl}
            className="w-full h-full border-0"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            onLoad={handleIframeLoad}
            {...(
              ["vidrock"].includes(provider ?? "")
                ? { sandbox: "allow-scripts allow-same-origin allow-forms" }
                : {}
            )}
          ></iframe>
        )}

        {/* Snayer scraping popup - only show for snayer provider */}
        {provider === 'snayer' && showScrapePopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-gradient-to-br from-black to-gray-900 shadow-2xl transition-all duration-500 hover:shadow-[0_0_50px_rgba(0,153,255,0.15)] flex flex-col p-0">
              <div className="absolute inset-0 bg-gradient-to-br from-[#0099ff]/5 via-transparent to-purple-500/5"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,153,255,0.1),transparent_50%)]"></div>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-[#0099ff]/20 to-transparent p-px">
                <div className="h-full w-full rounded-2xl bg-gradient-to-br from-black to-gray-900"></div>
              </div>

              <div className="relative p-8 pb-6 flex-shrink-0">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="bg-gradient-to-r from-[#0099ff] to-cyan-400 bg-clip-text text-2xl font-bold text-transparent tracking-wide">Scraping ShowBox</h2>
                  <div className={`rounded-full px-3 py-1 text-sm font-medium backdrop-blur-sm ${scrapeStatus === 'complete' ? 'text-green-500' : scrapeStatus === 'failed' ? 'text-red-500' : 'text-[#0099ff]'}`}> 
                    {scrapeStatus === 'processing' ? 'Processing' : scrapeStatus === 'complete' ? 'Complete' : 'Failed'}
                  </div>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent shadow-sm"></div>
              </div>

              <div className="relative flex-1 px-8 pb-8">
                <div className="flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0099ff] to-cyan-400 flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="9" y1="3" x2="9" y2="21"></line>
                    </svg>
                  </div>

                  <h3 className="text-xl font-bold text-[#0099ff] mb-2">ShowBox</h3>

                  <div className={`flex items-center gap-2 rounded-full px-4 py-2 mb-6 ${scrapeStatus === 'failed' ? 'bg-red-500/10 text-red-600' : scrapeStatus === 'complete' ? 'bg-green-500/10 text-green-600' : 'bg-[#0099ff]/10 text-[#0099ff]'}`}>
                    {scrapeStatus === 'processing' && (
                      <svg className="h-4 w-4 animate-spin text-[#0099ff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                    )}
                    <span className="text-sm font-medium">{scrapeStatus === 'processing' ? 'Processing' : scrapeStatus === 'complete' ? 'Complete' : 'Failed'}</span>
                  </div>

                  <div className="w-full mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Scraping progress</span>
                      <span className="text-sm font-medium text-[#0099ff]">{Math.round(scrapeProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-700/50 rounded-full h-2.5">
                      <div className="bg-gradient-to-r from-[#0099ff] to-cyan-400 h-2.5 rounded-full transition-all duration-500" style={{ width: `${scrapeProgress}%` }} />
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 text-center mt-6">Please wait 20-30 seconds. If unsuccessful, please try again as the scraper can sometimes experience issues.</p>

                  {scrapeStatus === 'failed' && (
                    <div className="mt-6">
                      <button onClick={handleRetry} className="px-4 py-2 bg-[#0099ff]/20 hover:bg-[#0099ff]/30 text-[#0099ff] rounded-lg transition-colors">Retry Now</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
