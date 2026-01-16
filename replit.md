# EndlessCast - 24/7 Multi-Platform Broadcasting

## Overview

EndlessCast is a web application that enables users to upload videos and stream them continuously (24/7) to multiple RTMP endpoints simultaneously. The platform supports major streaming services like YouTube Live, Facebook Live, Rumble, Odysee, and Twitter/X, as well as custom RTMP destinations. Users can manage a video library (up to 200GB storage with 16 videos max), configure RTMP endpoints, and control streaming with real-time status monitoring, email/Telegram notifications, and CDN integration.

## Recent Changes (January 16, 2026)

- **Persistent Storage**: Added file-based persistent storage to save videos, RTMP endpoints, and all settings to disk. Data now survives server restarts.
- **Data Persistence**: All metadata (videos, RTMP endpoints, playlists, email/Telegram/theme settings) saved to `data/storage.json` with debounced auto-save

## Previous Changes (January 15, 2026)

- **Storage Increase**: Expanded storage limit from 50GB to 200GB, max videos from 4 to 16
- **Mobile Responsiveness**: Improved responsive design across dashboard, settings, video library, and streaming controls
- **Content Streaming API**: Added video streaming endpoint with Range header support for better playback performance
- **Install Script**: Added comprehensive `install.sh` with ASCII art, port selection (8 options + custom), dependency checks, and systemd service generation
- **Dashboard Redesign**: Enhanced hacker/terminal aesthetic with stats cards, radial gradient background, live clock display, and improved visual hierarchy
- **Telegram Integration Fix**: Bot token now properly preserved when form sends masked "****" value after page reload
- **Deployment Configuration**: Added Replit autoscale deployment with build and run commands

## Deployment

### Replit Deployment (Recommended)

1. Click the **Publish** button in the top right corner of the Replit workspace
2. Select **Autoscale** deployment type
3. The build command (`npm run build`) and run command (`npm run start`) are pre-configured
4. Click **Publish** to deploy your app
5. Your app will be available at a public URL with automatic scaling

### Standalone Server Deployment (VPS/Local)

For deploying on your own server (Ubuntu, Debian, etc.):

1. **Clone the repository** to your server
2. **Run the install script**:
   ```bash
   chmod +x install.sh
   ./install.sh
   ```
3. The installer will:
   - Check system requirements (Node.js, npm, FFmpeg)
   - Let you select a port (3000, 4000, 5000, 8000, 8080, 8888, 9000, 9090, or custom)
   - Install dependencies
   - Create a `start.sh` script
   - Generate a systemd service file for automatic startup

4. **Start the application**:
   ```bash
   ./start.sh
   ```

5. **Optional: Install as system service**:
   ```bash
   sudo cp endlesscast.service /etc/systemd/system/
   sudo systemctl enable endlesscast
   sudo systemctl start endlesscast
   ```

### Default Credentials

- **Username**: admin (configurable via `ADMIN_USERNAME` env var)
- **Password**: admin123 (configurable via `PASSWORD_HASH` env var)

The install.sh script prompts for custom credentials during setup.

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
- Hacker/terminal aesthetic with neon green accents
- Typography: Inter for UI text, JetBrains Mono for technical data (RTMP URLs)
- 7 color theme presets (Matrix, Cyber Blue, Sunset, Purple Haze, Blood Red, Amber Terminal, Monochrome)
- Consistent spacing units (Tailwind: 2, 4, 6, 8)
- Component-based architecture with reusable UI primitives

**State Management:**
- React Query for server-side data with 2-second polling intervals for streaming state
- Local React state for UI interactions
- Session-based authentication with localStorage
- No global state management library (Redux/Zustand) - keeps architecture simple

**Key UI Components:**
- `LoginPage`: Password-based authentication with session management
- `VideoLibrary`: Manages video uploads, display, selection, and deletion
- `RtmpPanel`: Configures RTMP endpoints with platform-specific presets
- `StreamingControls`: Central control panel for starting/stopping streams with duration settings
- `StatusDashboard`: Real-time monitoring of endpoint connection statuses
- `StreamHealthMonitor`: Real-time stream health metrics (bitrate, FPS, dropped frames, buffer health)
- `StorageIndicator`: Shows storage usage against 200GB limit
- `Settings`: Theme selection, Email and Telegram notification configuration

