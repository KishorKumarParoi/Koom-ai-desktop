import io, { Socket } from "socket.io-client";
import { v4 as uuid } from "uuid";
import { hidePluginWindow } from "./utils";

let videoTransferFileName: string | undefined;
let mediaRecorder: MediaRecorder | null = null;
let userId: string = "anonymous-user";
const localChunkBackup: Blob[] = [];

// High-resilient socket connection
const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";
export const socket: Socket = io(socketUrl, {
  reconnection: true,
  reconnectionAttempts: 15,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
});

socket.on("connect", () => {
  console.log(`[KoomAI Recorder] 🟢 Connected to Media Engine: ${socketUrl} (ID: ${socket.id})`);
});

socket.on("connect_error", (err) => {
  console.warn(`[KoomAI Recorder] 🟡 Ingestion backend unreachable at ${socketUrl}: ${err.message}. Local backup active.`);
});

socket.on("processing-complete", (data) => {
  console.log(`[KoomAI Recorder] ✅ Processing complete for ${data.filename}`);
});

socket.on("processing-error", (data) => {
  console.error(`[KoomAI Recorder] 🔴 Processing failed for ${data.filename}:`, data.error);
});

export const StartRecording = (
  onSources: {
    screen: string;
    audio: string;
    id: string;
  },
  stream: MediaStream
) => {
  hidePluginWindow(true);
  videoTransferFileName = `${uuid()}-${onSources?.id ? onSources.id.slice(0, 8) : "session"}.webm`;
  localChunkBackup.length = 0; // Clear previous recording buffer

  if (!stream) {
    console.error("[KoomAI Recorder] No active media stream provided.");
    return;
  }

  try {
    // Determine supported MIME type
    const mimeType = MediaRecorder.isTypeSupported("video/webm; codecs=vp9")
      ? "video/webm; codecs=vp9"
      : MediaRecorder.isTypeSupported("video/webm; codecs=vp8")
      ? "video/webm; codecs=vp8"
      : "video/webm";

    mediaRecorder = new MediaRecorder(stream, { mimeType });
    mediaRecorder.ondataavailable = onDataAvailable;
    mediaRecorder.onstop = stopRecording;

    // Emit slice every 1000ms for continuous streaming
    mediaRecorder.start(1000);
    console.log(`[KoomAI Recorder] Recording started: ${videoTransferFileName} (${mimeType})`);
  } catch (err) {
    console.error("[KoomAI Recorder] Failed to start MediaRecorder:", err);
  }
};

export const onStopRecording = () => {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
};

const stopRecording = () => {
  hidePluginWindow(false);
  console.log(`[KoomAI Recorder] Recording stopped. Emitting process-video for ${videoTransferFileName}`);

  socket.emit("process-video", {
    filename: videoTransferFileName,
    userId,
  });

  // Local fallback: Offer direct download if socket disconnected
  if (!socket.connected && localChunkBackup.length > 0) {
    console.log("[KoomAI Recorder] Backend offline. Generating local emergency download...");
    try {
      const blob = new Blob(localChunkBackup, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = videoTransferFileName || "recording.webm";
      a.click();
    } catch (e) {
      console.warn("Failed to trigger local download:", e);
    }
  }
};

export const onDataAvailable = (e: BlobEvent) => {
  if (!e.data || e.data.size === 0) return;

  localChunkBackup.push(e.data);

  if (socket.connected) {
    socket.emit("video-chunks", {
      chunks: e.data,
      filename: videoTransferFileName,
    });
  } else {
    console.warn(`[KoomAI Recorder] Socket offline; buffered chunk locally (${e.data.size} bytes)`);
  }
};

export const selectSources = async (
  onSources: {
    screen: string;
    audio: string;
    id: string;
    preset: "HD" | "SD";
  },
  videoElement: React.RefObject<HTMLVideoElement>
): Promise<MediaStream | null> => {
  if (onSources && onSources.screen && onSources.audio && onSources.id) {
    const isHD = onSources.preset === "HD";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const constraints: any = {
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: onSources.screen,
          minWidth: isHD ? 1920 : 1280,
          maxWidth: isHD ? 1920 : 1280,
          maxHeight: isHD ? 1080 : 720,
          minHeight: isHD ? 1080 : 720,
          frameRate: 30,
        },
      },
    };

    userId = onSources.id;

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const audioStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: onSources?.audio
          ? { deviceId: { exact: onSources.audio }, echoCancellation: true, noiseSuppression: true }
          : false,
      });

      if (videoElement && videoElement.current) {
        videoElement.current.srcObject = stream;
        await videoElement.current.play();
      }

      const combinedStream = new MediaStream([
        ...stream.getTracks(),
        ...audioStream.getTracks(),
      ]);

      return combinedStream;
    } catch (error) {
      console.error("[KoomAI Recorder] Error setting up media sources:", error);
    }
  }
  return null;
};
