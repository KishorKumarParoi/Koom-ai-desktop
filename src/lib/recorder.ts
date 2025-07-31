import io from "socket.io-client";
import { v4 as uuid } from "uuid";
import { hidePluginWindow } from "./utils";

let videoTransferFileName: string | undefined;
let mediaRecorder: MediaRecorder | undefined;
let userId: string;

const socket = io(import.meta.env.VITE_SOCKET_URL as string);

export const StartRecording = (
  onSources: {
    screen: string;
    audio: string;
    id: string;
  },
  mediaStream?: MediaStream
) => {
  hidePluginWindow(true);
  videoTransferFileName = `${uuid()}-${onSources?.id.slice(0, 8)}.webm`;
  if (!mediaRecorder) {
    if (!mediaStream) {
      throw new Error("MediaStream is required to initialize MediaRecorder.");
    }
    mediaRecorder = new MediaRecorder(mediaStream);
  }
  mediaRecorder.start(1000);
};

const stopRecording = () => {
  hidePluginWindow(false);
  socket.emit("process-video", {
    filename: videoTransferFileName,
    userId,
  });
};

export const onStopRecording = () => mediaRecorder?.stop();

export const onDataAvailable = (e: BlobEvent) => {
  alert("Running....");
  socket.emit("video-chunks", {
    chunks: e.data,
    filename: videoTransferFileName,
  });
};

export const selectSources = async (
  onSources: {
    screen: string;
    audio: string;
    id: string;
    preset: "HD" | "SD";
  },
  videoElement: React.RefObject<HTMLVideoElement>
) => {
  if (onSources && onSources.screen && onSources.audio && onSources.id) {
    // Clean up previous recorder
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder = undefined;
    }

    // Clean up previous video stream
    if (videoElement?.current?.srcObject) {
      const prevStream = videoElement.current.srcObject as MediaStream;
      prevStream.getTracks().forEach((track) => track.stop());
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const constraints: any = {
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: onSources.screen,
          minWidth: onSources.preset === "HD" ? 1920 : 1280,
          maxWidth: onSources.preset === "HD" ? 1920 : 1280,
          maxHeight: onSources.preset === "HD" ? 1080 : 720,
          minHeight: onSources.preset === "HD" ? 1080 : 720,
          frameRate: 30,
        },
      },
    };

    userId = onSources.id;

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const audioStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: onSources.audio
          ? { deviceId: { exact: onSources.audio } }
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

      // Return the combined stream
      return combinedStream;
    } catch (error) {
      console.error("Error setting up media sources:", error);
    }
  }
};
