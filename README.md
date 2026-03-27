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

## System Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| **OS** | Ubuntu 20.04+ / Debian 11+ | Ubuntu 22.04 LTS |
| **Node.js** | 18.x | 20.x |
| **RAM** | 1 GB | 2 GB+ |
| **Storage** | 10 GB | 200 GB+ |
| **FFmpeg** | Required | Required |

### Install FFmpeg

```bash
# Ubuntu/Debian
sudo apt update && sudo apt install -y ffmpeg

# CentOS/RHEL
sudo yum install -y epel-release ffmpeg

# macOS
brew install ffmpeg
```

### Multi-Platform Streaming Requirements

EndlessCast encodes each destination stream independently using `libx264` (veryfast preset). CPU and RAM usage scales linearly with the number of simultaneous streams.

> **Check your server's capacity live** on the **System** page in the dashboard.

#### CPU & RAM per stream count

| Simultaneous Streams | Resolution | CPU Cores Needed | RAM Needed | Upload Bandwidth |
|----------------------|------------|------------------|------------|-----------------|
| 1×                   | 1080p      | 2 cores          | 512 MB     | ~6.2 Mbps       |
| 2×                   | 1080p      | 4 cores          | 1 GB       | ~12.4 Mbps      |
| 3×                   | 1080p      | 6 cores          | 1.5 GB     | ~18.6 Mbps      |
| 4×                   | 1080p      | 8 cores          | 2 GB       | ~24.8 Mbps      |
| 6×                   | 1080p      | 12 cores         | 3 GB       | ~37.2 Mbps      |
| 1×                   | 720p       | 1 core           | 256 MB     | ~3.2 Mbps       |
| 2×                   | 720p       | 2 cores          | 512 MB     | ~6.4 Mbps       |
| 4×                   | 720p       | 4 cores          | 1 GB       | ~12.8 Mbps      |
| 6×                   | 720p       | 6 cores          | 1.5 GB     | ~19.2 Mbps      |

#### Recommended VPS specs for multi-platform streaming

| Streams | Resolution | Recommended VPS                                    |
|---------|------------|----------------------------------------------------|
| 1–2     | 1080p      | 4 vCPU / 4 GB RAM (Hetzner CX22, DO Basic 4GB)    |
| 3–4     | 1080p      | 8 vCPU / 8 GB RAM (Hetzner CX32, DO General 8GB)  |
| 5–6     | 1080p      | 12–16 vCPU / 16 GB RAM (dedicated or high-CPU VPS)|
| 1–4     | 720p       | 4 vCPU / 2 GB RAM — very cost-effective option     |

> **Tip:** Use the Landscape 720p output profile to roughly halve CPU usage per stream.
> Use a VPS with **dedicated** CPU cores (not shared/burstable) for stable 24/7 operation.

---

## Quick Install (VPS / Linux Server)

### One-Line Installer

```bash
curl -fsSL https://raw.githubusercontent.com/leksautomate/EndlessCast/main/install.sh -o install.sh && chmod +x install.sh && ./install.sh
```

### Step-by-Step

```bash
git clone https://github.com/leksautomate/EndlessCast.git
cd EndlessCast
chmod +x install.sh
./install.sh
```

The interactive installer will:

1. Check Node.js, FFmpeg, and Git are installed
2. Let you choose a port (or enter a custom one)
3. Set up admin username and password (bcrypt-hashed)
4. Install npm dependencies
5. Generate four management scripts: `start.sh`, `stop.sh`, `status.sh`, `restart.sh`
6. Create `endlesscast.service` for systemd — and auto-install it if `sudo` is available
7. Offer to start the server immediately **in the background** (no terminal blocking)

---

## Running EndlessCast

### Background Mode (Recommended)

`start.sh` automatically picks the best background method available:

- **pm2** — if installed, uses pm2 (survives reboots, has built-in monitoring)
- **nohup** — fallback; runs detached, writes logs to `endlesscast.log`, PID to `endlesscast.pid`

```bash
./start.sh      # start in background — terminal returns immediately
./stop.sh       # stop the running server
./status.sh     # check if it's running, show port and log path
./restart.sh    # stop + start in one command
```

#### Optional: install pm2 for the best experience

```bash
npm install -g pm2
pm2 startup      # configure pm2 to auto-start on reboot
```

### As a System Service (Auto-start on reboot)

The installer creates `endlesscast.service`. If `sudo` was available during install it's already enabled. Otherwise:

```bash
sudo cp endlesscast.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable endlesscast
sudo systemctl start endlesscast
```

**Service management:**

```bash
sudo systemctl status endlesscast
sudo systemctl restart endlesscast
sudo systemctl stop endlesscast
sudo journalctl -u endlesscast -f                       # live logs
sudo journalctl -u endlesscast --since "1 hour ago"     # recent logs
```

### Foreground / Debug Mode

```bash
PORT=5050 node_modules/.bin/tsx server/index.ts
# or
PORT=5050 npm run dev
```

---

## Updating on an Existing VPS

```bash
cd ~/EndlessCast

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Restart the service
./restart.sh
# or, if using systemd:
sudo systemctl restart endlesscast

# Verify it started correctly
./status.sh
```

