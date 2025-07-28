import { v4 as uuid } from "uuid";
import { hidePluginWindow } from "./utils";

let videoTransferFileName: string | undefined;
let mediaRecorder: MediaRecorder | undefined;

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

export const onStopRecording = () => mediaRecorder?.stop();

