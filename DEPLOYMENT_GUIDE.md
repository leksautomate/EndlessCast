# EndlessCast - Production Deployment Guide

Complete guide for deploying EndlessCast to an Ubuntu VPS. This application enables 24/7 multi-platform RTMP streaming with video looping capabilities.

## System Architecture

EndlessCast consists of:
- **Frontend**: React + Vite (SPA)
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL (via Neon/standard PostgreSQL)
- **Video Storage**: Local file system (uploads directory)
- **Video Processing**: FFmpeg (for RTMP streaming)
- **Authentication**: Session-based with bcrypt

---

## Prerequisites

### Server Requirements
- **OS**: Ubuntu 20.04 LTS or newer
- **RAM**: Minimum 4GB (8GB+ recommended for multiple streams)
- **CPU**: 2+ cores (4+ cores recommended)
- **Storage**: 50GB+ (for video files)
- **Bandwidth**: High-speed connection for streaming

### Required Services
- SSH access to your server
- PostgreSQL database (local or hosted like Neon)
- Domain name (optional, but recommended for HTTPS)

---

## Part 1: Initial Server Setup

### Step 1: Connect to Your VPS

```bash
ssh root@your_vps_ip
# or
ssh your_username@your_vps_ip
```

### Step 2: Update System Packages

```bash
sudo apt update && sudo apt upgrade -y
```

### Step 3: Install Node.js (v18 or newer)

```bash
# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version
```

### Step 4: Install FFmpeg

FFmpeg is critical for video processing and RTMP streaming.

```bash
sudo apt install -y ffmpeg

# Verify installation
ffmpeg -version
```

### Step 5: Install Git

```bash
sudo apt install -y git
```

### Step 6: Install PostgreSQL (if hosting database locally)

> **Note**: Skip this if using a hosted database like Neon.

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql

# In PostgreSQL shell:
CREATE DATABASE endlesscast;
CREATE USER endlesscast_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE endlesscast TO endlesscast_user;
\q
```

---

## Part 2: Clone and Configure Application

### Step 1: Clone Repository

```bash
cd /opt
sudo git clone https://github.com/leksautomate/EndlessCast.git
cd EndlessCast

# Set proper ownership
sudo chown -R $USER:$USER /opt/EndlessCast
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

Create `.env` file:

```bash
nano .env
```

Add the following configuration:

```env
# Node Environment
NODE_ENV=production
PORT=5000

# Database Configuration
DATABASE_URL=postgresql://username:password@host:5432/endlesscast

# Authentication
# Generate password hash: node -e "const bcrypt=require('bcrypt');bcrypt.hash('your_admin_password',10).then(h=>console.log(h))"
PASSWORD_HASH=$2b$10$YOUR_GENERATED_BCRYPT_HASH_HERE

# Session Secret (generate with: openssl rand -base64 32)
SESSION_SECRET=your_very_long_random_session_secret_here

# Optional: Email Notifications (Gmail)
GMAIL_ADDRESS=your_email@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password
```

**Important Configuration Steps:**

**Generate Password Hash:**
```bash
node -e "const bcrypt=require('bcrypt');bcrypt.hash('your_admin_password',10).then(h=>console.log(h))"
```
Copy the output to `PASSWORD_HASH` in `.env`

**Generate Session Secret:**
```bash
openssl rand -base64 32
```
Copy the output to `SESSION_SECRET` in `.env`

**Database URL Format:**
- Local PostgreSQL: `postgresql://endlesscast_user:password@localhost:5432/endlesscast`
- Neon Database: `postgresql://user:password@ep-xxx.region.aws.neon.tech/endlesscast?sslmode=require`

### Step 4: Create Uploads Directory

```bash
# Push database schema
npm run db:push
```

### Step 6: Create Uploads Directory

```bash
mkdir -p uploads
chmod 755 uploads
```

---

## Part 4: Build Application

### Step 1: Build for Production

```bash
npm run build
```

This creates:
- Server bundle: `dist/index.cjs`
- Frontend assets: `dist/public/`

### Step 2: Test Production Build

```bash
npm start
```

Visit `http://your_vps_ip:5000` to verify it works.

**Default login credentials**: 
- Password: The password you set when generating `PASSWORD_HASH`

Press `Ctrl+C` to stop.

---

## Part 5: Set Up Systemd Service

### Step 1: Create Service File