### Backend Architecture

**Technology Stack:**
- Express.js server with TypeScript
- In-memory storage implementation (MemStorage class implementing IStorage interface)
- Node.js child processes for FFmpeg streaming
- Multer for multipart file uploads
- Bcrypt for password hashing
- Nodemailer for email notifications

**Authentication System:**
- Session-based authentication using in-memory session storage
- Password hashing with bcrypt (default: "admin")
- Session ID sent via `x-session-id` header
- Protected API routes using `requireAuth` middleware

**Storage Strategy:**
- Interface-based storage design (`IStorage`) allows swapping implementations
- Current implementation: In-memory storage (not persistent)
- Video files stored in filesystem (`uploads/` directory) with optional MinIO CDN backup
- Metadata stored in memory (videos, RTMP endpoints, streaming state, settings)
- Storage constraints: 200GB total, maximum 16 videos

**Rationale:** The interface pattern enables easy migration to database persistence (PostgreSQL via Drizzle ORM) without changing business logic. The current in-memory approach simplifies initial development and deployment.

**Streaming Architecture:**
- `StreamingService` class manages FFmpeg processes
- One FFmpeg process per enabled RTMP endpoint
- Video looping achieved via FFmpeg's `-stream_loop -1` flag
- Configurable stream duration (default: 11 hours 55 minutes)
- Output resolution capped at 1920x1080 with aspect ratio preservation (Facebook compatible)
- Video filter: scale to maintain aspect ratio without upscaling
- Bitrate: 3000k max, Buffer: 6000k, Audio: 160k AAC, 30 FPS
- Real-time monitoring of stream health via FFmpeg stdout/stderr parsing
- Health metrics tracked: dropped frames, total frames, bitrate, FPS, buffer health
- Graceful cleanup on stream stop or errors
- Selective streaming: Only enabled endpoints receive the stream
- Automatic email/Telegram alerts on stream errors (if configured)

**MinIO CDN Integration:**
- Optional S3-compatible object storage for video files
- Videos uploaded to both local storage and MinIO
- FFmpeg can stream from MinIO presigned URLs for better scalability
- Automatic fallback to local storage if MinIO unavailable
- Environment variables: `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`

**Notification Systems:**

*Email (Gmail SMTP):*
- Gmail SMTP integration via app passwords
- Configurable error notifications when streams fail
- Test connection feature in settings

*Telegram:*
- Bot token and chat ID configuration
- Notifications for stream start, stop, and errors
- Test message feature in settings

**API Design:**
- RESTful endpoints under `/api` prefix
- Authentication: `/api/auth/login`, `/api/auth/logout`, `/api/auth/check`
- Video operations: GET/POST/DELETE `/api/videos`, GET `/api/videos/:id/stream`
- RTMP endpoint operations: CRUD on `/api/rtmp-endpoints`
- Streaming control: `/api/streaming/start`, `/api/streaming/stop`, `/api/streaming/select-video`
- State polling: GET `/api/streaming/state` (polled every 2 seconds by frontend)
- Storage info: GET `/api/storage`
- Settings: `/api/email-settings`, `/api/telegram-settings`, `/api/theme-settings`

### Data Models

**Video Schema:**
- Metadata: id, filename, originalName, size, duration, mimeType, uploadedAt, minioUrl (optional)
- Supported formats: MP4, MOV, MKV
- Duration extracted using FFprobe

**RTMP Endpoint Schema:**
- Platform enum: youtube, facebook, rumble, odysee, twitter, custom
- Fields: id, platform, name, rtmpUrl, streamKey, enabled
- Platform-specific metadata (colors, labels, default URLs) defined in shared schema

