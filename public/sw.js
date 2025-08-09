// Service Worker for CORS bypass

self.addEventListener("install", (event) => {
  // Skip waiting to activate immediately
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  // Claim clients to control all pages immediately
  event.waitUntil(clients.claim())
})

// Handle fetch requests from the page
self.addEventListener("message", async (event) => {
  if (event.data.type === "FETCH") {
    try {
      const { url, headers } = event.data

      // Perform the fetch with the provided headers
      const response = await fetch(url, {
        headers,
        mode: "cors",
        credentials: "omit",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Get the response as JSON
      const data = await response.json()

      // Send the data back to the page
      event.ports[0].postMessage(data)
    } catch (error) {
      // Send the error back to the page
      event.ports[0].postMessage({
        error: error.message || "Unknown error",
      })
    }
  }
})

// Handle fetch events (not used for CORS bypass but required for service worker)
self.addEventListener("fetch", (event) => {
  // Just pass through to the network
  event.respondWith(fetch(event.request))
})
