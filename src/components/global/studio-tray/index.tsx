/* eslint-disable @typescript-eslint/no-explicit-any */
import { onStopRecording, selectSources, StartRecording } from "@/lib/recorder";
import { cn, videoRecordingTime } from "@/lib/utils";
import {
  Cast,
  Maximize,
  Pause,
  PictureInPicture2,
  Square,
  X,
} from "lucide-react";
import { SetStateAction, useEffect, useRef, useState } from "react";

const StudioTray = () => {
  const videoElement = useRef<HTMLVideoElement | null>(null);
  const fullscreenVideoElement = useRef<HTMLVideoElement | null>(null);
  const [preview, setPreview] = useState(false);
  const [recording, setRecording] = useState(false);
  const [onTimer, setOnTimer] = useState<string>("00:00:00");
  const [count, setCount] = useState<number>(0);
  const initialTimeRef = useRef<Date | null>(null);
  const [combinedStream, setCombinedStream] = useState<MediaStream | null>(
    null
  );

  // ✅ Add muted state for proper React state management
  const [isMuted, setIsMuted] = useState(true); // Start muted (default for autoplay)

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
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Mouse movement handler
  const handleMouseMove = () => {
    setShowControls(true);

    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  };

  const clearTime = () => {
    setOnTimer("00:00:00");
    setCount(0);
  };

  // ✅ Enhanced toggle mute function
  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);

    // Apply to both video elements
    if (videoElement.current) {
      videoElement.current.muted = newMutedState;
    }
    if (fullscreenVideoElement.current) {
      fullscreenVideoElement.current.muted = newMutedState;
    }

    console.log(`Video ${newMutedState ? "muted" : "unmuted"}`);
  };

  const togglePiP = async () => {
    const currentVideo = isFullscreen
      ? fullscreenVideoElement.current
      : videoElement.current;

    if (!currentVideo) {
      console.error("Video element not available");
      return;
    }

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        console.log("Exited Picture-in-Picture");
      } else {
        await currentVideo.requestPictureInPicture();
        console.log("Entered Picture-in-Picture");
      }
    } catch (error) {
      console.error("PiP error:", error);
    }
  };

  // ✅ Enhanced fullscreen toggle function with immediate state management
  const toggleFullscreen = async () => {
    try {
      if (isFullscreen) {
        // ✅ Immediately set state to false to hide black container
        setIsFullscreen(false);

        // Then exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
        console.log("Requesting fullscreen exit");
      } else {
        // Enter fullscreen - Set state first to render container
        setIsFullscreen(true);

        // Wait for DOM update then request fullscreen on container
        await new Promise((resolve) => setTimeout(resolve, 50));

        const fullscreenContainer = document.querySelector(
          ".fullscreen-container"
        ) as any;

        if (fullscreenContainer) {
          try {
            if (fullscreenContainer.requestFullscreen) {
              await fullscreenContainer.requestFullscreen();
            } else if (fullscreenContainer.webkitRequestFullscreen) {
              await fullscreenContainer.webkitRequestFullscreen();
            } else if (fullscreenContainer.mozRequestFullScreen) {
              await fullscreenContainer.mozRequestFullScreen();
            } else if (fullscreenContainer.msRequestFullscreen) {
              await fullscreenContainer.msRequestFullscreen();
            }
            console.log("Fullscreen requested successfully");
          } catch (error) {
            console.error("Fullscreen request failed:", error);
            setIsFullscreen(false); // Reset if fullscreen fails
          }
        } else {
          console.error("Fullscreen container not found");
          setIsFullscreen(false);
        }
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    if (!window.ipcRenderer) {
      console.error("❌ IPC Renderer not available!");
    }

    const fallbackTimer = setTimeout(() => {
      if (!onSources) {
        console.warn("⚠️ No sources received after 5s, using fallback data");
        setOnSources({
          screen: "mock-screen-id",
          id: "mock-session-id",
          audio: "mock-audio-id",
          preset: "SD",
          plan: "FREE",
        });
      }
    }, 5000);

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
      clearTimeout(fallbackTimer);
      console.log("Profile received 💻: ", payload);
      setOnSources(payload);
    };

    window.ipcRenderer.on("profile-received", handleProfileReceived);

    return () => {
      clearTimeout(fallbackTimer);
      if (window.ipcRenderer) {
        window.ipcRenderer.off("profile-received", handleProfileReceived);
      }
    };
  }, [onSources]);

  // ✅ Enhanced setupSources effect
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

        // Clear both video elements
        if (videoElement.current) {
          videoElement.current.srcObject = null;
        }
        if (fullscreenVideoElement.current) {
          fullscreenVideoElement.current.srcObject = null;
        }
      }
    };

    setupSources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSources?.screen, onSources?.audio, onSources?.preset, preview]);

  // ✅ Enhanced video stream assignment with mute state sync
  useEffect(() => {
    if (combinedStream) {
      // Assign stream to current video element
      if (videoElement.current) {
        videoElement.current.srcObject = combinedStream;
        videoElement.current.muted = isMuted; // Sync mute state
      }
      if (fullscreenVideoElement.current) {
        fullscreenVideoElement.current.srcObject = combinedStream;
        fullscreenVideoElement.current.muted = isMuted; // Sync mute state
      }
    }
  }, [combinedStream, isFullscreen, isMuted]);

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

  // ✅ Enhanced event listeners with debouncing
  useEffect(() => {
    const handlePiPChange = () => {
      setIsPiP(!!document.pictureInPictureElement);
      console.log("PiP state changed:", !!document.pictureInPictureElement);
    };

    // ✅ Simplified fullscreen change handler
    const handleFullscreenChange = () => {
      const fullscreenElement =
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement;

      // ✅ Only sync state if browser fullscreen is active but React state is false
      // This handles cases where fullscreen was triggered by other means (F11, etc.)
      if (!!fullscreenElement && !isFullscreen) {
        console.log("Browser entered fullscreen externally");
        setIsFullscreen(true);
      } else if (!fullscreenElement && isFullscreen) {
        console.log("Browser exited fullscreen externally (ESC key)");
        setIsFullscreen(false);
      }
    };

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isFullscreen) {
        console.log("ESC pressed - immediately hiding container");
        // ✅ Immediately hide the container on ESC
        setIsFullscreen(false);
      }
    };

    // Event listeners
    document.addEventListener("enterpictureinpicture", handlePiPChange);
    document.addEventListener("leavepictureinpicture", handlePiPChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);
    document.addEventListener("keydown", handleKeyPress);

    return () => {
      document.removeEventListener("enterpictureinpicture", handlePiPChange);
      document.removeEventListener("leavepictureinpicture", handlePiPChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange
      );
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [isFullscreen]); // Keep dependency to ensure latest state

  // ✅ Enhanced fullscreen overlay with stricter conditional rendering
  return onSources ? (
    <div
      className={cn(
        "flex flex-col justify-end gap-y-5 h-screen draggable bg-slate-900"
      )}
    >
      {/* ✅ Regular Preview (when not fullscreen) */}
      {preview && !isFullscreen && (
        <div className="relative w-6/12 self-end">
          <video
            autoPlay
            muted={isMuted}
            ref={videoElement}
            className={cn(
              "w-full bg-transparent rounded-lg border-2 border-white/20",
              "shadow-lg"
            )}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => {
              controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
              }, 1000);
            }}
          />

          {/* Video Controls Overlay */}
          <div
            className={`absolute top-2 right-2 flex gap-2 transition-opacity duration-300 ${
              showControls ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            onMouseEnter={() => {
              setShowControls(true);
              if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
              }
            }}
          >
            {/* Volume Control */}
            <button
              onClick={toggleMute}
              className="non-draggable bg-black/50 hover:bg-black/70 cursor-pointer text-white p-2 rounded-lg transition-all"
              title={isMuted ? "Unmute" : "Mute"}
            >
              <span className="text-sm">{isMuted ? "🔇" : "🔊"}</span>
            </button>

            {/* Picture in Picture */}
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

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="non-draggable bg-black/50 hover:bg-black/70 cursor-pointer text-white p-2 rounded-lg transition-all"
              title="Enter Fullscreen"
            >
              <Maximize size={16} className="text-white" />
            </button>
          </div>
        </div>
      )}

      {/* ✅ Stricter Fullscreen Overlay - Only render when BOTH conditions are true */}
      {isFullscreen && preview && (
        <div
          className="fullscreen-container fixed inset-0 z-[9999] bg-black flex items-center justify-center"
          style={{
            width: "100vw",
            height: "100vh",
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          <video
            autoPlay
            muted={isMuted}
            ref={fullscreenVideoElement}
            className="w-full h-full object-contain"
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              width: "100vw",
              height: "100vh",
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setShowControls(true)}
            onLoadedData={() => {
              console.log("Fullscreen video loaded and ready");
            }}
          />

          {/* Fullscreen Controls */}
          <div
            className={`absolute top-4 right-4 flex gap-3 z-[10000] transition-opacity duration-300 ${
              showControls ? "opacity-100" : "opacity-0"
            }`}
            onMouseEnter={() => {
              setShowControls(true);
              if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
              }
            }}
          >
            {/* Volume Control in Fullscreen */}
            <button
              onClick={toggleMute}
              className="non-draggable bg-black/70 hover:bg-black/90 cursor-pointer text-white p-3 rounded-lg transition-all shadow-lg"
              title={isMuted ? "Unmute" : "Mute"}
            >
              <span className="text-lgff">{isMuted ? "🔇" : "🔊"}</span>
            </button>

            {/* Picture in Picture */}
            <button
              onClick={togglePiP}
              className="non-draggable bg-black/70 hover:bg-black/90 cursor-pointer text-white p-3 rounded-lg transition-all shadow-lg"
              title="Picture in Picture"
            >
              <PictureInPicture2
                size={20}
                className={isPiP ? "text-green-400" : "text-white"}
              />
            </button>

            {/* Exit Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="non-draggable bg-red-500 hover:bg-red-600 cursor-pointer text-white p-3 rounded-lg transition-all shadow-lg"
              title="Exit Fullscreen"
            >
              <X size={20} />
            </button>
          </div>

          {/* Exit Instructions */}
          <div
            className={`absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-lg text-center transition-opacity duration-300 z-[10000] ${
              showControls ? "opacity-100" : "opacity-0"
            }`}
            onMouseEnter={() => setShowControls(true)}
          >
            <div className="flex items-center gap-2 text-sm">
              <kbd className="bg-white/20 px-2 py-1 rounded font-mono text-xs">
                ESC
              </kbd>
              <span>or click</span>
              <span className="bg-red-600 px-2 py-1 rounded text-xs">❌</span>
              <span>to exit fullscreen</span>
            </div>
          </div>
        </div>
      )}

      {/* Studio Tray Controls - Hidden in fullscreen */}
      {!isFullscreen && (
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
                console.log(
                  `📺 Preview ${newPreview ? "enabled" : "disabled"}`
                );
                return newPreview;
              });
            }}
            size={32}
            fill={preview ? "#10B981" : "white"}
            className="non-draggable cursor-pointer hover:opacity-60 transition-all"
            stroke={preview ? "#10B981" : "white"}
          />
        </div>
      )}
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
