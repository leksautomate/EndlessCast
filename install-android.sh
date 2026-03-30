#!/data/data/com.termux/files/usr/bin/bash

# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║                     ENDLESSCAST ANDROID INSTALLER                         ║
# ║                  For Termux — 24/7 Multi-Platform Broadcasting             ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'
BOLD='\033[1m'

print_step()    { echo -e "${CYAN}[>]${NC} $1"; }
print_success() { echo -e "${GREEN}[✓]${NC} $1"; }
print_error()   { echo -e "${RED}[✗]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_info()    { echo -e "${BLUE}[i]${NC} $1"; }

echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                           ║"
echo "║         ENDLESSCAST — ANDROID / TERMUX INSTALLER                         ║"
echo "║                   24/7 Multi-Platform Broadcasting                        ║"
echo "║                                                                           ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ── Termux check ──────────────────────────────────────────────────────────────
if [ ! -d "/data/data/com.termux" ]; then
    print_warning "This script is designed for Termux on Android."
    print_warning "For Linux/VPS, use install.sh instead."
    read -p "Continue anyway? (y/n): " CONT
    [[ "$CONT" =~ ^[Yy]$ ]] || exit 1
fi

# ── Step 1: Update packages & install dependencies ────────────────────────────
print_step "Updating Termux packages..."
pkg update -y 2>&1 | tail -5
print_success "Packages updated."

echo ""
print_step "Installing required packages (nodejs, ffmpeg)..."

pkg install -y nodejs ffmpeg 2>&1 | tail -10
print_success "nodejs and ffmpeg installed."

echo ""

# ── Step 2: Verify installs ───────────────────────────────────────────────────
print_step "Verifying installs..."

if command -v node &>/dev/null; then
    print_success "Node.js $(node -v)"
else
    print_error "Node.js not found after install. Try: pkg install nodejs"
    exit 1
fi

if command -v ffmpeg &>/dev/null; then
    FFVER=$(ffmpeg -version 2>&1 | head -n1 | awk '{print $3}')
    print_success "FFmpeg $FFVER"
else
    print_error "FFmpeg not found after install. Try: pkg install ffmpeg"
    exit 1
fi

echo ""

# ── Step 3: Port selection ────────────────────────────────────────────────────
print_step "Port Configuration"
echo ""
echo -e "${BOLD}Select a port to run EndlessCast:${NC}"
echo ""
PORTS=(3000 4000 5000 8000 8080 8888 9000 9090)

echo -e "${CYAN}┌─────────────────────────────────────────────────────────────┐${NC}"
echo -e "${CYAN}│  #   PORT                                                   │${NC}"
echo -e "${CYAN}├─────────────────────────────────────────────────────────────┤${NC}"
for i in "${!PORTS[@]}"; do
    printf "${CYAN}│${NC}  %-2s  %-6s                                              ${CYAN}│${NC}\n" "$((i+1))" "${PORTS[$i]}"
done
echo -e "${CYAN}│${NC}  9   Custom port                                           ${CYAN}│${NC}"
echo -e "${CYAN}└─────────────────────────────────────────────────────────────┘${NC}"
echo ""

while true; do
    read -p "Enter your choice (1-9) [default: 3]: " PORT_CHOICE
    PORT_CHOICE=${PORT_CHOICE:-3}

    if [[ "$PORT_CHOICE" == "9" ]]; then
        read -p "Enter custom port (1024-65535): " CUSTOM_PORT
        if [[ "$CUSTOM_PORT" =~ ^[0-9]+$ ]] && [ "$CUSTOM_PORT" -ge 1024 ] && [ "$CUSTOM_PORT" -le 65535 ]; then
            SELECTED_PORT=$CUSTOM_PORT
            break
        else
            print_error "Invalid port number."
            continue
        fi
    elif [[ "$PORT_CHOICE" =~ ^[1-8]$ ]]; then
        SELECTED_PORT=${PORTS[$((PORT_CHOICE-1))]}
        break
    else
        print_error "Invalid choice. Please enter 1-9."
    fi
done

print_success "Port $SELECTED_PORT selected."
echo ""

# ── Step 4: Login credentials ─────────────────────────────────────────────────
print_step "Login Credentials Setup"
echo ""
echo -e "${CYAN}┌─────────────────────────────────────────────────────────────┐${NC}"
echo -e "${CYAN}│  1   Use custom credentials ${GREEN}(Recommended)${NC}                  ${CYAN}│${NC}"
echo -e "${CYAN}│  2   Use defaults ${YELLOW}(admin / admin123)${NC}                     ${CYAN}│${NC}"
echo -e "${CYAN}└─────────────────────────────────────────────────────────────┘${NC}"
echo ""
read -p "Enter your choice (1-2) [default: 1]: " CRED_CHOICE
CRED_CHOICE=${CRED_CHOICE:-1}

if [[ "$CRED_CHOICE" == "1" ]]; then
    read -p "Enter admin username: " ADMIN_USERNAME
    ADMIN_USERNAME=${ADMIN_USERNAME:-admin}
    while true; do
        read -s -p "Enter admin password (min 6 chars): " ADMIN_PASSWORD
        echo ""
        if [ ${#ADMIN_PASSWORD} -lt 6 ]; then
            print_error "Password must be at least 6 characters."
            continue
        fi
        read -s -p "Confirm password: " ADMIN_PASSWORD_CONFIRM
        echo ""
        if [ "$ADMIN_PASSWORD" != "$ADMIN_PASSWORD_CONFIRM" ]; then
            print_error "Passwords do not match."
            continue
        fi
        break
    done
    USING_DEFAULTS=false
else
    ADMIN_USERNAME="admin"
    ADMIN_PASSWORD="admin123"
    print_warning "Using defaults — change after first login!"
    USING_DEFAULTS=true
fi

print_step "Generating password hash..."
PASSWORD_HASH=$(node -e "const bcrypt=require('bcrypt');bcrypt.hash('$ADMIN_PASSWORD',10).then(h=>console.log(h))" 2>/dev/null || true)
if [ -z "$PASSWORD_HASH" ]; then
    print_warning "Could not generate hash. Using default auth."
else
    print_success "Password hash generated."
fi

echo ""

# ── Step 5: Install npm dependencies ─────────────────────────────────────────
print_step "Installing npm dependencies..."

if [ ! -f "package.json" ]; then
    print_error "package.json not found. Run this script from the EndlessCast directory."
    exit 1
fi

npm install 2>&1 | tail -5
print_success "npm dependencies installed."

echo ""

# ── Step 6: Write .env ────────────────────────────────────────────────────────
print_step "Writing .env..."

cat > .env << ENVEOF
# EndlessCast Configuration — Android/Termux
PORT=$SELECTED_PORT
ADMIN_USERNAME=$ADMIN_USERNAME
PASSWORD_HASH=$PASSWORD_HASH
NODE_ENV=production
ENVEOF

print_success ".env written."
echo ""

# ── Step 7: Generate start/stop/status scripts ───────────────────────────────
print_step "Generating management scripts..."
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ── start-android.sh ──────────────────────────────────────────────────────────
cat > start-android.sh << 'STARTEOF'
#!/data/data/com.termux/files/usr/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"
source .env 2>/dev/null || true
export PORT=${PORT:-5000}

GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; NC='\033[0m'

echo -e "${GREEN}Starting EndlessCast on port $PORT...${NC}"

# Remove CPU time limit so FFmpeg child processes are not killed by SIGXCPU (exit 152)
ulimit -t unlimited 2>/dev/null || true

PID_FILE="$SCRIPT_DIR/endlesscast.pid"

if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
        echo -e "${YELLOW}[!]${NC} Already running (PID $OLD_PID). Use stop-android.sh first."
        exit 1
    fi
fi

# Acquire Termux wake lock to prevent Android from killing the process
if command -v termux-wake-lock &>/dev/null; then
    termux-wake-lock
    echo -e "${CYAN}[i]${NC} Termux wake lock acquired — Android won't kill the process."
fi

nohup node_modules/.bin/tsx server/index.ts \
    > "$SCRIPT_DIR/endlesscast.log" 2>&1 &

NEW_PID=$!
echo "$NEW_PID" > "$PID_FILE"

sleep 2
if kill -0 "$NEW_PID" 2>/dev/null; then
    echo -e "${GREEN}[✓]${NC} EndlessCast running (PID $NEW_PID)"
    echo -e "${GREEN}[✓]${NC} Open in browser: http://localhost:$PORT"
    echo -e "${CYAN}[i]${NC} Logs:  tail -f $SCRIPT_DIR/endlesscast.log"
    echo -e "${CYAN}[i]${NC} Stop:  ./stop-android.sh"
else
    echo -e "\033[0;31m[✗]\033[0m Failed to start. Check endlesscast.log:"
    tail -20 "$SCRIPT_DIR/endlesscast.log"
    exit 1
fi
STARTEOF
chmod +x start-android.sh

# ── stop-android.sh ───────────────────────────────────────────────────────────
cat > stop-android.sh << 'STOPEOF'
#!/data/data/com.termux/files/usr/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
GREEN='\033[0;32m'; RED='\033[0;31m'; NC='\033[0m'

if command -v termux-wake-unlock &>/dev/null; then
    termux-wake-unlock
fi

PID_FILE="$SCRIPT_DIR/endlesscast.pid"
if [ ! -f "$PID_FILE" ]; then
    echo -e "${RED}[✗]${NC} No PID file found. Is EndlessCast running?"
    exit 1
fi

PID=$(cat "$PID_FILE")
if kill -0 "$PID" 2>/dev/null; then
    kill "$PID"
    sleep 1
    kill -9 "$PID" 2>/dev/null || true
    rm -f "$PID_FILE"
    echo -e "${GREEN}[✓]${NC} EndlessCast stopped (PID $PID)."
else
    echo -e "${RED}[✗]${NC} Process not running. Cleaning up."
    rm -f "$PID_FILE"
fi
STOPEOF
chmod +x stop-android.sh

# ── status-android.sh ─────────────────────────────────────────────────────────
cat > status-android.sh << 'STATEOF'
#!/data/data/com.termux/files/usr/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/.env" 2>/dev/null || true
PORT=${PORT:-5000}
GREEN='\033[0;32m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'

echo ""
echo -e "${CYAN}EndlessCast Status (Android/Termux)${NC}"
echo "────────────────────────────────────"

PID_FILE="$SCRIPT_DIR/endlesscast.pid"
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo -e "  Status : ${GREEN}RUNNING${NC} (PID $PID)"
        echo -e "  Port   : $PORT"
        echo -e "  Access : http://localhost:$PORT"
        echo -e "  Logs   : tail -f $SCRIPT_DIR/endlesscast.log"
    else
        echo -e "  Status : ${RED}STOPPED${NC} (stale PID file)"
    fi
else
    echo -e "  Status : ${RED}NOT RUNNING${NC}"
fi
echo ""
STATEOF
chmod +x status-android.sh

print_success "Created start-android.sh / stop-android.sh / status-android.sh"
echo ""

# ── Step 8: Summary ───────────────────────────────────────────────────────────
echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║                    INSTALLATION COMPLETE!                                 ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${BOLD}Configuration:${NC}"
echo -e "  ${CYAN}•${NC} Port:     ${GREEN}$SELECTED_PORT${NC}"
echo -e "  ${CYAN}•${NC} Username: ${GREEN}$ADMIN_USERNAME${NC}"
if [ "$USING_DEFAULTS" = true ]; then
    echo -e "  ${CYAN}•${NC} Password: ${YELLOW}admin123${NC} ${RED}← Change this!${NC}"
else
    echo -e "  ${CYAN}•${NC} Password: ${GREEN}(as configured)${NC}"
fi
echo ""

echo -e "${BOLD}Important — keep Termux alive:${NC}"
echo -e "  ${YELLOW}•${NC} In Termux notification: tap ${BOLD}Acquire wakelock${NC}"
echo -e "  ${YELLOW}•${NC} In Android battery settings: set Termux to ${BOLD}Unrestricted${NC}"
echo -e "  ${YELLOW}•${NC} Do NOT swipe Termux away from recents"
echo ""

echo -e "${BOLD}Management:${NC}"
echo -e "  ${CYAN}Start:${NC}   ./start-android.sh"
echo -e "  ${CYAN}Stop:${NC}    ./stop-android.sh"
echo -e "  ${CYAN}Status:${NC}  ./status-android.sh"
echo -e "  ${CYAN}Logs:${NC}    tail -f endlesscast.log"
echo ""

read -p "Start EndlessCast now? (y/n) [default: y]: " START_NOW
START_NOW=${START_NOW:-y}
if [[ "$START_NOW" =~ ^[Yy]$ ]]; then
    echo ""
    ./start-android.sh
fi
