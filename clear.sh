#!/usr/bin/env bash
# ==============================================================================
# 🛑 ZERO-COST TEARDOWN SCRIPT FOR KOOMAI DESKTOP CLIENT
# Cleanly terminates Electron processes and frees port 5173
# ==============================================================================

set -eo pipefail

BOLD='\033[1m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

PORT="${PORT:-5173}"

echo -e "${YELLOW}${BOLD}[*] Teardown: Stopping KoomAI Desktop Client & Vite Dev Server...${NC}"

# Kill process on port 5173
if command -v lsof &>/dev/null; then
    PIDS=$(lsof -ti ":${PORT}" 2>/dev/null || true)
    if [ -n "$PIDS" ]; then
        echo -e "  ${RED}✖${NC} Terminating process on port ${PORT} (PID: ${PIDS})..."
        kill -9 $PIDS 2>/dev/null || true
    fi
fi

# Kill any lingering Electron instances for koom-ai-desktop
pkill -f "electron.*koom-ai-desktop" 2>/dev/null || true
pkill -f "vite.*5173" 2>/dev/null || true

echo -e "\n${GREEN}${BOLD}🎉 KoomAI Desktop Client terminated cleanly. Port ${PORT} is free! ($0.00 footprint)${NC}\n"
