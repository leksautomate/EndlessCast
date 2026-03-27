#!/bin/bash
# EndlessCast — restart the server

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'

# ── pm2 ──────────────────────────────────────────────────────────────────────
if command -v pm2 &>/dev/null && pm2 describe endlesscast &>/dev/null 2>&1; then
    pm2 restart endlesscast
    echo -e "${GREEN}[✓]${NC} Restarted via pm2."
    exit 0
fi

# ── nohup fallback ────────────────────────────────────────────────────────────
echo -e "${CYAN}[>]${NC} Stopping..."
"$SCRIPT_DIR/stop.sh" 2>/dev/null || true
sleep 1
echo -e "${CYAN}[>]${NC} Starting..."
"$SCRIPT_DIR/start.sh"
