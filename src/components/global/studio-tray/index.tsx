import { onStopRecording, selectSources, StartRecording } from "@/lib/recorder";
import { cn, videoRecordingTime } from "@/lib/utils";
import { Cast, Pause, PictureInPicture2, Square } from "lucide-react";
import { SetStateAction, useEffect, useRef, useState } from "react";

const StudioTray = () => {
  const videoElement = useRef<HTMLVideoElement | null>(null);
  const [preview, setPreview] = useState(false);
  const [recording, setRecording] = useState(false);
  const [onTimer, setOnTimer] = useState<string>("00:00:00");
  const [count, setCount] = useState<number>(0);
  const initialTimeRef = useRef<Date | null>(null);
  const [combinedStream, setCombinedStream] = useState<MediaStream | null>(
    null
  );
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

  const [isPiP, setIsPiP] = useState(false);

  const clearTime = () => {
    setOnTimer("00:00:00");
    setCount(0);
  };

  const togglePiP = async () => {
    if (!videoElement.current) {
      console.error("Video element not available");
      return;
    }

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        console.log("Exited Picture-in-Picture");
      } else {
        await videoElement.current.requestPictureInPicture();
        console.log("Entered Picture-in-Picture");
      }
    } catch (error) {
      console.error("PiP error:", error);
    }
  };

  useEffect(() => {
    const handleProfileReceived = (
      _: any,
      payload: SetStateAction<
        | {
            screen: string;
            id: string;
            audio: string;
            preset: "HD" | "SD";
            plan: "PRO" | "FREE";
          }
        | undefined
      >
    ) => {
      console.log("Running on Studio-Tray💻: ", payload);
      setOnSources(payload);
    };

    window.ipcRenderer.on("profile-received", handleProfileReceived);

    return () => {
      window.ipcRenderer.off("profile-received", handleProfileReceived);
    };
  }, []);

  useEffect(() => {
    const setupSources = async () => {
      if (preview && onSources && onSources.screen && onSources.audio) {
        try {
          // Clean up previous streams
          if (combinedStream) {
            combinedStream.getTracks().forEach((track) => track.stop());
          }

          const stream = await selectSources(onSources, videoElement);
          setCombinedStream(stream);
          console.log("Sources setup successfully, preview ready");
        } catch (error) {
          console.error("Error setting up sources:", error);
        }
      } else if (!preview && combinedStream) {
        console.log("🛑 Cleaning up preview stream...");
        combinedStream.getTracks().forEach((track) => track.stop());
        setCombinedStream(null);

        // Clear video element
        if (videoElement.current) {
          videoElement.current.srcObject = null;
        }
      }
    };

    setupSources();

    // Cleanup function
    return () => {
      if (videoElement.current?.srcObject) {
        const stream = videoElement.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onSources?.screen, onSources?.audio, onSources?.preset, preview]);

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

      if (onSources?.plan === "FREE" && recordingTime.minute === "05") {
        setRecording(false);
        clearTime();
        onStopRecording();
        initialTimeRef.current = null;
      }

      setOnTimer(recordingTime.length);
    }, 1000);

    return () => {
      clearInterval(recordTimeInterval);
      initialTimeRef.current = null;
    };
  }, [recording, count, onSources?.plan]);

  // ✅ Updated event listeners for PiP only
  useEffect(() => {
    const handlePiPChange = () => {
      setIsPiP(!!document.pictureInPictureElement);
      console.log("PiP state changed:", !!document.pictureInPictureElement);
    };

    // Only listen for PiP events
    document.addEventListener("enterpictureinpicture", handlePiPChange);
    document.addEventListener("leavepictureinpicture", handlePiPChange);

    return () => {
      document.removeEventListener("enterpictureinpicture", handlePiPChange);
      document.removeEventListener("leavepictureinpicture", handlePiPChange);
    };
  }, []);

  return onSources ? (
    <div className="flex flex-col justify-end gap-y-5 h-screen draggable">
      {/* ✅ Regular Preview */}
      {preview && (
        <div className="relative w-6/12 self-end">
          <video
            autoPlay
            muted
            ref={videoElement}
            className={cn(
              "w-full bg-black rounded-lg border-2 border-white/20",
              "shadow-lg"
            )}
            // style={{
            //   transform: "scaleX(-1)", // ✅ Mirror effect for better preview
            // }}
          />

          {/* Video Controls Overlay */}
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              onClick={togglePiP}
              className="non-draggable bg-black/50 hover:bg-black/70 cursor-pointer text-white p-2 rounded-lg transition-all"
              title="Picture in Picture"
            >
              <PictureInPicture2
                size={16}
                className={isPiP ? "text-green-400" : "text-white"}
              />
            </button>
          </div>
        </div>
      )}

      {/* ✅ Studio Tray Controls */}
      <div className="rounded-full flex justify-around items-center h-20 w-full border-2 bg-[#171717] draggable border-white/40">
        {/* Record Button */}
        <div
          onClick={() => {
            if (onSources && combinedStream) {
              setRecording(true);
              StartRecording(onSources, combinedStream);
              console.log("Recording started");
            } else {
              console.error("No sources or stream available");
            }
          }}
          className={cn(
            "non-draggable rounded-full cursor-pointer relative hover:opacity-80 transition-all",
            recording
              ? "bg-red-500 w-6 h-6 animate-pulse"
              : "bg-red-400 w-8 h-8"
          )}
        >
          {recording && (
            <span className="absolute -right-16 top-1/2 transform -translate-y-1/2 text-white text-sm font-mono">
              {onTimer}
            </span>
          )}
        </div>

        {/* Pause/Stop Button */}
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
              console.log("Recording stopped");
            }}
            stroke="white"
          />
        )}

        {/* Cast Button */}
        <Cast
          onClick={() => {
            setPreview((prev) => {
              const newPreview = !prev;
              console.log(`📺 Preview ${newPreview ? "enabled" : "disabled"}`);
              return newPreview;
            });
          }}
          size={32}
          fill={preview ? "#10B981" : "white"}
          className="non-draggable cursor-pointer hover:opacity-60 transition-all"
          stroke={preview ? "#10B981" : "white"}
        />
      </div>
    </div>
  ) : (
    <div className="flex items-center justify-center h-screen text-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
        <div>Loading sources...</div>
      </div>
    </div>
  );
};

export default StudioTray;
