# EndlessCast Deployment Guide

## Quick Install (One-Line Command)

```bash
curl -fsSL https://raw.githubusercontent.com/leksautomate/EndlessCast/main/install.sh -o install.sh && chmod +x install.sh && ./install.sh
```

Or step by step:

```bash
# Download the installation script
curl -fsSL https://raw.githubusercontent.com/leksautomate/EndlessCast/main/install.sh -o install.sh

# Make it executable
chmod +x install.sh

# Run the installer
./install.sh
```

---

## Full Installation (Clone Repository)

```bash
# Clone the repository
git clone https://github.com/leksautomate/EndlessCast.git

# Navigate to the directory
cd EndlessCast

# Run the installer
chmod +x install.sh
./install.sh
```

---

## What the Installer Does

The interactive installer will:

1. **Check System Requirements**
   - Node.js 18+
   - npm
   - FFmpeg (required for streaming)

2. **Port Selection**
   - Choose from 8 preset ports (3000, 4000, 5000, 8000, 8080, 8888, 9000, 9090)
   - Or enter a custom port (1024-65535)
   - Shows which ports are available/in use

3. **Install Dependencies**
   - Runs `npm install` automatically

4. **Create Startup Scripts**
   - `start.sh` - Launch script with your selected port
   - `endlesscast.service` - Systemd service file for auto-start

---

## Starting EndlessCast

### Development Mode

```bash
./start.sh
```

### Production Mode (Build First)

```bash
# Build the application
npm run build

# Start in production mode
npm run start
```

### As a System Service (24/7 Operation)

```bash
# Copy the service file
sudo cp endlesscast.service /etc/systemd/system/

# Enable auto-start on boot
sudo systemctl enable endlesscast

# Start the service
sudo systemctl start endlesscast

# Check status
sudo systemctl status endlesscast

# View logs
sudo journalctl -u endlesscast -f
```

---

## Replit Deployment

If deploying on Replit:

1. Click **Publish** button (top right)
2. Select **Autoscale** deployment type
3. Build and run commands are pre-configured:
   - Build: `npm run build`
   - Run: `npm run start`
4. Click **Publish**

---

## System Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Node.js | 18.x | 20.x |
| RAM | 1 GB | 2 GB+ |
| Storage | 10 GB | 200 GB+ |
| FFmpeg | Required | Required |

---

## Installing Prerequisites

### Ubuntu/Debian

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install FFmpeg
sudo apt install -y ffmpeg

# Install Git
sudo apt install -y git

# Verify installations
node --version
npm --version
ffmpeg -version
```

### CentOS/RHEL

```bash
# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Install FFmpeg
sudo yum install -y epel-release
sudo yum install -y ffmpeg

# Install Git
sudo yum install -y git
```

### macOS

```bash
# Using Homebrew
brew install node@20 ffmpeg git
```

---

## Login Credentials

During installation, you'll be prompted to set up your admin credentials:

**Option 1: Custom Credentials (Recommended)**
- Choose your own username and password
- Password is securely hashed with bcrypt
- Credentials are saved to `.env` file

**Option 2: Default Credentials (Not recommended)**

| Field | Value |
|-------|-------|
| **Username** | `admin` |
| **Password** | `admin123` |

**Important:** If using defaults, change the password immediately after first login.

---

## Environment Variables (Optional)

Create a `.env` file for custom configuration:

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (set automatically by installer) |
| `MINIO_ENDPOINT` | MinIO/S3 endpoint URL |
| `MINIO_ACCESS_KEY` | MinIO access key |
| `MINIO_SECRET_KEY` | MinIO secret key |
| `MINIO_BUCKET` | MinIO bucket name |

---

## Nginx Reverse Proxy (Optional)

For production with custom domain and HTTPS:

```bash
# Install Nginx
sudo apt install -y nginx

# Create configuration
sudo nano /etc/nginx/sites-available/endlesscast
```

Add this configuration:

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

Enable and start:

```bash
sudo ln -s /etc/nginx/sites-available/endlesscast /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## HTTPS with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your_domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## Firewall Configuration

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find what's using the port
sudo lsof -i :5000

# Kill the process
sudo kill -9 <PID>
```

### FFmpeg Not Found

```bash
# Verify installation
ffmpeg -version

# Ubuntu/Debian
sudo apt install -y ffmpeg

# CentOS/RHEL
sudo yum install -y ffmpeg
```

### Service Won't Start

```bash
# Check service logs
sudo journalctl -u endlesscast -n 50

# Verify permissions
ls -la start.sh
chmod +x start.sh

# Check if node is installed
which node
node --version
```

### Permission Denied on Uploads

```bash
mkdir -p uploads
chmod 755 uploads
```

### High CPU During Streaming

This is normal - FFmpeg uses significant CPU for video encoding. Solutions:
- Use a VPS with more CPU cores
- Reduce video resolution before upload
- Limit simultaneous streams

---

## Updating EndlessCast

```bash
cd EndlessCast
git pull origin main
npm install
npm run build
sudo systemctl restart endlesscast
```

---

## Support

- **Repository:** https://github.com/leksautomate/EndlessCast
- **Issues:** https://github.com/leksautomate/EndlessCast/issues
