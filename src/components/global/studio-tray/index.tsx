import { onStopRecording, StartRecording } from "@/lib/recorder";
import { cn, videoRecordingTime } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

const StudioTray = () => {
  const videoElement = useRef<HTMLVideoElement | null>(null);
  const [preview, setPreview] = useState(false);
  const [recording, setRecording] = useState(false);
  const [onTimer, setOnTimer] = useState<string>("00:00:00");
  const [count, setCount] = useState<number>(0);
  const initialTimeRef = useRef<Date | null>(null);

  const [onSources, setOnSources] = useState<
    | {
        screen: string;
        id: string;
        audio: string;
        preset: "HD" | "SD";
        plan: "PRO" | "FREE";
      }
    | undefined
  >(undefined);

  window.ipcRenderer.on("profile-received", (event, payload) => {
    console.log(event);
    setOnSources(payload);
  });

  const clearTime = () => {
    setOnTimer("00:00:00");
    setCount(0);
  };

  useEffect(() => {
    if (!recording) return;
    if (!initialTimeRef.current) {
      initialTimeRef.current = new Date();
    }
    const recordTimeInterval = setInterval(() => {
      if (!initialTimeRef.current) return;
      const time =
        count + (new Date().getTime() - initialTimeRef.current.getTime());
      setCount(time);
      const recordingTime = videoRecordingTime(time);
      if (onSources?.plan === "FREE" && recordingTime.minute == "05") {
        setRecording(false);
        clearTime();
        onStopRecording();
        initialTimeRef.current = null;
      }
      setOnTimer(recordingTime.length);
      if (time <= 0) {
        setOnTimer("00:00:00");
        clearInterval(recordTimeInterval);
        initialTimeRef.current = null;
      }
    }, 1);
    return () => {
      clearInterval(recordTimeInterval);
      initialTimeRef.current = null;
    };
  }, [count, onSources?.plan, recording]);

  return onSources ? (
    <></>
  ) : (
    <div className="flex flex-col justify-end gap-y-5 h-screen draggable">
      <video
        autoPlay
        ref={videoElement}
        className={cn("w-6/12 border-2 self-end", preview ? "hidden" : "")}
      />
      <div className="rounded-full flex justify-around items-center h-20 w-ful border-2 bg-[#171717] draggable border-white/40">
        <div
          onClick={
            onSources
              ? () => {
                  setRecording(true);
                  StartRecording(onSources);
                }
              : undefined
          }
          className={cn(
            "non-draggable rounded-full cursor-pointer relative hover:opacity-80",
            recording ? "bg-red-500 w-6 h-6" : "bg-red-400 w-8 h-8"
          )}
        >
          kkp
          {recording && (
            <span className="absolute  -right-16 top-1/2 transform -translate-y-1/2 text-white">
              {onTimer}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudioTray;
