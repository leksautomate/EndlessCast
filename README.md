# EndlessCast

24/7 Multi-Platform Broadcasting Platform

Stream your videos continuously to YouTube Live, Facebook Live, Rumble, Odysee, Twitter/X, and custom RTMP destinations.

## Features

- 24/7 continuous video streaming with automatic looping
- Multi-platform simultaneous broadcasting (up to 6+ endpoints)
- 200GB storage capacity for up to 16 videos
- Real-time stream health monitoring
- 7 color theme presets (Matrix, Cyber Blue, Sunset, etc.)
- Email and Telegram notifications
- Mobile-responsive hacker/terminal aesthetic
- Configurable stream duration

## System Requirements

- **Node.js** 18+ (recommended: 20.x)
- **npm** 8+
- **FFmpeg** (required for video streaming)
- **Linux** (Ubuntu 20.04+ recommended)

### Install FFmpeg (if not installed)

```bash
# Ubuntu/Debian
sudo apt update && sudo apt install ffmpeg -y

# CentOS/RHEL
sudo yum install ffmpeg -y

# macOS
brew install ffmpeg
```

## Quick Install

### One-Line Installation

```bash
curl -fsSL https://raw.githubusercontent.com/leksautomate/EndlessCast/main/install.sh -o install.sh && chmod +x install.sh && ./install.sh
```

### Clone and Install

```bash
git clone https://github.com/leksautomate/EndlessCast.git
cd EndlessCast
chmod +x install.sh
./install.sh
```

## Firewall Configuration

After installation, you must open your selected port in the firewall:

```bash
# UFW (Ubuntu)
sudo ufw allow YOUR_PORT/tcp
sudo ufw reload

# Or using iptables
sudo iptables -A INPUT -p tcp --dport YOUR_PORT -j ACCEPT
```

**Cloud Providers:** Also configure security groups/firewall rules in your provider's control panel (AWS, DigitalOcean, Contabo, etc.)

## Running as a Service

Install EndlessCast as a systemd service for automatic startup:

```bash
sudo cp endlesscast.service /etc/systemd/system/
sudo systemctl enable endlesscast
sudo systemctl start endlesscast
```

### Service Commands

```bash
# Check status
sudo systemctl status endlesscast

# View logs
sudo journalctl -u endlesscast -f

# Restart
sudo systemctl restart endlesscast

# Stop
sudo systemctl stop endlesscast
```

## Manual Start

```bash
# Using start script
./start.sh

# Or directly with npm
PORT=5050 npm run dev
```

## Default Credentials

- **Username:** admin
- **Password:** admin123

The installer allows you to set custom credentials during setup.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `ADMIN_USERNAME` | Admin username | admin |
| `PASSWORD_HASH` | Bcrypt password hash | (hash of admin123) |
| `MINIO_ENDPOINT` | MinIO CDN endpoint (optional) | - |
| `MINIO_ACCESS_KEY` | MinIO access key (optional) | - |
| `MINIO_SECRET_KEY` | MinIO secret key (optional) | - |
| `MINIO_BUCKET` | MinIO bucket name (optional) | - |

## Notifications Setup

EndlessCast can send you alerts via Telegram and Email when streams fail or the server crashes.

### Telegram Notifications

1. Create a Telegram bot via [@BotFather](https://t.me/BotFather)
2. Get your bot token (e.g., `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
3. Get your Chat ID by messaging [@userinfobot](https://t.me/userinfobot)
4. Go to **Settings > Telegram** in EndlessCast
5. Enter your Bot Token and Chat ID
6. Enable notifications for: Start, Stop, and/or Errors
7. Click **Test Connection** to verify

### Email Notifications (Gmail)

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password: [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Go to **Settings > Email** in EndlessCast
4. Enter your Gmail address and App Password
5. Enable "Notify on Error"
6. Click **Test Connection** to verify

### What You'll Be Notified About

- **Stream Started** - When streaming begins
- **Stream Stopped** - When streaming ends
- **Stream Error** - When a stream to a platform fails
- **Server Crash** - When the server encounters a critical error
- **Server Restart** - When the server comes back online

## Troubleshooting

### Server Crashes After Hours of Streaming

If your server crashes and data is lost:

1. **Update to latest version** - We added persistent storage that saves all data to disk
   ```bash
   cd ~/EndlessCast
   git pull
   sudo systemctl restart endlesscast
   ```

2. **Check memory usage** - Long streams may use more memory
   ```bash
   free -h
   htop
   ```

3. **View crash logs**
   ```bash
   sudo journalctl -u endlesscast --since "1 hour ago"
   ```

### Cannot Access Dashboard (Connection Timeout)

1. **Check if service is running**
   ```bash
   sudo systemctl status endlesscast
   ```

2. **Open firewall port**
   ```bash
   sudo ufw allow YOUR_PORT/tcp
   sudo ufw reload
   ```

3. **Check cloud provider firewall** - AWS, DigitalOcean, Contabo, etc. have separate security group settings

### Stream Keeps Stopping

1. **Check FFmpeg logs**
   ```bash
   sudo journalctl -u endlesscast -f
   ```

2. **Verify RTMP credentials** - Stream keys expire on some platforms

3. **Check internet connection**
   ```bash
   ping -c 5 google.com
   ```

## Supported Platforms

- YouTube Live
- Facebook Live
- Rumble
- Odysee
- Twitter/X
- Custom RTMP endpoints

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend:** Express.js, TypeScript
- **Streaming:** FFmpeg
- **Storage:** Local filesystem (optional MinIO CDN)

## License

MIT License

## Support

For issues and feature requests, please open an issue on GitHub.
