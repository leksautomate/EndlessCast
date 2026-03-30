# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (tsx, hot-reload via Vite)
npm run build    # Production build: Vite bundles client → dist/public/, esbuild bundles server → dist/index.cjs
npm start        # Run production build (requires npm run build first)
npm run check    # TypeScript type checking (tsc --noEmit)
npm run db:push  # Apply Drizzle ORM schema migrations to PostgreSQL
```

No lint or test scripts are configured.

## Architecture

EndlessCast is a full-stack TypeScript app: React frontend served by an Express backend. Both share types via `shared/schema.ts`.

**Path aliases** (tsconfig): `@/*` → `client/src/`, `@shared/*` → `shared/`

### Server (`server/`)

| Module | Responsibility |
|--------|---------------|
| `index.ts` | Express app setup, middleware, 2-hour upload timeout, crash notifications |
| `routes.ts` | All API endpoints (auth, videos, RTMP, streaming, settings, logs) |
| `streaming.ts` | FFmpeg child processes per endpoint, auto-reconnect (3 attempts, 5s delay), health monitoring |
| `storage.ts` | `MemStorage` class — in-memory store with debounced JSON persistence to `/data/storage.json` |
| `auth.ts` | Session-based auth (7-day expiry), bcrypt password verification |
| `email.ts` | Nodemailer/Gmail alerts for stream events and crashes |
| `telegram.ts` | Telegram Bot API alerts |
| `static.ts` | Serves uploaded files from `/uploads/` and `/uploads/thumbnails/` |
| `vite.ts` | Vite dev-server proxy (development only) |

### Client (`client/src/`)

**Routing** via `wouter` in `App.tsx`. Pages: `overview`, `videos`, `destinations`, `logs`, `settings`, `system`, `login`, `landing`.

**State management**: TanStack Query for all server state. No global client state store.

**UI**: shadcn/ui primitives + Tailwind CSS + Framer Motion. Theme system (8 presets: ocean/crimson/emerald/amber/violet/arctic/sunset/slate) managed by `components/theme-provider.tsx` and persisted via `/api/settings/theme`.

### Shared (`shared/schema.ts`)

Zod schemas define all entities: `Video`, `RtmpEndpoint`, `StreamingState`, `StreamStatus`, `Playlist`, `ScheduledStream`, `EmailSettings`, `TelegramSettings`, `ThemeSettings`, `ExtraCamera`. These are the source of truth for both API validation and TypeScript types.

## Streaming Data Flow

1. `POST /api/streaming/start` → `streaming.ts` reads enabled endpoints from storage
2. For each endpoint: spawns an `ffmpeg` child process with:
   - Input: video file from `uploads/`
   - Output profile filter (landscape/portrait/square via `-filter_complex`)
   - Optional PiP overlay (`ExtraCamera`) composited via `filter_complex`
   - Output: RTMP URL + stream key
3. FFmpeg stdout is parsed for bitrate/FPS health metrics
4. On process exit: auto-reconnect with backoff, then log to storage and fire notifications

Each RTMP endpoint can have its own assigned video (overrides global selection) and output profile (`landscape_1080p`, `landscape_720p`, `portrait_1080p`, `square_1080p`).

## Storage

`MemStorage` in `server/storage.ts` holds all runtime state in memory and writes to `/data/storage.json` after each mutation (debounced). There is no database in the default setup — Drizzle ORM + PostgreSQL is scaffolded but not used unless `DATABASE_URL` is configured.

Uploads live in `/uploads/` (videos) and `/uploads/thumbnails/` (YouTube thumbnails). Storage limit: 200 GB, max 16 videos.

## Environment Variables

Configured in `.env`:
- `PORT` — server port (default 5000)
- `ADMIN_USERNAME` / `PASSWORD_HASH` — bcrypt-hashed admin credentials
- `SESSION_SECRET` — express-session secret
- `DATABASE_URL` — optional PostgreSQL connection (Drizzle ORM)

## UI Design Conventions

- Font: Inter for all UI text (no monospace fonts)
- 8 color themes (HSL CSS variables), all managed via `theme-provider.tsx`; scanlines are an optional toggle (`data-scanlines` attribute), not always-on
- Prefer existing shadcn/ui components from `client/src/components/ui/` before creating new ones
- Note: `design_guidelines.md` describes the old terminal aesthetic and is outdated — the UI now uses a clean modern dark theme
