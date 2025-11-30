# Loop Streamer - Ubuntu VPS Deployment Guide

This guide walks you through deploying Loop Streamer on an Ubuntu VPS server.

## Prerequisites

- Ubuntu 20.04 LTS or newer
- A VPS with at least 2GB RAM
- SSH access to your server
- A domain name (optional, but recommended)

## Step 1: Connect to Your VPS

```bash
ssh root@your_vps_ip
# or
ssh username@your_vps_ip
```

## Step 2: Install Required Dependencies

Update system packages:
```bash
sudo apt update
sudo apt upgrade -y
```

Install Node.js (v18 or newer):
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify installation:
```bash
node --version
npm --version
```

Install FFmpeg (required for video streaming):
```bash
sudo apt install -y ffmpeg
```

Verify FFmpeg:
```bash
ffmpeg -version
```

Install Git:
```bash
sudo apt install -y git
```

## Step 3: Clone and Setup the Application

Navigate to a suitable directory:
```bash
cd /home/username
# or use /opt/loopstreamer if deploying as a service
```

Clone your repository:
```bash
git clone https://github.com/your-username/loop-streamer.git
cd loop-streamer
```

Install dependencies:
```bash
npm install
```

## Step 4: Build the Application

Create a production build:
```bash
npm run build
```

This generates:
- Backend bundle: `dist/server.js`
- Frontend assets: `dist/public/`

## Step 5: Set Environment Variables

Create a `.env` file in the project root:
```bash
nano .env
```

Add the following:
```
NODE_ENV=production
PORT=3000
SESSION_SECRET=your_very_long_random_secret_here
```

Generate a secure session secret:
```bash
openssl rand -base64 32
```

Copy the output and paste it as `SESSION_SECRET` in your `.env` file.

Save and exit (Ctrl+X, then Y, then Enter).

## Step 6: Create an Uploads Directory

```bash
mkdir -p uploads
chmod 755 uploads
```

## Step 7: Test the Application

Run the production build:
```bash
node dist/server.js
```

You should see output like:
```
Server running on port 3000
```

Open your browser and go to: `http://your_vps_ip:3000`

If everything works, stop the server with `Ctrl+C`.

## Step 8: Set Up as a Systemd Service (Recommended)

This ensures your app auto-starts and stays running.

Create a systemd service file:
```bash
sudo nano /etc/systemd/system/loopstreamer.service
```

Paste this configuration:
```ini
[Unit]
Description=Loop Streamer Service
After=network.target

[Service]
Type=simple
User=username
WorkingDirectory=/home/username/loop-streamer
Environment="NODE_ENV=production"
EnvironmentFile=/home/username/loop-streamer/.env
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Replace `username` with your actual Linux username.

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable loopstreamer
sudo systemctl start loopstreamer
```

Check status:
```bash
sudo systemctl status loopstreamer
```

View logs:
```bash
sudo journalctl -u loopstreamer -f
```

## Step 9: Set Up Reverse Proxy with Nginx (Recommended)

Install Nginx:
```bash
sudo apt install -y nginx
```

Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/loopstreamer
```

Paste this:
```nginx
server {
    listen 80;
    server_name your_domain_or_ip;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Replace `your_domain_or_ip` with your domain or VPS IP.

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/loopstreamer /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Your app is now accessible at `http://your_domain_or_ip`

## Step 10: Set Up HTTPS (with Let's Encrypt)

Install Certbot:
```bash
sudo apt install -y certbot python3-certbot-nginx
```

Get SSL certificate:
```bash
sudo certbot --nginx -d your_domain
```

Follow the prompts. Certbot will automatically update your Nginx configuration.

Your app is now accessible at `https://your_domain`

## Storage Considerations

**Video uploads are stored in:** `uploads/` directory

For larger deployments, consider:
1. Mounting an external drive: `sudo mount /dev/sdb1 /mnt/storage`
2. Creating a symlink: `ln -s /mnt/storage/uploads uploads`
3. Using cloud storage integration (future enhancement)

## Managing the Application

### View logs
```bash
sudo journalctl -u loopstreamer -f
```

### Restart service
```bash
sudo systemctl restart loopstreamer
```

### Stop service
```bash
sudo systemctl stop loopstreamer
```

### Update application
```bash
cd /home/username/loop-streamer
git pull
npm install
npm run build
sudo systemctl restart loopstreamer
```

## Troubleshooting

### Port already in use
If port 3000 is already in use, change it in `.env`:
```
PORT=3001
```

### FFmpeg not found
Verify installation:
```bash
which ffmpeg
ffmpeg -version
```

If missing, reinstall:
```bash
sudo apt install -y ffmpeg
```

### Permission denied on uploads
Fix permissions:
```bash
chmod 755 uploads
chmod 644 uploads/*
```

### Application won't start
Check logs:
```bash
sudo journalctl -u loopstreamer -n 50
```

### High CPU usage during streaming
FFmpeg uses CPU for encoding. This is normal. Consider:
- Reducing video resolution before upload
- Using faster FFmpeg preset (already set to `veryfast`)
- Using a VPS with more CPU cores

## Security Recommendations

1. **Use a firewall:**
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

2. **Keep system updated:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

3. **Monitor disk space:**
   ```bash
   df -h
   ```

4. **Set up log rotation:**
   ```bash
   sudo journalctl --vacuum=time=7d
   ```

5. **Back up your data regularly**

## Production Checklist

- [ ] Install Node.js and FFmpeg
- [ ] Clone repository and install dependencies
- [ ] Create `.env` file with secure SESSION_SECRET
- [ ] Build the application
- [ ] Test locally
- [ ] Set up systemd service
- [ ] Set up Nginx reverse proxy
- [ ] Set up HTTPS with Let's Encrypt
- [ ] Configure firewall
- [ ] Monitor logs and performance
- [ ] Set up automated backups

## Support & Troubleshooting

For issues specific to your deployment:
1. Check systemd logs: `sudo journalctl -u loopstreamer -f`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify FFmpeg: `ffmpeg -version`
4. Test connectivity: `curl http://localhost:3000`

---

**Your Loop Streamer is now live and ready to broadcast to multiple platforms 24/7!**
