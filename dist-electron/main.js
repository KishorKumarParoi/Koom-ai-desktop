import { app, BrowserWindow, ipcMain, desktopCapturer } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_CONFIG = {
  APP_ROOT: path.join(__dirname, ".."),
  VITE_DEV_SERVER_URL: process.env["VITE_DEV_SERVER_URL"],
  get MAIN_DIST() {
    return path.join(this.APP_ROOT, "dist-electron");
  },
  get RENDERER_DIST() {
    return path.join(this.APP_ROOT, "dist");
  },
  get VITE_PUBLIC() {
    return this.VITE_DEV_SERVER_URL ? path.join(this.APP_ROOT, "public") : this.RENDERER_DIST;
  }
};
process.env.APP_ROOT = ENV_CONFIG.APP_ROOT;
process.env.VITE_PUBLIC = ENV_CONFIG.VITE_PUBLIC;
const windows = {
  main: null,
  studio: null,
  floatingWebCam: null
};
const createWindowConfig = (width, height, options = {}) => ({
  width,
  height,
  frame: false,
  transparent: true,
  alwaysOnTop: true,
  hasShadow: false,
  icon: path.join(ENV_CONFIG.VITE_PUBLIC, "electron-vite.svg"),
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    devTools: true,
    preload: path.join(__dirname, "preload.mjs")
  },
  ...options
});
const createMainWindow = () => {
  const config = createWindowConfig(500, 600, {
    minHeight: 600,
    minWidth: 300,
    focusable: true
  });
  windows.main = new BrowserWindow(config);
  configureWindowBehavior(windows.main);
  windows.main.webContents.on("did-finish-load", () => {
    var _a;
    (_a = windows.main) == null ? void 0 : _a.webContents.send("main-process-message", {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      type: "window-ready",
      window: "main"
    });
  });
  return windows.main;
};
const createStudioWindow = () => {
  const config = createWindowConfig(400, 300, {
    minHeight: 70,
    maxHeight: 400,
    minWidth: 300,
    maxWidth: 400,
    focusable: false
  });
  windows.studio = new BrowserWindow(config);
  configureWindowBehavior(windows.studio);
  windows.studio.webContents.on("did-finish-load", () => {
    var _a;
    (_a = windows.studio) == null ? void 0 : _a.webContents.send("main-process-message", {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      type: "window-ready",
      window: "studio"
    });
  });
  return windows.studio;
};
const createFloatingWebCamWindow = () => {
  const config = createWindowConfig(400, 200, {
    minHeight: 70,
    maxHeight: 400,
    minWidth: 300,
    maxWidth: 400,
    focusable: false
  });
  windows.floatingWebCam = new BrowserWindow(config);
  configureWindowBehavior(windows.floatingWebCam);
  return windows.floatingWebCam;
};
const configureWindowBehavior = (window) => {
  window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  window.setAlwaysOnTop(true, "screen-saver", 1);
};
const loadWindowURLs = () => {
  const urls = getWindowURLs();
  try {
    if (windows.main) {
      windows.main.loadURL(urls.main);
    }
    if (windows.studio) {
      windows.studio.loadURL(urls.studio);
    }
    if (windows.floatingWebCam) {
      windows.floatingWebCam.loadURL(urls.webcam);
    }
  } catch (error) {
    console.error("❌ Failed to load window URLs:", error);
  }
};
const getWindowURLs = () => {
  if (ENV_CONFIG.VITE_DEV_SERVER_URL) {
    return {
      main: ENV_CONFIG.VITE_DEV_SERVER_URL,
      studio: `${"http://localhost:5173"}/studio.html`,
      webcam: `${"http://localhost:5173"}/webcam.html`
    };
  }
  return {
    main: path.join(ENV_CONFIG.RENDERER_DIST, "index.html"),
    studio: path.join(ENV_CONFIG.RENDERER_DIST, "studio.html"),
    webcam: path.join(ENV_CONFIG.RENDERER_DIST, "webcam.html")
  };
};
const createAllWindows = () => {
  try {
    createMainWindow();
    createStudioWindow();
    createFloatingWebCamWindow();
    loadWindowURLs();
    console.log("✅ All windows created successfully");
  } catch (error) {
    console.error("❌ Failed to create windows:", error);
  }
};
const closeAllWindows = () => {
  Object.values(windows).forEach((window) => {
    if (window && !window.isDestroyed()) {
      window.close();
    }
  });
  windows.main = null;
  windows.studio = null;
  windows.floatingWebCam = null;
};
const setupIpcHandlers = () => {
  ipcMain.on("closeApp", () => {
    console.log("📤 Close app requested");
    if (process.platform !== "darwin") {
      closeAllWindows();
      app.quit();
    } else {
      setTimeout(() => {
        app.quit();
      }, 500);
    }
  });
  ipcMain.handle("getSources", async () => {
    try {
      console.log("📤 Getting desktop sources...");
      const sources = await desktopCapturer.getSources({
        thumbnailSize: { height: 100, width: 150 },
        fetchWindowIcons: true,
        types: ["window", "screen"]
      });
      console.log(`✅ Found ${sources.length} sources`);
      return sources;
    } catch (error) {
      console.error("❌ Failed to get sources:", error);
      throw error;
    }
  });
  ipcMain.handle("getResources", async () => {
    try {
      console.log("📤 Getting desktop resources...");
      const sources = await desktopCapturer.getSources({
        types: ["screen", "window"]
      });
      const resources = sources.map((source) => ({
        id: source.id,
        name: source.name,
        thumbnail: source.thumbnail.toDataURL(),
        appIcon: source.appIcon ? source.appIcon.toDataURL() : null
      }));
      console.log(`✅ Processed ${resources.length} resources`);
      return resources;
    } catch (error) {
      console.error("❌ Failed to get resources:", error);
      throw error;
    }
  });
  ipcMain.on("media-sources", (event, payload) => {
    try {
      console.log("📡 Received media sources:", payload);
      if (!payload || typeof payload !== "object") {
        console.error("❌ Invalid media sources payload:", payload);
        return;
      }
      const requiredFields = ["screen", "id", "audio"];
      const missingFields = requiredFields.filter((field) => !payload[field]);
      if (missingFields.length > 0) {
        console.error("❌ Missing required fields:", missingFields);
        return;
      }
      if (windows.studio && !windows.studio.isDestroyed()) {
        windows.studio.webContents.send("profile-received", payload);
        console.log("✅ Media sources sent to studio window");
      } else {
        console.error("❌ Studio window not available");
      }
    } catch (error) {
      console.error("❌ Error handling media sources:", error);
    }
  });
  ipcMain.on("resize-studio", (event, payload) => {
    try {
      if (!windows.studio || windows.studio.isDestroyed()) {
        console.error("❌ Studio window not available for resize");
        return;
      }
      const { shrink } = payload;
      const newSize = shrink ? [400, 100] : [400, 250];
      windows.studio.setSize(newSize[0], newSize[1]);
      console.log(`✅ Studio window resized to ${newSize[0]}x${newSize[1]}`);
    } catch (error) {
      console.error("❌ Error resizing studio window:", error);
    }
  });
  ipcMain.on("hide-plugin", (event, payload) => {
    try {
      if (windows.main && !windows.main.isDestroyed()) {
        windows.main.webContents.send("hide-plugin", payload);
        console.log("✅ Hide plugin message sent to main window");
      } else {
        console.error("❌ Main window not available");
      }
    } catch (error) {
      console.error("❌ Error hiding plugin:", error);
    }
  });
  ipcMain.on("get-media-sources", (event) => {
    try {
      console.log(
        "📤 Media sources requested, sending current configuration..."
      );
      const defaultConfig = {
        screen: "default-screen",
        id: "session-" + Date.now(),
        audio: "default-audio",
        preset: "SD",
        plan: "FREE"
      };
      event.sender.send("profile-received", defaultConfig);
      console.log("✅ Default media sources sent");
    } catch (error) {
      console.error("❌ Error sending media sources:", error);
    }
  });
};
const setupAppEvents = () => {
  app.whenReady().then(() => {
    console.log("🚀 App ready, creating windows...");
    createAllWindows();
    setupIpcHandlers();
  });
  app.on("window-all-closed", () => {
    console.log("🪟 All windows closed");
    if (process.platform !== "darwin") {
      closeAllWindows();
      app.quit();
    }
  });
  app.on("activate", () => {
    console.log("🔄 App activated");
    if (BrowserWindow.getAllWindows().length === 0) {
      createAllWindows();
    }
  });
  app.on("before-quit", () => {
    console.log("🛑 App quitting...");
    closeAllWindows();
  });
};
const initializeApp = () => {
  console.log("🚀 Initializing Electron application...");
  console.log("📁 App root:", ENV_CONFIG.APP_ROOT);
  console.log(
    "🌐 Dev server:",
    ENV_CONFIG.VITE_DEV_SERVER_URL || "Production mode"
  );
  setupAppEvents();
};
initializeApp();
export {
  ENV_CONFIG,
  windows
};
