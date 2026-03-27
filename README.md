# EndlessCast

**24/7 Multi-Platform Broadcasting Platform**

Stream your videos continuously to YouTube Live, Facebook Live, Rumble, Odysee, Twitter/X, and custom RTMP destinations — automatically, without any manual intervention.

[![GitHub](https://img.shields.io/badge/GitHub-leksautomate%2FEndlessCast-181717?logo=github)](https://github.com/leksautomate/EndlessCast)

---

## Features

- **24/7 continuous streaming** with automatic video looping
- **Multi-platform broadcasting** — up to 6+ endpoints simultaneously
- **Extra Camera (PiP)** — overlay a second video as a picture-in-picture in any corner
- **Per-endpoint output profiles** — Landscape 1080p/720p, Portrait 1080p, Square 1080p
- **Per-destination video** — assign a different video file to each RTMP endpoint
- **Auto-reconnect** — up to 3 automatic reconnect attempts on failure
- **Real-time health monitoring** — bitrate, FPS, frame drops per endpoint
- **Event log** — terminal-style in-app log of all stream events, errors, and reconnects
- **Email & Telegram alerts** — notifications for stream start, stop, errors, and crashes
- **Scheduled streams** — time-based broadcasting with daily/weekly recurrence
- **Playlist support** — queue multiple videos to play in sequence
- **200 GB storage**, up to 16 videos
- **7 color themes** (Matrix, Cyber Blue, Neon, Sunset, Ocean, Amber, Violet)
- **Broadcast Operations Center UI** — VT323 terminal aesthetic, live status top bar, console-pane panels

---

## Deployment

Full installation and setup instructions for every supported platform:

**[→ DEPLOYMENT.md](DEPLOYMENT.md)**

| Platform | Guide |
|----------|-------|
| Ubuntu VPS / Linux server | [Ubuntu VPS](DEPLOYMENT.md#ubuntu-vps--linux-server) |
| Windows PC | [Windows PC](DEPLOYMENT.md#windows-pc) |
| Android (Termux) | [Android](DEPLOYMENT.md#android-termux) |
| Updating an existing install | [Updating](DEPLOYMENT.md#updating-an-existing-install) |
| Removing EndlessCast | [Removing](DEPLOYMENT.md#removing-endlesscast) |

---

## Default Credentials

| Field | Default |
|-------|---------|
| **Username** | `admin` |
| **Password** | `admin123` |

Change these during installation or via **Settings** in the dashboard.

---

## Environment Variables

Set these in `.env` in the project root (`.env` is gitignored — `git pull` will never overwrite it).

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `ADMIN_USERNAME` | Admin login username | `admin` |
| `PASSWORD_HASH` | bcrypt hash of password | hash of `admin123` |
| `NODE_ENV` | Runtime environment | `production` |

See `.env.example` for a reference template.

---

## Supported Platforms

| Platform | RTMP URL |
|----------|----------|
| YouTube Live | `rtmp://a.rtmp.youtube.com/live2` |
| Facebook Live | `rtmps://live-api-s.facebook.com:443/rtmp` |
| Rumble | `rtmp://cdn.rumble.cloud/live/...` |
| Odysee | `rtmp://stream.odysee.com/live` |
| Twitter/X | `rtmps://ingest.pscp.tv:443/x` |
| Custom | Any RTMP/RTMPS URL |

---

## Notifications Setup

EndlessCast sends alerts when streams fail, endpoints disconnect, or the server crashes.

### Telegram

1. Create a bot via [@BotFather](https://t.me/BotFather) and copy your **Bot Token**
2. Get your **Chat ID** via [@userinfobot](https://t.me/userinfobot)
3. Go to **Settings → Telegram** in EndlessCast
4. Enter Bot Token and Chat ID, enable the events you want
5. Click **Test Connection**

**You'll be notified for:** stream start · stream stop · stream errors · server crash · server restart

### Email (Gmail)

1. Enable 2FA on your Gmail account
2. Generate an [App Password](https://myaccount.google.com/apppasswords)
3. Go to **Settings → Email** in EndlessCast
4. Enter your Gmail address and App Password
5. Click **Test Connection**

---

## Troubleshooting

### Server won't start

```bash
./status.sh                                            # Linux — check running state
tail -f endlesscast.log                                # nohup logs
pm2 logs endlesscast                                   # if using pm2
sudo journalctl -u endlesscast -n 50 --no-pager        # if using systemd
```

### Port already in use

```bash
# Linux
sudo lsof -i :5000
sudo kill -9 <PID>

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Stream keeps stopping

Check the **Event Log** page inside the EndlessCast dashboard, or:

```bash
tail -f endlesscast.log
pm2 logs endlesscast
```

### Cannot access dashboard

1. Check the server is running: `./status.sh`
2. Open your firewall port (see [DEPLOYMENT.md](DEPLOYMENT.md) for platform-specific instructions)

### High CPU during streaming

This is expected — FFmpeg does real-time video encoding per destination. Solutions:

- Switch to the **Landscape 720p** output profile to halve CPU per stream
- Reduce the number of simultaneous endpoints
- Upgrade your VPS to more dedicated CPU cores

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| **Backend** | Express.js, TypeScript, tsx |
| **Streaming** | FFmpeg (filter_complex for PiP, multi-endpoint) |
| **Storage** | Local JSON (`data/storage.json`) |
| **Auth** | Session-based (bcrypt passwords) |

---

## Changelog

### v1.5.0 — 2026-03-27

**Security**

- Added authentication to 5 previously unprotected API endpoints (PATCH endpoints, video selection, email/Telegram test, theme settings)
- Fixed path traversal vulnerability in thumbnail deletion — file operations now confined to `uploads/thumbnails/`

**UI Craft Pass**

- JetBrains Mono + glow effects now active by default — terminal identity is on, not opt-in
- Theme settings (terminal font, glow, scanlines) now wired to DOM data attributes so CSS reacts immediately
- Overview page: two-column layout — streaming controls are the hero, stats move to a support column
- Sidebar: left-border accent on active nav item, animated ping on live status, logo has more visual mass
- Sidebar border shifts to green when broadcasting — interface feels different when live
- Stat card labels: uppercase + tracked + dimmed (hierarchy through typography, not just size)
- Wider surface tonal gap between background and card; live border pulse strengthened

**Config**

- `.env` removed from git tracking — `git pull` no longer resets port or credentials on update
- `.env.example` added as a reference template for new installs

---

### v1.4.0 — 2026-03-27

**UI Overhaul: Broadcast Operations Center**

- Complete redesign across all pages — "Mission Control" terminal aesthetic
- **VT323** display font for all big numbers and headings; **JetBrains Mono** for body text
- Persistent top status bar on every page showing live/offline pill, active channel count, and terminal-style breadcrumb path
- Sidebar: pulsing LED indicator, animated signal bars when live, VT323 clock
- Console-pane card style (3px left accent border) used consistently across all pages
- Dot-grid atmospheric background + scanlines overlay
- Redesigned landing page: dramatic two-column hero with animated terminal boot sequence, animated count-up stats, feature grid with category tags, live terminal output demo

**Deployment**

- `start.sh`, `stop.sh`, `status.sh`, `restart.sh` now ship directly in the repo — get the latest scripts with `git pull` without re-running the installer
- `start.sh` runs EndlessCast **in the background** (pm2 → nohup fallback) — Ctrl+C will not stop the server
- New deployment guide covers Ubuntu VPS, Windows PC, and Android (Termux)
- Auto-installs systemd service if `sudo` is available; `Restart=always` for crash recovery

**Bug Fixes**

- Fixed duplicate video entries appearing in the library during upload

---

### v1.3.0 — 2026-03-26

**New Features**
- **Extra Camera (PiP)** — select a second video to overlay as picture-in-picture in any corner with configurable size (10–50%)
- **Event Log page** — terminal-style in-app log with level filtering (Info / Warn / Error) and auto-refresh

---

### v1.2.0 — 2026-03-20

**New Features**
- **Per-endpoint output profiles** — Landscape 1080p, Landscape 720p, Portrait 1080p, Square 1080p
- **Auto-reconnect** — up to 3 automatic reconnect attempts with 5-second delay

---

### v1.1.0

**New Features**
- Scheduled streams with daily/weekly recurrence
- Playlist support (queue multiple videos)
- Telegram and Email notifications
- 7 color theme presets

---

### v1.0.0

- Initial release
- 24/7 continuous streaming to multiple RTMP endpoints
- Session-based authentication
- Real-time stream health monitoring
- Video library with upload support

---

## License

MIT License — see [LICENSE](LICENSE) for details.

## Support & Issues

- **Repository:** https://github.com/leksautomate/EndlessCast
- **Issues:** https://github.com/leksautomate/EndlessCast/issues
