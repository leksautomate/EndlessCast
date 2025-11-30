# EndlessCast - 24/7 Multi-Platform Broadcasting

## Overview

EndlessCast is a web application that enables users to upload videos and stream them continuously (24/7) to multiple RTMP endpoints simultaneously. The platform supports major streaming services like YouTube Live, Facebook Live, Rumble, Odysee, and Twitter/X, as well as custom RTMP destinations. Users can manage a video library (up to 5GB storage), configure RTMP endpoints, and control streaming with real-time status monitoring.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React with TypeScript for UI components
- Vite as the build tool and development server
- Wouter for client-side routing (lightweight alternative to React Router)
- TanStack Query (React Query) for server state management and data fetching
- shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for styling with a custom design system

**Design System:**
- System-based approach inspired by Linear and Notion
- Typography: Inter for UI text, JetBrains Mono for technical data (RTMP URLs)
- Custom color scheme with CSS variables for theming (light/dark mode support)
- Consistent spacing units (Tailwind: 2, 4, 6, 8)
- Component-based architecture with reusable UI primitives

**State Management:**
- React Query for server-side data with 2-second polling intervals for streaming state
- Local React state for UI interactions
- No global state management library (Redux/Zustand) - keeps architecture simple

**Key UI Components:**
- `VideoLibrary`: Manages video uploads, display, selection, and deletion
- `RtmpPanel`: Configures RTMP endpoints with platform-specific presets
- `StreamingControls`: Central control panel for starting/stopping streams
- `StatusDashboard`: Real-time monitoring of endpoint connection statuses
- `StorageIndicator`: Shows storage usage against 5GB limit

### Backend Architecture

**Technology Stack:**
- Express.js server with TypeScript
- In-memory storage implementation (MemStorage class implementing IStorage interface)
- Node.js child processes for FFmpeg streaming
- Multer for multipart file uploads

**Storage Strategy:**
- Interface-based storage design (`IStorage`) allows swapping implementations
- Current implementation: In-memory storage (not persistent)
- Video files stored in filesystem (`uploads/` directory)
- Metadata stored in memory (videos, RTMP endpoints, streaming state)
- Storage constraints: 5GB total, maximum number of videos enforced

**Rationale:** The interface pattern enables easy migration to database persistence (PostgreSQL via Drizzle ORM) without changing business logic. The current in-memory approach simplifies initial development and deployment.

**Streaming Architecture:**
- `StreamingService` class manages FFmpeg processes
- One FFmpeg process per enabled RTMP endpoint
- Video looping achieved via FFmpeg's `-stream_loop -1` flag
- Output resolution capped at 1920x1080 with aspect ratio preservation (Facebook compatible)
- Video filter: scale/pad to maintain aspect ratio without upscaling
- Bitrate: 3000k max, Buffer: 6000k, Audio: 160k AAC
- Real-time monitoring of stream health via process stdout/stderr
- Graceful cleanup on stream stop or errors
- Selective streaming: Only enabled endpoints receive the stream

**API Design:**
- RESTful endpoints under `/api` prefix
- Video operations: GET/POST/DELETE `/api/videos`
- RTMP endpoint operations: CRUD on `/api/rtmp-endpoints`
- Streaming control: `/api/streaming/start`, `/api/streaming/stop`
- State polling: GET `/api/streaming/state` (polled every 2 seconds by frontend)

### Data Models

**Video Schema:**
- Metadata: id, filename, originalName, size, duration, mimeType, uploadedAt
- Supported formats: MP4, MOV, MKV
- Duration extracted using FFprobe

**RTMP Endpoint Schema:**
- Platform enum: youtube, facebook, rumble, odysee, twitter, custom
- Fields: id, platform, name, rtmpUrl, streamKey, enabled
- Platform-specific metadata (colors, labels) defined in shared schema

**Streaming State:**
- Global streaming status (isStreaming, selectedVideoId, startedAt)
- Per-endpoint status array with connection state (idle, connecting, live, error, stopped)
- Optional metrics: bitrate, fps, error messages

### Build & Deployment Strategy

**Development Mode:**
- Vite dev server with HMR for frontend
- tsx for running TypeScript server directly
- Express middleware integrates Vite in development

**Production Build:**
- Custom build script (`script/build.ts`) using esbuild for server bundling
- Vite builds client to `dist/public`
- Server dependencies bundled (allowlist approach) to reduce syscalls and improve cold start
- Single production artifact: bundled server + static client assets

**Rationale:** The bundling strategy optimizes for serverless/container deployment where file I/O syscalls impact cold start times. Selective bundling of dependencies balances bundle size with performance.

### File Upload Handling

**Strategy:**
- Multer with disk storage (uploads saved to `uploads/` directory)
- File validation: MIME type and extension checks
- Size limit enforcement at upload time
- FFprobe integration for video duration extraction
- Storage quota checked before accepting uploads

**Pros:**
- Simple, battle-tested approach
- Files immediately available for FFmpeg processing
- No need for temporary file management

**Cons:**
- Not suitable for horizontal scaling (files local to server instance)
- Future enhancement: Cloud storage (S3) for multi-instance deployments

## External Dependencies

### Database System
- **Drizzle ORM** configured for PostgreSQL
- Schema defined in `shared/schema.ts`
- Migrations output to `./migrations` directory
- Connection via `@neondatabase/serverless` driver
- Environment variable: `DATABASE_URL`

**Current Status:** Database infrastructure configured but not actively used. Current implementation uses in-memory storage (MemStorage class). Database integration is prepared for future persistence requirements.

### FFmpeg for Video Processing
- **FFprobe**: Extracts video metadata (duration, format)
- **FFmpeg**: Streams video to RTMP endpoints with looping
- System dependency (must be installed on deployment environment)

### UI Component Library
- **shadcn/ui**: Pre-built component library based on Radix UI
- Components aliased via `@/components/ui/*`
- Customizable via Tailwind CSS variables
- New York style variant configured

### Styling & Theming
- **Tailwind CSS** with PostCSS processing
- Custom theme configuration in `tailwind.config.ts`
- Google Fonts: Inter (UI), JetBrains Mono (monospace)
- Dark mode support via CSS class strategy

### Third-Party Platform Integrations
- **RTMP Streaming Platforms**: YouTube Live, Facebook Live, Rumble, Odysee, Twitter/X
- Integration method: User-provided RTMP URLs and stream keys
- No OAuth or API integration - relies on platform-generated credentials
- Custom RTMP endpoints supported for additional services

### Development Tools
- **Replit-specific plugins**: Runtime error modal, cartographer, dev banner
- **Vite plugins**: React, runtime error overlay
- **Type checking**: TypeScript with strict mode enabled