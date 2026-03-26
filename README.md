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
- **Auto-reconnect** — up to 3 automatic reconnect attempts on failure
- **Real-time health monitoring** — bitrate, FPS, frame drops per endpoint
- **Event log** — terminal-style in-app log of all stream events, errors, and reconnects
- **Email & Telegram alerts** — notifications for stream start, stop, errors, and crashes
- **Scheduled streams** — time-based broadcasting with daily/weekly recurrence
- **Playlist support** — queue multiple videos to play in sequence
- **200 GB storage**, up to 16 videos
- **7 color themes** (Matrix, Cyber Blue, Neon, Sunset, Ocean, Amber, Violet)
- **Mobile-responsive** hacker/terminal aesthetic

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
2. Let you choose a port (or use a custom one)
3. Set up admin username and password
4. Install npm dependencies
5. Create `start.sh` and `endlesscast.service` files

---

## Running EndlessCast

### As a System Service (Recommended for 24/7)

```bash
# Copy and enable the service
sudo cp endlesscast.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable endlesscast
sudo systemctl start endlesscast
```

**Service management commands:**

```bash
sudo systemctl status endlesscast    # Check status
sudo systemctl restart endlesscast   # Restart
sudo systemctl stop endlesscast      # Stop
sudo journalctl -u endlesscast -f    # Follow live logs
sudo journalctl -u endlesscast --since "1 hour ago"   # Recent logs
```

### Manual Start

```bash
./start.sh
# or
PORT=5050 npm run dev
```

### Production Build

```bash
npm run build
npm run start
```

---

## Updating on an Existing VPS

When a new version is released, update your running installation:

```bash
cd ~/EndlessCast

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Rebuild the application
npm run build

# Restart the service
sudo systemctl restart endlesscast

# Verify it started correctly
sudo systemctl status endlesscast
```

If the service is running in dev mode instead:

```bash
cd ~/EndlessCast
git pull origin main
npm install
# Stop the old process (Ctrl+C or kill), then:
./start.sh
```

---

## Firewall Configuration

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP (if using Nginx)
sudo ufw allow 443/tcp    # HTTPS (if using Nginx)
sudo ufw allow YOUR_PORT/tcp   # Direct port (e.g. 5000)
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

Change these during installation or by editing `.env` on your server.

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `ADMIN_USERNAME` | Admin login | `admin` |
| `PASSWORD_HASH` | bcrypt hash of password | hash of `admin123` |

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

### Service won't start

```bash
sudo journalctl -u endlesscast -n 50
which node && node --version
which ffmpeg && ffmpeg -version
```

### Port already in use

```bash
sudo lsof -i :5000
sudo kill -9 <PID>
```

### Stream keeps stopping

```bash
sudo journalctl -u endlesscast -f    # Watch live logs
# Also check: Event Log page inside EndlessCast dashboard
```

### Cannot access dashboard

1. Check service is running: `sudo systemctl status endlesscast`
2. Open firewall port: `sudo ufw allow YOUR_PORT/tcp`
3. Check cloud provider security group settings

### High CPU during streaming

This is normal — FFmpeg is doing real-time video encoding. Solutions:
- Use a VPS with more CPU cores (4+ recommended for multi-platform)
- Pre-encode videos to the target profile before uploading
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

### v1.3.0 — 2026-03-26

**New Features**
- **Extra Camera (PiP)** — select a second video to overlay as a picture-in-picture in any corner of the stream (top-left, top-right, bottom-left, bottom-right) with configurable size (10–50%)
- **Event Log page** — in-app terminal-style log of all stream events, errors, and reconnects with level filtering (Info / Warn / Error) and auto-refresh
- Enhanced metadata: all page titles and Open Graph tags updated to "EndlessCast"

**Improvements**
- Log entries are now created for: stream start/stop, endpoint live, reconnect attempts, FFmpeg errors, permanent endpoint failures
- All log entries are accessible via the new **Event Log** sidebar page

### v1.2.0 — 2026-03-20

**New Features**
- **Per-endpoint output profiles** — Landscape 1080p, Landscape 720p, Portrait 1080p, Square 1080p (each with tailored FFmpeg encoding args)
- **Auto-reconnect** — up to 3 automatic reconnect attempts per endpoint with 5-second delay; reconnect budget resets after a successful reconnect

**Improvements**
- Profile badge displayed on RTMP endpoint cards
- Reconnecting status shown in endpoint status dashboard
- TypeScript fixes across streaming, storage, and schema layers

### v1.1.0

**New Features**
- Scheduled streams with daily/weekly recurrence
- Playlist support (queue multiple videos)
- Telegram and Email notifications
- 7 color theme presets

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
