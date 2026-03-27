#!/bin/bash
# EndlessCast — check server status

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
[ -f "$SCRIPT_DIR/.env" ] && source "$SCRIPT_DIR/.env"
PORT=${PORT:-5000}

GREEN='\033[0;32m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'

echo ""
echo -e "${CYAN}EndlessCast Status${NC}"
echo "────────────────────────────────────────────"

# ── pm2 ──────────────────────────────────────────────────────────────────────
if command -v pm2 &>/dev/null && pm2 describe endlesscast &>/dev/null 2>&1; then
    pm2 show endlesscast
    echo ""
    echo -e "${CYAN}[i]${NC} Access: http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'your-ip'):${PORT}"
    exit 0
fi

# ── nohup PID file ────────────────────────────────────────────────────────────
PID_FILE="$SCRIPT_DIR/endlesscast.pid"
LOG_FILE="$SCRIPT_DIR/endlesscast.log"

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo -e "  Status  : ${GREEN}RUNNING${NC} (PID $PID)"
        echo -e "  Port    : $PORT"
        echo -e "  Access  : http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'your-ip'):${PORT}"
        [ -f "$LOG_FILE" ] && echo -e "  Logs    : tail -f $LOG_FILE"
    else
        echo -e "  Status  : ${RED}STOPPED${NC} (stale PID file — run ./start.sh to restart)"
        rm -f "$PID_FILE"
    fi
else
    echo -e "  Status  : ${RED}NOT RUNNING${NC}"
    echo -e "  Start   : ./start.sh"
fi
echo ""