**Streaming State:**
- Global streaming status (isStreaming, selectedVideoId, startedAt)
- Per-endpoint status array with connection state (idle, connecting, live, error, stopped)
- Optional metrics: bitrate, fps, error messages
- Health metrics: droppedFrames, totalFrames, bufferHealth (0-100%)

**Settings Schemas:**
- Email: enabled, gmailAddress, gmailAppPassword, notifyOnError
- Telegram: enabled, botToken, chatId, notifyOnStart, notifyOnStop, notifyOnError
- Theme: color preset selection

### Build & Deployment Strategy

**Development Mode:**
- Vite dev server with HMR for frontend
- tsx for running TypeScript server directly
- Express middleware integrates Vite in development
- Command: `npm run dev`

**Production Build:**
- Custom build script (`script/build.ts`) using esbuild for server bundling
- Vite builds client to `dist/public`
- Server dependencies bundled (allowlist approach) to reduce syscalls and improve cold start
- Single production artifact: bundled server + static client assets
- Build command: `npm run build`
- Start command: `npm run start`

**Rationale:** The bundling strategy optimizes for serverless/container deployment where file I/O syscalls impact cold start times. Selective bundling of dependencies balances bundle size with performance.

### File Upload Handling

**Strategy:**
- Multer with disk storage (uploads saved to `uploads/` directory)
- File validation: MIME type and extension checks
- Size limit enforcement at upload time (200GB total storage)
- FFprobe integration for video duration extraction
- Storage quota checked before accepting uploads (16 videos max)
- Range header support for video streaming/preview
- Optional MinIO upload for CDN distribution

**Pros:**
- Simple, battle-tested approach
- Files immediately available for FFmpeg processing
- Optional CDN integration for scalability
- No need for temporary file management

**Cons:**
- Local storage not suitable for horizontal scaling without MinIO
- MinIO integration adds complexity but enables multi-instance deployments

## Code Quality

**Recent Improvements:**
- Cleaned up all unused code (21 issues resolved across 9 files)
- Removed unused imports, functions, variables, and parameters
- TypeScript strict mode with `--noUnusedLocals` and `--noUnusedParameters`
- Zero TypeScript compilation errors
- Successful production build verification

## External Dependencies

### FFmpeg for Video Processing
- **FFprobe**: Extracts video metadata (duration, format)
- **FFmpeg**: Streams video to RTMP endpoints with looping
- System dependency (must be installed on deployment environment)
- Required flags: `-re`, `-stream_loop`, `-t`, `-vf`, `-c:v`, `-c:a`

### MinIO (Optional)
- **S3-compatible object storage** for CDN distribution
- Videos uploaded to MinIO bucket for scalable access
- Presigned URLs generated for FFmpeg streaming
- Environment variables required: endpoint, access key, secret key, bucket name
- **Graceful fallback**: System works without MinIO configuration

### Notification Services (Optional)
- **Gmail SMTP** via app passwords for email alerts
- **Telegram Bot API** for instant messaging notifications
- Configuration via settings page
- **Graceful fallback**: System works without notification configuration

### UI Component Library
- **shadcn/ui**: Pre-built component library based on Radix UI
- Components aliased via `@/components/ui/*`
- Customizable via Tailwind CSS variables
- New York style variant configured

### Styling & Theming
- **Tailwind CSS** with PostCSS processing
- Custom theme configuration in `tailwind.config.ts`
- Google Fonts: Inter (UI), JetBrains Mono (monospace)
- Dark mode with 7 color theme presets
- Custom status colors (online, away, busy, offline)

### Third-Party Platform Integrations
- **RTMP Streaming Platforms**: YouTube Live, Facebook Live, Rumble, Odysee, Twitter/X
- Integration method: User-provided RTMP URLs and stream keys
- No OAuth or API integration - relies on platform-generated credentials
- Custom RTMP endpoints supported for additional services
- Platform-specific default URLs provided for convenience

### Development Tools
- **Replit-specific plugins**: Runtime error modal, cartographer, dev banner
- **Vite plugins**: React, runtime error overlay
- **Type checking**: TypeScript with strict mode enabled
- **Build tools**: esbuild for server bundling, Vite for client bundling
