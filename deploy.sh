#!/usr/bin/env bash
# ==============================================================================
# 🖥️ KOOMAI CROSS-PLATFORM DESKTOP CLIENT DEPLOYMENT SCRIPT
# ElectronJS + Vite + React 18 Studio Tray & Camera Overlay
# ==============================================================================

set -eo pipefail

BOLD='\033[1m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PORT="${PORT:-5173}"

echo -e "${CYAN}${BOLD}"
cat << "EOF"
================================================================================
  🖥️ KOOMAI DESKTOP CLIENT & STUDIO TRAY (ELECTRON + VITE)
  Automated Runner & Dev Environment
================================================================================
EOF
echo -e "${NC}"

# 1. Kill any existing process on port 5173
if command -v lsof &>/dev/null; then
    OCCUPIED_PID=$(lsof -ti ":${PORT}" 2>/dev/null || true)
    if [ -n "$OCCUPIED_PID" ]; then
        echo -e "${YELLOW}[i] Port ${PORT} occupied by PID ${OCCUPIED_PID}. Terminating...${NC}"
        kill -9 $OCCUPIED_PID 2>/dev/null || true
        sleep 1
    fi
fi

# 2. Check Package Manager
if command -v bun &>/dev/null; then
    PKG_MGR="bun"
elif command -v npm &>/dev/null; then
    PKG_MGR="npm"
else
    echo -e "${RED}[ERROR] Neither bun nor npm found. Please install node/bun.${NC}"
    exit 1
fi

echo -e "${GREEN}[✓] Using package runtime: ${PKG_MGR}${NC}"

# 3. Ensure dependencies installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}[+] Installing desktop client dependencies...${NC}"
    $PKG_MGR install
fi

# 4. Check if KoomAI Express Backend is reachable
EXPRESS_URL="http://localhost:5001/health"
if curl -s -m 1 "$EXPRESS_URL" >/dev/null 2>&1; then
    echo -e "${GREEN}[✓] KoomAI Express Ingestion Backend is active at http://localhost:5001${NC}"
else
    echo -e "${YELLOW}[!] Warning: KoomAI Express Backend (:5001) not detected.${NC}"
    echo -e "    To start backend: cd ../koom-ai-express && ./deploy.sh --daemon"
fi

# 5. Launch Option
if [ "$1" = "--build" ]; then
    echo -e "${CYAN}[*] Compiling production desktop binary via electron-builder...${NC}"
    $PKG_MGR run build
    echo -e "${GREEN}[✓] Production binaries generated in dist/ and release/${NC}"
elif [ "$1" = "--web" ]; then
    echo -e "${CYAN}[*] Starting Vite web preview server on http://localhost:${PORT}...${NC}"
    $PKG_MGR run dev -- --port "${PORT}"
else
    echo -e "${CYAN}[*] Launching Electron Native Desktop Client + Vite Dev Server...${NC}"
    $PKG_MGR run dev
fi
