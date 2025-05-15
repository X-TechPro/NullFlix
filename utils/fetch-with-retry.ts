/**
 * Utility for making fetch requests with retry capabilities
 */

interface FetchWithRetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  backoffFactor?: number
  retryStatusCodes?: number[]
  timeout?: number
  headers?: Record<string, string>
  onRetry?: (attempt: number, delay: number, error?: Error) => void
}

export async function fetchWithRetry<T>(url: string, options: FetchWithRetryOptions = {}): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryStatusCodes = [408, 429, 500, 502, 503, 504, 403],
    timeout = 30000,
    headers = {},
    onRetry = () => {},
  } = options

  let attempt = 0
  let delay = initialDelay

  // Add default headers
  const defaultHeaders = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    Accept: "application/json",
    "Cache-Control": "no-cache",
    ...headers,
  }

  // Try different user agents on retries
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
  ]

  while (attempt <= maxRetries) {
    try {
      // Create AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      // On retries, rotate through different user agents
      if (attempt > 0) {
        defaultHeaders["User-Agent"] = userAgents[attempt % userAgents.length]
      }

      const response = await fetch(url, {
        headers: defaultHeaders,
        signal: controller.signal,
      })

      // Clear timeout
      clearTimeout(timeoutId)

      // Check if response is ok or if we should retry based on status code
      if (response.ok) {
        return (await response.json()) as T
      } else if (retryStatusCodes.includes(response.status) && attempt < maxRetries) {
        // Log the error and retry
        const errorMessage = `Request failed with status ${response.status}: ${response.statusText}`
        console.warn(`Attempt ${attempt + 1}/${maxRetries}: ${errorMessage}`)

        // Call onRetry callback
        onRetry(attempt + 1, delay)

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay))

        // Increase delay with exponential backoff, but cap it
        delay = Math.min(delay * backoffFactor, maxDelay)
        attempt++
        continue
      } else {
        // Non-retryable status code
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`)
      }
    } catch (error) {
      // Handle network errors, timeouts, and aborts
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          console.warn(`Attempt ${attempt + 1}/${maxRetries}: Request timed out after ${timeout}ms`)
        } else {
          console.warn(`Attempt ${attempt + 1}/${maxRetries}: ${error.message}`)
        }

        // If we've reached max retries, throw the error
        if (attempt >= maxRetries) {
          throw error
        }

        // Call onRetry callback
        onRetry(attempt + 1, delay, error)

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay))

        // Increase delay with exponential backoff, but cap it
        delay = Math.min(delay * backoffFactor, maxDelay)
        attempt++
      } else {
        // Unknown error type, just throw it
        throw error
      }
    }
  }

  // This should never be reached due to the throw in the loop,
  // but TypeScript needs it for type safety
  throw new Error("Maximum retries exceeded")
}

/**
 * Utility to try multiple URLs in sequence until one succeeds
 */
export async function fetchWithFallbacks<T>(urls: string[], options: FetchWithRetryOptions = {}): Promise<T> {
  let lastError: Error | null = null

  for (let i = 0; i < urls.length; i++) {
    try {
      return await fetchWithRetry<T>(urls[i], options)
    } catch (error) {
      console.warn(`Fallback ${i + 1}/${urls.length} failed:`, error)
      lastError = error instanceof Error ? error : new Error(String(error))

      // If this isn't the last URL, continue to the next one
      if (i < urls.length - 1) {
        console.info(`Trying next fallback URL: ${urls[i + 1]}`)
      }
    }
  }

  // If we've tried all URLs and none worked, throw the last error
  throw lastError || new Error("All fallback URLs failed")
}
