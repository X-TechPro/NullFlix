// This file customizes the <head> for the app directory in Next.js
// It enables PWA manifest, favicon, and meta tags for theme color
export default function Head() {
  return (
    <>
      <link rel="manifest" href="/manifest.json" />
      <link rel="icon" href="/icons/icon-192x192.png" type="image/png" />
      <meta name="theme-color" content="#000000" />
      <title>NullFlix | Movie Player App</title>
    </>
  )
}
