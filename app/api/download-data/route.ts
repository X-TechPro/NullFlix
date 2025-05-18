import { NextResponse } from "next/server"
import { exec } from "child_process"
import { readFile } from "fs/promises"
import axios from "axios"
import https from "https"
import fetch from "node-fetch"
import { promises as fs } from "fs"

// Base URL for all data
const BASE_URL = "https://embed.su/list"

// Alternative URLs to try if the primary one fails
const ALTERNATIVE_URLS = {
  movie: [
    "https://embed.su/list/movie.json",
    "https://raw.githubusercontent.com/movie-web/providers/main/movie.json",
    "https://gist.githubusercontent.com/anonymous/movie-database/raw/main/movie.json",
  ],
  tv: [
    "https://embed.su/list/tv.json",
    "https://raw.githubusercontent.com/movie-web/providers/main/tv.json",
    "https://gist.githubusercontent.com/anonymous/tv-database/raw/main/tv.json",
  ],
}

// Generate a unique request ID for tracing
const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

export async function GET(request: Request) {
  const requestId = generateRequestId()
  const startTime = Date.now()

  console.group(`📥 Data Download Request [${requestId}]`)
  console.log(`🕒 Started at: ${new Date(startTime).toISOString()}`)

  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type")
  const useWget = searchParams.get("useWget") === "true"

  console.log(`📋 Request params: type=${type}, useWget=${useWget}`)

  if (!type || (type !== "movie" && type !== "tv")) {
    console.error(`❌ Invalid type parameter: ${type}`)
    console.groupEnd()
    return NextResponse.json(
      {
        success: false,
        error: "Invalid type parameter. Must be 'movie' or 'tv'.",
      },
      { status: 400 },
    )
  }

  const url = `${BASE_URL}/${type}.json`
  const outputPath = `/tmp/${type}_${requestId}.json`
  const userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"

  console.log(`🔗 Target URL: ${url}`)

  // If user explicitly requested wget, use it directly
  if (useWget) {
    console.log(`🛠️ Using wget as explicitly requested`)

    // Try each alternative URL with wget
    const urlsToTry = ALTERNATIVE_URLS[type as keyof typeof ALTERNATIVE_URLS]

    for (let i = 0; i < urlsToTry.length; i++) {
      const currentUrl = urlsToTry[i]
      console.log(`🔄 Trying wget with URL ${i + 1}/${urlsToTry.length}: ${currentUrl}`)

      try {
        console.time(`wget execution for ${currentUrl}`)

        // Make sure the output directory exists
        try {
          await fs.access("/tmp")
        } catch (e) {
          console.log("Creating /tmp directory")
          await fs.mkdir("/tmp", { recursive: true })
        }

        // Use a more robust wget command
        const wgetCommand = `wget "${currentUrl}" -O "${outputPath}" --timeout=30 --tries=3 --retry-connrefused --no-check-certificate --user-agent="${userAgent}" -q`
        console.log(`📝 Executing: ${wgetCommand}`)

        await new Promise<void>((resolve, reject) => {
          exec(wgetCommand, (error, stdout, stderr) => {
            if (error) {
              console.error(`❌ wget error for ${currentUrl}:`, error)
              console.error(`stderr: ${stderr}`)
              reject(error)
            } else {
              console.log(`✅ wget download complete for ${currentUrl}`)
              if (stdout) console.log(`stdout: ${stdout}`)
              resolve()
            }
          })
        })

        console.timeEnd(`wget execution for ${currentUrl}`)

        // Check if the file exists and has content
        try {
          const stats = await fs.stat(outputPath)
          console.log(`📊 File size: ${stats.size} bytes`)

          if (stats.size === 0) {
            throw new Error("Downloaded file is empty")
          }

          // If wget succeeds, read the file
          const json = await readFile(outputPath, "utf-8")

          try {
            const data = JSON.parse(json)

            // Validate that we got an array
            if (!Array.isArray(data)) {
              throw new Error("Downloaded data is not an array")
            }

            console.log(`✅ Successfully parsed JSON with ${data.length} items`)

            const endTime = Date.now()
            console.log(`✅ Request completed successfully via wget in ${endTime - startTime}ms`)
            console.groupEnd()

            // Clean up the temp file
            fs.unlink(outputPath).catch((e) => console.error(`Failed to delete temp file: ${e}`))

            return NextResponse.json({ success: true, data })
          } catch (parseError) {
            console.error(`❌ Failed to parse JSON: ${parseError}`)
            console.log(`📝 First 200 chars of file: ${json.substring(0, 200)}`)
            throw parseError
          }
        } catch (fileError) {
          console.error(`❌ File error: ${fileError}`)
          throw fileError
        }
      } catch (error) {
        console.error(`❌ wget attempt ${i + 1} failed: ${error}`)
        // Continue to next URL
      }
    }

    console.error(`❌ All wget attempts failed`)
    console.groupEnd()

    return NextResponse.json(
      {
        success: false,
        error: "All wget download attempts failed. Please try again later.",
        requestId: requestId,
      },
      { status: 500 },
    )
  }

  // Method 1: Try axios first
  try {
    console.log(`🔄 Attempting fetch with axios...`)
    console.time("axios execution")

    const response = await axios.get(url, {
      headers: {
        "User-Agent": userAgent,
        Accept: "application/json",
      },
      timeout: 10000, // 10 second timeout
    })

    console.timeEnd("axios execution")

    if (response.status === 200 && response.data) {
      const dataLength = Array.isArray(response.data) ? response.data.length : "unknown"
      console.log(`✅ axios succeeded with status ${response.status}, data length: ${dataLength}`)

      const endTime = Date.now()
      console.log(`✅ Request completed successfully via axios in ${endTime - startTime}ms`)
      console.groupEnd()

      return NextResponse.json({ success: true, data: response.data })
    }

    console.log(`⚠️ axios returned status ${response.status} but no valid data`)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error(`❌ axios failed: ${errorMessage}`, error)
    // Continue to fallback method
  }

  // Method 2: Try https.get if axios fails
  try {
    console.log(`🔄 Attempting fetch with https.get...`)
    console.time("https.get execution")

    const data = await new Promise<any>((resolve, reject) => {
      https
        .get(
          url,
          {
            headers: {
              "User-Agent": userAgent,
              Accept: "application/json",
            },
            timeout: 10000,
          },
          (resp) => {
            console.log(`📊 https.get response status: ${resp.statusCode}`)

            if (resp.statusCode !== 200) {
              reject(new Error(`HTTP error! Status: ${resp.statusCode}`))
              return
            }

            let data = ""
            resp.on("data", (chunk) => (data += chunk))
            resp.on("end", () => {
              try {
                const jsonData = JSON.parse(data)
                resolve(jsonData)
              } catch (e) {
                reject(new Error("Invalid JSON received"))
              }
            })
          },
        )
        .on("error", (err) => {
          reject(err)
        })
        .on("timeout", () => {
          reject(new Error("Request timed out"))
        })
    })

    console.timeEnd("https.get execution")

    const dataLength = Array.isArray(data) ? data.length : "unknown"
    console.log(`✅ https.get succeeded, data length: ${dataLength}`)

    const endTime = Date.now()
    console.log(`✅ Request completed successfully via https.get in ${endTime - startTime}ms`)
    console.groupEnd()

    return NextResponse.json({ success: true, data })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error(`❌ https.get failed: ${errorMessage}`)
    // Continue to next fallback method
  }

  // Method 3: Try node-fetch if https.get fails
  try {
    console.log(`🔄 Attempting fetch with node-fetch...`)
    console.time("node-fetch execution")

    const response = await fetch(url, {
      headers: {
        "User-Agent": userAgent,
        Accept: "application/json",
      },
      timeout: 10000,
    })

    console.log(`📊 node-fetch response status: ${response.status}`)

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const data = await response.json()

    console.timeEnd("node-fetch execution")

    const dataLength = Array.isArray(data) ? data.length : "unknown"
    console.log(`✅ node-fetch succeeded, data length: ${dataLength}`)

    const endTime = Date.now()
    console.log(`✅ Request completed successfully via node-fetch in ${endTime - startTime}ms`)
    console.groupEnd()

    return NextResponse.json({ success: true, data })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error(`❌ node-fetch failed: ${errorMessage}`)
  }

  // If we get here, all methods failed
  const endTime = Date.now()
  console.error(`❌ All fetch methods failed after ${endTime - startTime}ms`)
  console.groupEnd()

  return NextResponse.json(
    {
      success: false,
      error: "All download attempts failed. Try the server fallback option.",
      requestId: requestId,
    },
    { status: 500 },
  )
}
