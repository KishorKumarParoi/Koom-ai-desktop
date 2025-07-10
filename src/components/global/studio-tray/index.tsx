import { cn } from "@/lib/utils";
import { useRef, useState } from "react";

const StudioTray = () => {
  const videoElement = useRef<HTMLVideoElement | null>(null);
  const [preview, setPreview] = useState(false);
  const [recording, setRecording] = useState(false);
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
  return (
    <div className="flex flex-col justify-end gap-y-5 h-screen draggable">
      <video
        autoPlay
        ref={videoElement}
        className={cn("w-6/12 border-2 self-end", preview ? "hidden" : "")}
      />
      <div className="rounded-full flex justify-around items-center h-20 w-fit border-2 bg-[#171717] draggable border-white/40">
        <div
          onClick={
            onSources
              ? () => {
                  setRecording(true);
                }
              : undefined
          }
        ></div>
      </div>
    </div>
  );
};

export default StudioTray;