---

## Firewall Configuration

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp          # SSH
sudo ufw allow 80/tcp          # HTTP (if using Nginx)
sudo ufw allow 443/tcp         # HTTPS (if using Nginx)
sudo ufw allow YOUR_PORT/tcp   # Direct port (e.g. 5050)
sudo ufw enable

# iptables alternative
sudo iptables -A INPUT -p tcp --dport YOUR_PORT -j ACCEPT
```

**Cloud providers** (AWS, DigitalOcean, Contabo, Hetzner, etc.): also open the port in your provider's firewall / security group settings.

---

## Nginx Reverse Proxy + HTTPS (Optional)

For a custom domain with HTTPS:

```bash
sudo apt install -y nginx certbot python3-certbot-nginx

sudo nano /etc/nginx/sites-available/endlesscast
```

Paste this config (replace `your_domain.com` and port `5000`):

```nginx
server {
    listen 80;
    server_name your_domain.com;

    client_max_body_size 5G;
    client_body_timeout 3600s;
    proxy_connect_timeout 3600s;
    proxy_send_timeout 3600s;
    proxy_read_timeout 3600s;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_request_buffering off;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/endlesscast /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d your_domain.com
```

---

## Default Credentials

| Field | Default |
|-------|---------|
| **Username** | `admin` |
| **Password** | `admin123` |

Change these during installation or by re-running `install.sh`.

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `ADMIN_USERNAME` | Admin login username | `admin` |
| `PASSWORD_HASH` | bcrypt hash of password | hash of `admin123` |
| `NODE_ENV` | Runtime environment | `production` |

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

## Troubleshooting

### Server won't start / check what went wrong

```bash
./status.sh                         # if using start.sh
tail -f endlesscast.log             # nohup logs
pm2 logs endlesscast                # if using pm2
sudo journalctl -u endlesscast -n 50 --no-pager   # if using systemd
```

### Port already in use

```bash
sudo lsof -i :5000
sudo kill -9 <PID>
```

### Stream keeps stopping

```bash
# Check live logs:
tail -f endlesscast.log
# or:
pm2 logs endlesscast
# Also check the Event Log page inside the EndlessCast dashboard
```

### Cannot access dashboard

1. Check the server is running: `./status.sh`
2. Open firewall port: `sudo ufw allow YOUR_PORT/tcp`
3. Check cloud provider security group / firewall settings

### High CPU during streaming

This is expected — FFmpeg is doing real-time video encoding. Solutions:

- Use a VPS with more CPU cores (4+ recommended for multi-platform)
- Switch to the **Landscape 720p** output profile to halve CPU per stream
- Reduce the number of simultaneous endpoints

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

### v1.4.0 — 2026-03-27

**UI Overhaul: Broadcast Operations Center**

- Complete redesign across all pages — "Mission Control" terminal aesthetic
- **VT323** display font for all big numbers and headings; **JetBrains Mono** for body text
- Persistent top status bar on every page showing live/offline pill, active channel count, and terminal-style breadcrumb path
- Sidebar: pulsing LED indicator, animated signal bars when live, VT323 clock
- Console-pane card style (3px left accent border) used consistently across all pages
- Dot-grid atmospheric background + scanlines overlay
- Redesigned landing page: dramatic two-column hero with animated terminal boot sequence, animated count-up stats, feature grid with category tags, live terminal output demo

**Installer Improvements**

- `install.sh` now generates `stop.sh`, `status.sh`, and `restart.sh` — full process management out of the box
- `start.sh` runs EndlessCast **in the background** automatically (pm2 → nohup fallback) — no more terminal blocking
- Auto-installs systemd service if `sudo` is available without a password prompt
- Systemd service uses `Restart=always` + `RestartSec=5` for real crash recovery
- "Start now?" prompt offers: Background, Systemd, Foreground, or Skip

**Bug Fixes**

- Fixed duplicate video entries appearing in the library while a file was still uploading — caused by the upload queue draining on a stale snapshot that still showed the job as pending, triggering a second upload of the same file

---

### v1.3.0 — 2026-03-26

**New Features**
- **Extra Camera (PiP)** — select a second video to overlay as a picture-in-picture in any corner (top-left, top-right, bottom-left, bottom-right) with configurable size (10–50%)
- **Event Log page** — in-app terminal-style log of all stream events, errors, and reconnects with level filtering (Info / Warn / Error) and auto-refresh
- Enhanced metadata: all page titles and Open Graph tags updated to "EndlessCast"

**Improvements**
- Log entries are now created for: stream start/stop, endpoint live, reconnect attempts, FFmpeg errors, permanent endpoint failures

---

### v1.2.0 — 2026-03-20

**New Features**
- **Per-endpoint output profiles** — Landscape 1080p, Landscape 720p, Portrait 1080p, Square 1080p (each with tailored FFmpeg encoding args)
- **Auto-reconnect** — up to 3 automatic reconnect attempts per endpoint with 5-second delay; reconnect budget resets after a successful stream period

**Improvements**
- Profile badge displayed on RTMP endpoint cards
- Reconnecting status shown in endpoint status dashboard

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