```bash
sudo nano /etc/systemd/system/endlesscast.service
```

Paste this configuration:

```ini
[Unit]
Description=EndlessCast Streaming Service
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/opt/EndlessCast
Environment="NODE_ENV=production"
EnvironmentFile=/opt/EndlessCast/.env
ExecStart=/usr/bin/node dist/index.cjs
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

# Security
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

**Replace `YOUR_USERNAME`** with your actual Linux username.

### Step 2: Enable and Start Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable endlesscast
sudo systemctl start endlesscast
```

### Step 3: Verify Service Status

```bash
sudo systemctl status endlesscast
```

### Step 4: View Logs

```bash
# Real-time logs
sudo journalctl -u endlesscast -f

# Last 50 lines
sudo journalctl -u endlesscast -n 50

# Logs from today
sudo journalctl -u endlesscast --since today
```

---

## Part 6: Nginx Reverse Proxy (Recommended)

### Step 1: Install Nginx

```bash
sudo apt install -y nginx
```

### Step 2: Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/endlesscast
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name your_domain.com;  # Replace with your domain or VPS IP

    # Increase upload size for large video files
    client_max_body_size 5G;
    client_body_timeout 3600s;
    proxy_connect_timeout 3600s;
    proxy_send_timeout 3600s;
    proxy_read_timeout 3600s;
    send_timeout 3600s;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts for long uploads
        proxy_request_buffering off;
    }
}
```

### Step 3: Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/endlesscast /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Access your app at: `http://your_domain.com` or `http://your_vps_ip`

---

## Part 7: HTTPS with Let's Encrypt (Recommended)

### Step 1: Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Step 2: Get SSL Certificate

```bash
sudo certbot --nginx -d your_domain.com
```

Follow the prompts. Certbot will automatically update your Nginx configuration.

### Step 3: Auto-Renewal

Certbot automatically sets up renewal. Test it:

```bash
sudo certbot renew --dry-run
```

Your app is now accessible at: `https://your_domain.com` 🔒

---

## Part 8: Firewall Configuration

### Step 1: Enable UFW Firewall

```bash
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable
sudo ufw status
```

---

## Part 9: Application Management

### View Logs
```bash
# EndlessCast logs
sudo journalctl -u endlesscast -f

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Restart Services
```bash
# Restart EndlessCast
sudo systemctl restart endlesscast

# Restart Nginx
sudo systemctl restart nginx

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Stop Services
```bash
sudo systemctl stop endlesscast
sudo systemctl stop nginx
```

### Update Application
```bash
cd /opt/EndlessCast
git pull origin main
npm install
npm run build
sudo systemctl restart endlesscast
```

---

## Part 10: Security Best Practices

### 1. Secure SSH Access

```bash
# Disable root login and password authentication
sudo nano /etc/ssh/sshd_config
```

Set:
```
PermitRootLogin no
PasswordAuthentication no
```

Restart SSH:
```bash
sudo systemctl restart sshd
```

### 2. Regular Updates

```bash
# Update system weekly
sudo apt update && sudo apt upgrade -y

# Update EndlessCast monthly
cd /opt/EndlessCast
git pull
npm install
npm run build
sudo systemctl restart endlesscast
```

### 3. Backup Strategy

**Database Backup:**
```bash
# Create backup script
sudo nano /usr/local/bin/backup-endlesscast.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/backups/endlesscast"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U endlesscast_user endlesscast > $BACKUP_DIR/db_$DATE.sql

# Backup uploads directory
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /opt/EndlessCast/uploads

# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
chmod +x /usr/local/bin/backup-endlesscast.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-endlesscast.sh
```

### 4. Monitor Disk Space

```bash
# Check disk usage
df -h

# Check uploads directory
du -sh /opt/EndlessCast/uploads
```

### 5. Set Up Log Rotation

```bash
# Configure journald to limit log size
sudo nano /etc/systemd/journald.conf
```

Set:
```
SystemMaxUse=500M
MaxRetentionSec=7day
```

Restart journald:
```bash
sudo systemctl restart systemd-journald
```

---

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 5000
sudo lsof -i :5000

# Kill process
sudo kill -9 <PID>

# Or change port in .env
PORT=5001
```

### FFmpeg Not Found
```bash
# Verify FFmpeg installation
which ffmpeg
ffmpeg -version

