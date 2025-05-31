# NullFlix

NullFlix is a free movie streaming platform designed for simplicity and accessibility. Built with the help of [v0.dev](https://v0.dev) and GitHub Copilot (agent mode), NullFlix aims to provide a seamless experience for discovering and watching movies online.

## Features

- **Free Movie Streaming**: Watch movies without any subscription or payment.
- **Modern UI**: Built with Next.js and Tailwind CSS for a fast, responsive, and visually appealing interface.
- **TMDB API Integration**: Fetches movie data from the TMDB API (configurable in settings).
- **Bookmarks & Search**: Easily search for movies and bookmark your favorites.
- **Settings Customization**: Adjust API usage and other preferences.
- **Upcoming**: Anime streaming support (coming soon).

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **API**: [TMDB API](https://www.themoviedb.org/documentation/api)
- **Utilities**: TypeScript, React Hooks

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd nullflix
   ```
2. **Install dependencies:**
   ```bash
   pnpm install
   ```
3. **Run the development server:**
   ```bash
   pnpm dev
   ```
4. **Open in browser:**
   - Visit [http://localhost:3000](http://localhost:3000)
5. **Configure TMDB API Key (Optional):**
   - Set your TMDB API key in the settings dialog to get more TMDB rates.

## Project Structure

- `app/` — Main application pages and layout
- `components/` — UI components and dialogs
- `hooks/` — Custom React hooks
- `lib/` — Utility functions
- `services/` — API and data services
- `public/` — Static assets
- `styles/` — Global styles
- `utils/` — Database and utility helpers

---

> ⚠️ **Warning:** NullFlix does **not** host or store any movies or video content. All streaming and data are provided via third-party APIs. NullFlix is for educational and personal use only. Please respect copyright laws when streaming content.
