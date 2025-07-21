import { v4 as uuid } from "uuid";
import { hidePluginWindow } from "./utils";

let videoTransferFileName: string | undefined;
let mediaRecorder: MediaRecorder;

export const StartRecording = (onSources: {
  screen: string;
  audio: string;
  id: string;
}) => {
  hidePluginWindow(true);
  videoTransferFileName = `${uuid()}-${onSources?.id.slice(0, 8)}.webm`;
  mediaRecorder.start(1000);
};