# Reinstall if missing
sudo apt install -y ffmpeg
```

### Database Connection Error
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -U endlesscast_user -d endlesscast -h localhost

# Check DATABASE_URL in .env
cat /opt/EndlessCast/.env | grep DATABASE_URL
```


### Permission Denied on Uploads
```bash
# Fix permissions
sudo chown -R $USER:$USER /opt/EndlessCast/uploads
chmod 755 /opt/EndlessCast/uploads
```

### Application Won't Start
```bash
# Check detailed logs
sudo journalctl -u endlesscast -n 100 --no-pager

# Check if dependencies are installed
cd /opt/EndlessCast
npm install

# Rebuild application
npm run build
```

### High CPU Usage During Streaming
This is normal - FFmpeg uses significant CPU for video encoding. Solutions:
- Use a VPS with more CPU cores
- Reduce video resolution before upload
- Reduce number of simultaneous streams
- Consider using hardware-accelerated encoding

### Stream Keeps Disconnecting
```bash
# Check logs for errors
sudo journalctl -u endlesscast -f

# Verify RTMP URL and stream key
# Check network bandwidth
# Verify FFmpeg is running (ps aux | grep ffmpeg)
```

---

## Production Checklist

- [ ] Install Node.js, FFmpeg, and Git
- [ ] Set up PostgreSQL database
- [ ] Clone repository
- [ ] Configure `.env` with all credentials
- [ ] Generate password hash and session secret
- [ ] Create uploads directory
- [ ] Run database migrations (`npm run db:push`)
- [ ] Build application (`npm run build`)
- [ ] Test application locally
- [ ] Create systemd service
- [ ] Configure Nginx reverse proxy
- [ ] Set up HTTPS with Let's Encrypt
- [ ] Configure firewall (UFW)
- [ ] Set up automated backups
- [ ] Configure log rotation
- [ ] Test streaming to RTMP platforms
- [ ] Monitor logs and performance

---

## Performance Optimization

### For Better Streaming Performance:

1. **Increase System Limits**
```bash
sudo nano /etc/security/limits.conf
```
Add:
```
* soft nofile 65536
* hard nofile 65536
```

2. **Optimize Network Stack**
```bash
sudo nano /etc/sysctl.conf
```
Add:
```
net.core.rmem_max=134217728
net.core.wmem_max=134217728
net.ipv4.tcp_rmem=4096 87380 67108864
net.ipv4.tcp_wmem=4096 65536 67108864
```

Apply:
```bash
sudo sysctl -p
```

3. **Monitor System Resources**
```bash
# Install htop for better monitoring
sudo apt install -y htop

# Monitor in real-time
htop
```

---

## Support & Additional Resources

### Useful Commands

**Check all service statuses:**
```bash
sudo systemctl status endlesscast postgresql nginx
```

**View all logs together:**
```bash
sudo journalctl -u endlesscast -u postgresql -f
```

**Test streaming to YouTube:**
- Get your stream URL and key from YouTube Studio → Go Live
- Add RTMP endpoint in EndlessCast dashboard
- Upload a video and start streaming

**Generate new admin password:**
```bash
node -e "const bcrypt=require('bcrypt');bcrypt.hash('new_password',10).then(h=>console.log(h))"
# Update PASSWORD_HASH in .env
sudo systemctl restart endlesscast
```

---

## Architecture Overview

```
┌─────────────────┐
│   Users         │
│  (Browsers)     │
└────────┬────────┘
         │ HTTPS
┌────────▼────────┐
│  Nginx          │
│  (Reverse Proxy)│
└────────┬────────┘
         │
┌────────▼──────────────────┐
│  EndlessCast Application  │
│  ┌─────────┬──────────┐   │
│  │ Frontend│ Backend  │   │
│  │ (React) │(Express) │   │
│  └─────────┴──────────┘   │
└─────┬──────────┬──────────┘
      │          │
      │          ├─────────────► PostgreSQL
      │          │               (Database)
      │          │
      │          ├─────────────► uploads/
      │          │               (Video Storage)
      │          │
      │          └─────────────► FFmpeg
      │                          (Video Processing)
      │
      └────────────────────────► RTMP Platforms
                                 (YouTube, Facebook, etc.)
```

---

**Your EndlessCast streaming server is now production-ready! 🚀**

For issues or questions, check the logs first:
```bash
sudo journalctl -u endlesscast -f
```
