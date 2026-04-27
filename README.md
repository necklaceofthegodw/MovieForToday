# MovieForToday

A PWA for picking 10 movies for today based on a short preference profile.

## Stack

- Vite + React + TypeScript
- Vercel API routes
- TMDB as the movie data source
- Local PWA storage for preferences and history

## Setup

```bash
npm.cmd install
npm.cmd run dev
```

For real TMDB data, add:

```bash
TMDB_READ_ACCESS_TOKEN=your_tmdb_v4_read_token
```

Without the token, API routes return demo data so the interface remains usable locally.
