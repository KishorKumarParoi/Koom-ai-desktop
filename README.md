# 🖥️ KoomAI Desktop — Cross-Platform Screen Recording Studio

[![Electron](https://img.shields.io/badge/Electron-v30.0-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Vite](https://img.shields.io/badge/Vite-v5.1-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-v18.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.2-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Client-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4.1-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

> Native desktop screen recorder and studio tray client for the **KoomAI Enterprise Video Platform**. Features hardware-accelerated 60 FPS recording, floating circular webcam overlay, real-time chunk streaming to the Express ingestion backend, and Clerk authentication.

---

## ⚡ Quickstart Runbooks

### 1. Launch in Development Mode (Native Electron + Vite Dev Server)
```bash
./deploy.sh
```

### 2. Launch Vite Web Preview Mode (Port 5173)
```bash
./deploy.sh --web
```

### 3. Build Production Native Installers (.dmg / .exe / .AppImage)
```bash
./deploy.sh --build
```

### 4. Clean Process Teardown
```bash
./clear.sh
```

---

## 🔗 Multi-Platform Connectivity

- **Ingestion Backend (`VITE_SOCKET_URL`)**: Streams real-time binary chunks to `http://localhost:5001`.
- **Web App Cockpit (`VITE_HOST_URL`)**: Syncs with Next.js 16 platform at `http://localhost:3000/api`.
- **Authentication**: Seamless Clerk JWT single-sign-on matching web user credentials.

---

## 🔧 Environment Variables (`.env`)

```ini
VITE_CLERK_PUBLISHABLE_KEY="pk_test_aW1tb3J0YWwtY2F0LTUzLmNsZXJrLmFjY291bnRzLmRldiQ"
VITE_HOST_URL=http://localhost:3000/api
VITE_APP_URL=http://localhost:5173
VITE_SOCKET_URL=http://localhost:5001/
NODE_ENV="development"
```

---

## 🏛️ Architecture & System Design
For full multi-process specifications and sequence flows, refer to [ARCHITECTURE.md](file:///Users/kishorkumarparoi/job-project/koom-ai-desktop/ARCHITECTURE.md).
