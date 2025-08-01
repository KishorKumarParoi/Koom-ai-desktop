import { onStopRecording, selectSources, StartRecording } from "@/lib/recorder";
import { cn, videoRecordingTime } from "@/lib/utils";
import { Cast, Pause, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const StudioTray = () => {
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

  const clearTime = () => {
    setOnTimer("00:00:00");
    setCount(0);
  };

  window.ipcRenderer.on("profile-received", (_, payload) => {
    console.log("Running on Studio-Tray💻: ", payload);
    setOnSources(payload);
  });

  const videoElement = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (onSources && onSources.screen) {
      selectSources(onSources, videoElement);
    }
    return () => {
      selectSources(onSources!, videoElement);
    };
  }, [onSources]);

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
  }, [recording]);

  return onSources ? (
    <div className="flex flex-col justify-end gap-y-5 h-screen draggable">
      {preview && (
        <video
          autoPlay
          ref={videoElement}
          className={cn("w-6/12 self-end bg-white")}
        />
      )}
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
          {recording && (
            <span className="absolute  -right-16 top-1/2 transform -translate-y-1/2 text-white">
              {onTimer}
            </span>
          )}
        </div>

        {!recording ? (
          <Pause
            className="non-draggable opacity-50"
            size={32}
            fill="white"
            stroke="none"
          />
        ) : (
          <Square
            size={32}
            className="non-draggable cursor-pointer hover:scale-110 transform transition duration-150"
            fill="white"
            onClick={() => {
              setRecording(false);
              clearTime();
              onStopRecording();
            }}
            stroke="white"
          />
        )}

        <Cast
          onClick={() => setPreview((prev) => !prev)}
          size={32}
          fill="white"
          className="non-draggable cursor-pointer hover:opacity-60"
          stroke="white"
        />
      </div>
    </div>
  ) : (
    <div>Loading sources...</div>
  );
};

export default StudioTray;
