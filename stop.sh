#!/bin/bash
# EndlessCast — stop the background server

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
GREEN='\033[0;32m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'

# ── pm2 ──────────────────────────────────────────────────────────────────────
if command -v pm2 &>/dev/null && pm2 describe endlesscast &>/dev/null 2>&1; then
    pm2 stop endlesscast
    echo -e "${GREEN}[✓]${NC} Stopped via pm2."
    exit 0
fi

# ── nohup PID file ────────────────────────────────────────────────────────────
PID_FILE="$SCRIPT_DIR/endlesscast.pid"

if [ ! -f "$PID_FILE" ]; then
    echo -e "${RED}[✗]${NC} No PID file found. Is EndlessCast running?"
    echo -e "${CYAN}[i]${NC} If you started it with 'npm run dev', press Ctrl+C in that terminal."
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
    echo -e "${RED}[✗]${NC} Process $PID not running. Cleaning stale PID file."
    rm -f "$PID_FILE"
fi
